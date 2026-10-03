'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 1. Synthesize Product Strategy from Market Research — All 28 sections
 */
export async function synthesizeStrategyFromResearch(
  projectId: string,
  researchContent: Record<string, string>
): Promise<{ ok: boolean; strategyDocId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const rawResearchText = Object.entries(researchContent)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[Section: ${k}]\n${v}`)
      .join('\n\n')

    const systemPrompt = `You are Praz-AI, a Chief Product Officer. You will receive Market Research text.
Synthesize this into a comprehensive 28-section Product Strategy Document.
Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
{
  "executive_summary": "1-2 paragraph executive summary of strategic intent, market opportunity, and target growth goals.",
  "product_vision": "3-5 year Product Vision Statement describing the desired future state.",
  "product_mission": "Product Mission Statement: Daily operational mission.",
  "problem_statement": "Core Customer Problem Statement, current workarounds, and business impact.",
  "market_opportunity": "TAM/SAM/SOM opportunity analysis with financial estimates and market growth drivers.",
  "target_customers": "Primary and secondary customer personas with needs, pain points, and ICP definition.",
  "jobs_to_be_done": "Customer Jobs-to-be-Done table: | Customer Job | Current Solution | Pain | Desired Outcome |",
  "value_proposition": "Formal Value Proposition Statement (For [ICP] who [Problem], [Product] is a [Category] that [Benefit]).",
  "product_positioning": "Product Positioning Matrix comparing product vs competitors across key dimensions.",
  "competitive_landscape": "Competitive overview table: | Competitor | Strengths | Weaknesses | Market Position |",
  "product_differentiation": "3 Key Differentiators and Defensibility Moats (Technology, Network Effects, Switching Costs, Brand).",
  "strategic_bets": "3-4 Strategic Bets Table: | Bet | Why It Matters | Expected Outcome | Confidence | Timeline |",
  "strategic_pillars": "Strategic Pillars breakdown: Pillar 1-3 with Objective, Key Initiatives, Success Metrics.",
  "product_principles": "4 Guiding Product Principles that drive design and engineering tradeoffs.",
  "product_goals": "Business, Customer, Product Goals Table: | Category | Goal | Baseline | Target | Timeframe |",
  "metrics_and_kpis": "North Star Metric definition plus KPI table: | KPI | Current | Target | Frequency |",
  "roadmap_themes": "Roadmap Themes by Quarter table: | Quarter | Theme | Objective | Major Initiatives |",
  "prioritization_framework": "Feature Prioritization table: | Initiative | Customer Impact | Business Impact | Effort | Priority |",
  "business_model": "Revenue Model, Pricing Strategy tiers, Revenue Drivers, and Expansion Opportunities.",
  "gtm_considerations": "Go-To-Market strategy, Acquisition Channels, Activation Strategy, Retention Loops.",
  "assumptions": "Strategic Assumptions Matrix: | Assumption | Evidence | Confidence | Validation Method |",
  "risks": "Strategic Risk Register: | Risk | Probability | Impact | Mitigation | Owner |",
  "strategic_dependencies": "Dependencies Matrix: | Type | Dependency | Impact | Status | Owner |",
  "strategic_decisions": "Decisions Log: | Date | Decision | Rationale | Alternatives Considered | Decided By |",
  "open_questions": "Open Strategic Questions: | # | Question | Owner | Due Date | Status | Impact |",
  "strategy_review": "Review Cadence (Weekly/Monthly/Quarterly) plus 7 Core Strategy Validation Questions.",
  "related_documents": "Cross-Referenced Documents: Market Research, Personas, PRD, Roadmap, Business Case links.",
  "approval_board": "Executive Governance Approval Board: | Role | Name | Approval Status | Date |"
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawResearchText || 'Market Research Summary for SaaS Product.',
    })

    // Map to standard_product_strategy keys for backward compatibility
    const standardStrategyMappings: Record<string, string> = {
      strategy_vision: `${parsedResult.product_vision || ''}\n\n**Strategic Pillars:**\n${parsedResult.strategic_pillars || ''}`,
      executive_commentary: parsedResult.executive_summary || '',
    }

    const strategyVariant = 'master_product_strategy'
    const syncTpl = getSyncDocumentTemplate('product_strategy_document', strategyVariant)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      ...standardStrategyMappings,
      __prd_template_variant: strategyVariant,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    // Sync to live product_strategies table & Strategy Canvas Studio
    await upsertStrategyCanvasFromAI(projectId, parsedResult)

    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'product_strategy_document')
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
      return { ok: true, strategyDocId: existing.id }
    } else {
      const { data: inserted, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'product_strategy_document',
          custom_template_id: null,
          free_text_content: freeTextPayload,
          created_at: now,
          updated_at: now,
          is_snapshot: false,
        })
        .select('id')
        .single()

      if (error) return { ok: false, error: error.message }
      return { ok: true, strategyDocId: inserted.id }
    }
  } catch (err: any) {
    console.error('[synthesizeStrategyFromResearch Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize Product Strategy' }
  }
}

/**
 * 3. Synthesize Product Strategy from Charter & Scope
 */
export async function synthesizeStrategyFromCharterAndScope(
  projectId: string,
  templateVariantId: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // Fetch Charter
    const { data: charter } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'charter')
      .eq('is_snapshot', false)
      .maybeSingle()

    // Fetch Scope Statement
    const { data: scope } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'scope_statement')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (!charter || !scope) {
      return { ok: false, error: 'Both Project Charter and Scope Statement are required to draft a strategy.' }
    }

    const rawContext = `
[PROJECT CHARTER]
${JSON.stringify(charter.free_text_content)}

[SCOPE STATEMENT]
${JSON.stringify(scope.free_text_content)}
`

    const systemPrompt = `You are Praz-AI, a Chief Product Officer. You will receive a Project Charter (goals and success criteria) and a Scope Statement (strict boundaries and deliverables).
Synthesize this context into a comprehensive Product Strategy Document.
Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
{
  "executive_summary": "1-2 paragraph executive summary of strategic intent, market opportunity, and target growth goals based on the charter.",
  "product_vision": "Product Vision Statement aligned with the charter.",
  "product_mission": "Product Mission Statement: Daily operational mission.",
  "problem_statement": "Core Customer Problem Statement, current workarounds, and business impact.",
  "market_opportunity": "Market opportunity analysis.",
  "target_customers": "Primary and secondary customer personas based on scope constraints.",
  "jobs_to_be_done": "Customer Jobs-to-be-Done table: | Customer Job | Current Solution | Pain | Desired Outcome |",
  "value_proposition": "Formal Value Proposition Statement.",
  "product_positioning": "Product Positioning Matrix.",
  "competitive_landscape": "Competitive overview table.",
  "product_differentiation": "Key Differentiators and Defensibility Moats.",
  "strategic_bets": "Strategic Bets Table aligned with the charter goals.",
  "strategic_pillars": "Strategic Pillars breakdown.",
  "product_principles": "Guiding Product Principles.",
  "product_goals": "Business, Customer, Product Goals Table (must match charter success criteria).",
  "metrics_and_kpis": "North Star Metric definition plus KPI table.",
  "roadmap_themes": "Roadmap Themes by Quarter table.",
  "prioritization_framework": "Feature Prioritization table.",
  "business_model": "Revenue Model and Pricing Strategy.",
  "gtm_considerations": "Go-To-Market strategy.",
  "assumptions": "Strategic Assumptions Matrix.",
  "risks": "Strategic Risk Register (incorporating scope exclusions).",
  "strategic_dependencies": "Dependencies Matrix.",
  "strategic_decisions": "Decisions Log.",
  "open_questions": "Open Strategic Questions.",
  "strategy_review": "Review Cadence.",
  "related_documents": "Cross-Referenced Documents: Charter, Scope Statement.",
  "approval_board": "Executive Governance Approval Board."
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    const standardStrategyMappings: Record<string, string> = {
      strategy_vision: `${parsedResult.product_vision || ''}\n\n**Strategic Pillars:**\n${parsedResult.strategic_pillars || ''}`,
      executive_commentary: parsedResult.executive_summary || '',
    }

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      ...standardStrategyMappings,
      __prd_template_variant: templateVariantId,
    }

    // Sync to live product_strategies table & Strategy Canvas Studio
    await upsertStrategyCanvasFromAI(projectId, parsedResult)

    return { ok: true, data: freeTextPayload }
  } catch (err: any) {
    console.error('[synthesizeStrategyFromCharterAndScope Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize Product Strategy' }
  }
}

