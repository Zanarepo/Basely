'use server'
import { chainDocumentGeneration } from './core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../prd-templates'
import { STATIC_TEMPLATES } from '../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'


export async function draftProblemDiscoveryFromMarketResearch(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'problem_discovery_workspace', 
    'market_research_report',
    'Senior Product Manager',
    'Synthesize the upstream Market Research into a Problem Discovery framework.',
    templateId
  )
}

export async function draftCustomerResearchFromProblemDiscovery(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'customer_research_strategy', 
    'problem_discovery_workspace',
    'Senior User Researcher',
    'Synthesize the upstream Problem Discovery into a Customer Research Strategy.',
    templateId
  )
}

export async function draftProblemDefinitionFromCustomerResearch(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'problem_definition_workspace', 
    'customer_research_strategy',
    'Senior Product Manager',
    'Synthesize the upstream Customer Research into a crisp Problem Definition.',
    templateId
  )
}

export async function draftOpportunityAssessmentFromProblemDefinition(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'opportunity_assessment_workspace', 
    'problem_definition_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Problem Definition and Customer Insights into an Opportunity Assessment with business impact, technical feasibility, and market risk.',
    templateId
  )
}

export async function draftProductStrategyFromOpportunityAssessment(projectId: string, templateId?: string) {
  const result = await chainDocumentGeneration(
    projectId, 
    'product_strategy_document', 
    'opportunity_assessment_workspace',
    'VP of Product',
    'Synthesize the upstream Opportunity Assessment into a comprehensive Product Strategy aligned with Company Goals.',
    templateId
  )
  
  // If successful, also parse and sync the structured fields to the live Strategy Canvas!
  if (result.ok && result.data) {
    try {
      await upsertStrategyCanvasFromAI(projectId, result.data)
    } catch (err) {
      console.error('Failed to auto-sync strategy canvas from document generation', err)
    }
  }
  
  return result
}

// Backward compatibility alias
export const draftProductStrategyFromProblemDefinition = draftProductStrategyFromOpportunityAssessment
export const draftOpportunityAssessmentFromStrategy = draftOpportunityAssessmentFromProblemDefinition

export async function generateRiceItemsFromOpportunityAssessment(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch Opportunity Assessment upstream doc
    const { data: upstreamDoc, error: upErr } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'opportunity_assessment_workspace')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (upErr || !upstreamDoc?.free_text_content) {
      return { ok: false, error: 'Opportunity Assessment document is missing or empty. Please generate it first.' }
    }

    const upstreamText = Object.entries(upstreamDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
      .join('\n\n')

    // 2. Get project org_id
    const { data: project } = await adminSupabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    const orgId = organizationId || project?.organization_id || ''

    // 3. AI Prompt — output structured RICE items
    const systemPrompt = `You are Praz-AI, a Senior Product Manager specializing in feature prioritization. 
Analyze the provided Opportunity Assessment and extract 6-12 distinct, execution-ready feature initiatives as a RICE prioritization matrix.

For each initiative, estimate:
- reach: number of users impacted per quarter (1-10 scale)
- impact: impact on the goal when it hits (1=minimal, 2=low, 3=medium, 5=high, 10=massive)  
- confidence: confidence level in your estimates as percentage (50, 70, 80, 100)
- effort: person-months of work required (1-10 scale, 1=days, 10=quarters)
- moscow_status: one of "Must", "Should", "Could", "Wont"

Return ONLY a strictly valid JSON object with this exact structure:
{
  "items": [
    {
      "title": "Feature initiative name (clear, action-oriented)",
      "description": "1-2 sentence description of what this initiative does and why it matters",
      "reach": 7,
      "impact": 5,
      "confidence": 80,
      "effort": 3,
      "moscow_status": "Must"
    }
  ]
}

CRITICAL CITATION & EVIDENCE REQUIREMENT: Where applicable, include Google Search verification links inline.
CRITICAL: Return ONLY valid JSON. No markdown wrapper, no explanation outside the JSON object.`

    const parsed = await generateStructuredJson<{ items: Array<{
      title: string
      description: string
      reach: number
      impact: number
      confidence: number
      effort: number
      moscow_status: string
    }> }>({
      systemPrompt,
      userPrompt: `[OPPORTUNITY ASSESSMENT]\n${upstreamText}`,
    })

    if (!parsed?.items?.length) {
      return { ok: false, error: 'AI did not return any prioritization items.' }
    }

    // 4. Bulk-insert into product_backlog_items
    const rows = parsed.items.map(item => ({
      project_id: projectId,
      organization_id: orgId,
      title: item.title || 'Untitled Initiative',
      description: item.description || '',
      reach: Number(item.reach) || 5,
      impact: Number(item.impact) || 3,
      confidence: Number(item.confidence) || 80,
      effort: Number(item.effort) || 3,
      moscow_status: (['Must','Should','Could','Wont'].includes(item.moscow_status) ? item.moscow_status : 'Should') as any,
      updated_at: new Date().toISOString(),
    }))

    const { error: insertErr } = await adminSupabase
      .from('product_backlog_items')
      .insert(rows)

    if (insertErr) {
      return { ok: false, error: insertErr.message }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { ok: true, count: rows.length }

  } catch (err: any) {
    console.error('[generateRiceItemsFromOpportunityAssessment Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate RICE items' }
  }
}
