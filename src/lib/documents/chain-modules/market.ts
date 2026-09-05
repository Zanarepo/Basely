'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../prd-templates'
import { STATIC_TEMPLATES } from '../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'


export async function draftMarketResearchFromBusinessCase(
  projectId: string,
  templateVariantId: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // Fetch Business Case
    const { data: bcs } = await adminSupabase
      .from('business_cases')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Fetch Feasibility Study
    const { data: fss } = await adminSupabase
      .from('feasibility_studies')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    const businessCase = bcs?.[0]
    const feasibility = fss?.[0]

    if (!businessCase && !feasibility) {
      return { ok: false, error: 'A Business Case or Feasibility Study is required to draft Market Research.' }
    }

    const rawContext = `
[BUSINESS CASE]
${businessCase ? JSON.stringify(businessCase, null, 2) : 'N/A'}

[FEASIBILITY STUDY]
${feasibility ? JSON.stringify(feasibility, null, 2) : 'N/A'}
`

    const systemPrompt = `You are Praz-AI, a Senior Market Researcher. Synthesize the provided Business Case and Feasibility Study into a comprehensive Market Research document.
Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
{
  "executive_summary": "Summary of research purpose and high-level findings.",
  "research_purpose": "The core business decision this research will inform.",
  "market_definition": "Market boundaries and segment definitions.",
  "tam_sam_som_sizing": "Estimated TAM, SAM, and SOM based on business case assumptions.",
  "market_growth": "Market growth rate, drivers, and constraints.",
  "target_customer_research": "Demographics and psychographics of target customers.",
  "customer_problems": "Core customer pain points to be solved.",
  "customer_jtbd": "Jobs-to-be-Done (JTBD) framework analysis.",
  "customer_research_methods": "Proposed methodology for further customer validation.",
  "customer_research_findings": "Initial assumptions on customer needs.",
  "competitor_research": "Overview of direct and indirect competitors.",
  "competitive_gap_analysis": "Where competitors are failing and the gap we can fill.",
  "pricing_research": "Initial pricing assumptions or benchmarks.",
  "market_drivers_barriers": "Key enablers and barriers to entry.",
  "regulatory_environmental": "Regulatory compliance, legal, or environmental factors.",
  "swot_analysis": "SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats.",
  "market_opportunities": "Primary areas of opportunity.",
  "hypotheses_assumptions": "Core hypotheses to test in the market.",
  "key_insights": "Synthesized insights from the analysis.",
  "research_conclusions": "Final conclusion on market attractiveness.",
  "recommendations": "Strategic recommendations for product development.",
  "strategic_implications": "How this impacts the product roadmap.",
  "research_to_strategy_mapping": "Mapping of research findings to strategic pillars.",
  "research_limitations": "Limitations of this initial assessment.",
  "sources": "Assumed sources or required external data sources.",
  "research_decision": "Proceed, Pivot, or Kill recommendation based on the data.",
  "next_steps": "Immediate next steps for the team.",
  "approval_signoff": "Required executive approvals."
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends (e.g., tam_sam_som_sizing, market_growth, competitor_research), you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      __prd_template_variant: templateVariantId,
    }

    return { ok: true, data: freeTextPayload }
  } catch (err: any) {
    console.error('[draftMarketResearchFromBusinessCase Error]:', err)
    return { ok: false, error: err.message || 'Failed to draft Market Research' }
  }
}

/**
 * Drafts the Competitive Analysis Matrix document spec based on the Competitive Intelligence matrix data.
 */
export async function draftCompetitiveSpecFromMatrix(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch the project strategy to get the matrix data
    const { data: project, error: pErr } = await adminSupabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single()

    const { data: strategy } = await adminSupabase
      .from('product_strategies')
      .select('target_market, competitive_moats, custom_attributes')
      .eq('project_id', projectId)
      .single()

    if (pErr || !project) {
      return { ok: false, error: 'Failed to fetch project strategy data.' }
    }

    const attrs = strategy?.custom_attributes || {}

    const rawContext = `
[PROJECT CONTEXT]
Product Name: ${project.name || 'Unknown'}
Description: ${project.description || 'N/A'}
Target Market: ${strategy?.target_market || 'N/A'}

[COMPETITORS]
Competitor A: ${attrs.competitor_a_name || 'N/A'}
Competitor B: ${attrs.competitor_b_name || 'N/A'}

[FEATURE MATRIX]
${JSON.stringify(attrs.competitive_features || [], null, 2)}

[COMPETITIVE MOATS]
${JSON.stringify(strategy?.competitive_moats || [], null, 2)}
`

    const systemPrompt = `You are Praz-AI, a Senior Market Researcher. Synthesize the provided Feature Matrix and Moats into a comprehensive Competitive Analysis Document Spec.
Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
{
  "market_scope": "Define the market and the scope of this competitive analysis.",
  "direct_competitors": "Detailed overview of the direct competitors identified.",
  "indirect_competitors": "Overview of potential indirect competitors or substitutes.",
  "feature_comparison": "A deep-dive textual analysis summarizing the Feature Matrix provided. Highlight areas where we lead, lag, or have a moat.",
  "pricing_comparison": "Inferred pricing or business model comparison based on the market.",
  "gtm_comparison": "Inferred Go-to-Market strategies for us vs competitors.",
  "key_takeaways": "Strategic takeaways and our differentiation edge."
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      __prd_template_variant: 'competitive_analysis_matrix',
    }

    return { ok: true, data: freeTextPayload }
  } catch (err: any) {
    console.error('[draftCompetitiveSpecFromMatrix Error]:', err)
    return { ok: false, error: err.message || 'Failed to draft Competitive Spec' }
  }
}

