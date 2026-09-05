'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 2. Synthesize Roadmap from Product Strategy
 */
export async function synthesizeRoadmapFromStrategy(
  projectId: string,
  strategyContent: Record<string, string>
): Promise<{ ok: boolean; roadmapDocId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const rawStrategyText = Object.entries(strategyContent)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[Section: ${k}]\n${v}`)
      .join('\n\n')

    const systemPrompt = `You are Praz-AI, a Director of Product Planning. You will receive a Product Strategy Document.
Synthesize this Strategy into a structured Product Roadmap.
Format your output as a JSON object with the following exact keys matching Roadmap templates:
{
  "now_horizon": "NOW Horizon (Current Quarter): High-priority initiatives actively being built with outcomes.",
  "next_horizon": "NEXT Horizon (Upcoming Quarter): Near-term strategic bets and feature expansions.",
  "later_horizon": "LATER Horizon (Future Direction): Long-term vision and architectural bets.",
  "exploring_horizon": "EXPLORING Phase: Discovery concepts being validated.",
  "roadmap_purpose": "Roadmap Purpose & Strategic Context statement.",
  "product_vision": "Product Vision & Strategic Intent summary.",
  "strategic_objectives": "Strategic Objectives & Business Outcomes Table: | ID | Strategic Objective | Business Outcome |",
  "roadmap_themes": "Strategic Roadmap Themes Table: | Theme | Description | Strategic Objective |",
  "roadmap_overview": "High-Level Roadmap Overview Table: | Initiative | Theme | Q1 | Q2 | Q3 | Q4 |",
  "detailed_initiatives": "Detailed Roadmap Initiatives (RI-001+): Problem, Desired Outcome, Impact, Metrics.",
  "quarterly_breakdown": "Quarterly Horizon Breakdown (Q1-Q4 Key Deliverables).",
  "initiative_prioritization": "Initiative Prioritization & Tradeoffs Table.",
  "roadmap_dependencies": "Cross-Functional Technical & Resource Dependencies Table.",
  "risks_and_assumptions": "Strategic Risks & Assumptions Matrix.",
  "metrics_and_outcomes": "Key Product Metrics & Target Customer Outcomes."
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawStrategyText || 'Product Strategy Summary.',
    })

    const roadmapVariant = 'now_next_later'
    const syncTpl = getSyncDocumentTemplate('roadmap_workspace', roadmapVariant)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      __prd_template_variant: roadmapVariant,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'roadmap_workspace')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const mergedFreeText = {
        ...(existing.free_text_content as Record<string, string> || {}),
        ...freeTextPayload,
      }
      const { error } = await adminSupabase
        .from('generated_documents')
        .update({
          free_text_content: mergedFreeText,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (error) return { ok: false, error: error.message }
      return { ok: true, roadmapDocId: existing.id }
    } else {
      const { data: inserted, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'roadmap_workspace',
          custom_template_id: null,
          free_text_content: freeTextPayload,
          created_at: now,
          updated_at: now,
          is_snapshot: false,
        })
        .select('id')
        .single()

      if (error) return { ok: false, error: error.message }
      return { ok: true, roadmapDocId: inserted.id }
    }
  } catch (err: any) {
    console.error('[synthesizeRoadmapFromStrategy Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize Roadmap' }
  }
}

// ==========================================
// 12-STEP AI AUTOMATION CHAIN PIPELINE
// ==========================================

export async function draftPrioritizationFromStrategy(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'prioritization_workspace', 
    'product_strategy_document',
    'Senior Product Manager',
    'Synthesize the upstream Product Strategy and Strategic Bets into a prioritized Opportunity Scoring & RICE matrix.',
    templateId
  )
}

// Backward compatibility alias
export const draftPrioritizationFromOpportunities = draftPrioritizationFromStrategy

export async function draftRoadmapFromPrioritization(
  projectId: string, 
  targetDocType: string = 'roadmap_workspace',
  templateId?: string
) {
  return chainDocumentGeneration(
    projectId, 
    targetDocType, 
    'prioritization_workspace',
    'VP of Product',
    'Synthesize the prioritized opportunities, strategic themes, and OKRs into a Now/Next/Later Product Roadmap.',
    templateId
  )
}

// Backward compatibility alias
export const draftRoadmapFromPrd = draftRoadmapFromPrioritization

