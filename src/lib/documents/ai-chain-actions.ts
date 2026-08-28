'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from './prd-templates'
import { STATIC_TEMPLATES } from './static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

export async function draftMarketResearchFromBusinessCase(
  projectId: string,
  organizationId: string,
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
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, for sections involving data, sizing, and trends (e.g., tam_sam_som_sizing, market_growth, competitor_research), you MUST include a Google Search link that the user can click to instantly verify your claim. Format: \`[Verify on Google](https://www.google.com/search?q=Your+Search+Query)\`. Never output raw numbers or statistics without a linked search source.`

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
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

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
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

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
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

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

/**
 * 3. Synthesize Product Strategy from Charter & Scope
 */
export async function synthesizeStrategyFromCharterAndScope(
  projectId: string,
  organizationId: string,
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
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

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

/**
 * 4. Synthesize PRD from Roadmap — All 23 sections
 */
export async function synthesizePrdFromRoadmap(
  projectId: string,
  roadmapContent: Record<string, string>
): Promise<{ ok: boolean; prdDocId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const rawRoadmapText = Object.entries(roadmapContent)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[Section: ${k}]\n${v}`)
      .join('\n\n')

    const systemPrompt = `You are Praz-AI, a Senior Technical Product Manager. You will receive a Product Roadmap.
Synthesize this Roadmap into a comprehensive 23-section Product Requirements Document (PRD).
Format your output as a JSON object with the following exact keys. Each value must be a rich markdown string with detailed content:
{
  "executive_summary": "### 1.1 Feature Overview\\n[Detailed overview]\\n\\n### 1.2 Problem Statement\\n> [Problem narrative]\\n\\n### 1.3 Opportunity\\n[Business impact]",
  "goals_objectives": "### 2.1 Feature Goals\\n1. [Goal 1]\\n2. [Goal 2]\\n\\n### 2.2 Success Criteria\\n- [ ] [Criterion]\\n\\n### 2.3 Non-Goals\\n- [Non-goal]",
  "user_personas": "### Primary Persona: [Role]\\n- **Needs:** ...\\n- **Pain Points:** ...\\n\\n### Secondary Persona: [Role]\\n- **Needs:** ...",
  "user_stories": "### US-01 — [Story]\\n**As a** [user] **I want to** [action] **So that** [benefit]\\n\\n### US-02 — [Story]\\n**As a** [user] **I want to** [action] **So that** [benefit]",
  "functional_requirements": "### FR-01: [Requirement]\\n**Description:** [Details]\\n- The system shall...\\n\\n### FR-02: [Requirement]\\n- The system shall...",
  "user_flow": "### Primary Flow\\n1. [Step]\\n\\n### Alternative Flow\\n1. [Step]\\n\\n### Error Flow\\n1. [Step]",
  "ui_ux_requirements": "### Screens Required\\n- [Screen 1]\\n- [Loading State]\\n- [Error State]\\n\\n### Design Guidelines\\n- [Guidelines]",
  "business_rules": "| ID | Business Rule |\\n|---|---|\\n| BR-01 | [Rule] |\\n| BR-02 | [Rule] |",
  "data_requirements": "### Inputs & Validation\\n| Field | Type | Required | Rule |\\n|---|---|---|---|\\n\\n### Output & Data Changes\\n- [Changes]",
  "permissions_access_control": "| User Role | View | Create | Edit | Delete | Approve |\\n|---|:---:|:---:|:---:|:---:|:---:|\\n| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |",
  "notifications_channels": "### Triggers\\n- [Event]\\n\\n### Channels\\n- In-app / Email / Push",
  "non_functional_requirements": "### Performance\\n- Load < 2s\\n\\n### Security\\n- [Requirements]\\n\\n### Accessibility\\n- WCAG AA",
  "analytics_tracking": "### Events\\n| Event | Trigger | Properties |\\n|---|---|---|\\n\\n### Key Metrics\\n- [Metrics]",
  "acceptance_criteria": "### AC-01\\n**Given** [condition] **When** [action] **Then** [result]\\n\\n### AC-02\\n**Given** [condition] **When** [action] **Then** [result]",
  "edge_cases": "The system must handle:\\n- Duplicate submissions\\n- Network issues\\n- Empty states\\n- Concurrent updates",
  "technical_considerations": "### Frontend\\n- [Approach]\\n\\n### Backend\\n- [Approach]\\n\\n### Infrastructure\\n- [Dependencies]",
  "qa_testing_requirements": "### Testing Suites\\n- [ ] Unit\\n- [ ] Integration\\n- [ ] E2E\\n\\n### UAT Criteria\\n- [Criteria]",
  "sprint_scope": "### In Scope\\n- [Items]\\n\\n### Out of Scope\\n- [Items]\\n\\n### Checklist\\n- [ ] UI done\\n- [ ] Backend done\\n- [ ] Tests pass",
  "dependencies_risks": "| Type | Description | Impact | Mitigation | Owner |\\n|---|---|---|---|---|\\n| [Type] | [Details] | [Impact] | [Plan] | [Owner] |",
  "definition_of_done": "Done when:\\n- [ ] All AC pass\\n- [ ] Code reviewed\\n- [ ] Tests pass\\n- [ ] QA approved\\n- [ ] Deployed",
  "open_questions": "| # | Question | Owner | Due | Status |\\n|---|---|---|---|---|\\n| 1 | [Question] | [Owner] | [Date] | Open |",
  "decisions_log": "| Date | Decision | Rationale | Decided By |\\n|---|---|---|---|\\n| [Date] | [Decision] | [Why] | [Owner] |",
  "related_documents_approvals": "### Approval Matrix\\n| Role | Name | Status | Date |\\n|---|---|---|---|\\n| PM | [Name] | Pending | |\\n\\n### Related Docs\\n- Strategy, Roadmap, Research"
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawRoadmapText || 'Product Roadmap Summary.',
    })

    // Map to standard_prd keys for backward compatibility
    const standardPrdMappings: Record<string, string> = {
      prd_objective: parsedResult.executive_summary || '',
      prd_scope_in: parsedResult.sprint_scope || '',
      prd_scope_out: parsedResult.goals_objectives || '',
      prd_acceptance_criteria: parsedResult.acceptance_criteria || '',
      prd_telemetry: parsedResult.analytics_tracking || '',
      prd_wireframes: parsedResult.ui_ux_requirements || '',
    }

    const prdVariant = 'enterprise_full_prd'
    const syncTpl = getSyncDocumentTemplate('product_requirements_document', prdVariant)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      ...standardPrdMappings,
      __prd_template_variant: prdVariant,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'product_requirements_document')
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
      return { ok: true, prdDocId: existing.id }
    } else {
      const { data: inserted, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'product_requirements_document',
          custom_template_id: null,
          free_text_content: freeTextPayload,
          created_at: now,
          updated_at: now,
          is_snapshot: false,
        })
        .select('id')
        .single()

      if (error) return { ok: false, error: error.message }
      return { ok: true, prdDocId: inserted.id }
    }
  } catch (err: any) {
    console.error('[synthesizePrdFromRoadmap Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize PRD' }
  }
}

/**
 * 4. Generate OKRs from Product Strategy
 */
export async function generateOkrsFromStrategy(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch Strategy
    const { data: strategy, error: stratErr } = await adminSupabase
      .from('product_strategies')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (stratErr || !strategy) return { ok: false, error: 'Product Strategy not found. Please complete the Strategy Canvas first.' }

    // 2. Prepare Context for AI
    const context = `
      Vision: ${strategy.vision_statement}
      Target Market: ${strategy.target_market}
      Goals: ${JSON.stringify(strategy.product_goals || [])}
      Pillars: ${JSON.stringify(strategy.strategic_pillars || [])}
      Bets: ${JSON.stringify(strategy.strategic_bets || [])}
    `

    const systemPrompt = `You are a Chief Strategy Officer. Generate 3-5 high-impact OKRs (Objectives and Key Results) based on the provided Product Strategy context.
    Format your output as a JSON object with a single key "objectives" containing an array of objects:
    {
      "objectives": [
        {
          "title": "Objective Title",
          "description": "Why this matters",
          "timeframe": "Q3 2026",
          "key_results": [
            {
              "title": "Key Result Title",
              "target_value": "Numeric target (e.g., 500000)",
              "unit": "USD, %, Users, etc."
            }
          ]
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      objectives: {
        title: string
        description: string
        timeframe: string
        key_results: { title: string; target_value: string; unit: string }[]
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.objectives || parsedResult.objectives.length === 0) {
      return { ok: false, error: 'Failed to generate objectives' }
    }

    // 3. Insert into DB
    for (const obj of parsedResult.objectives) {
      const { data: insertedObj, error: objErr } = await adminSupabase
        .from('okr_objectives')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          title: obj.title,
          description: obj.description,
          timeframe: obj.timeframe,
          progress: 0,
          status: 'on_track',
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (objErr || !insertedObj) continue

      const krsToInsert = obj.key_results.map(kr => ({
        objective_id: insertedObj.id,
        title: kr.title,
        baseline_value: '0',
        target_value: kr.target_value,
        current_value: '0',
        progress: 0,
        confidence_score: 5,
        unit: kr.unit,
        status: 'on_track',
        created_at: now,
        updated_at: now
      }))

      if (krsToInsert.length > 0) {
        await adminSupabase.from('okr_key_results').insert(krsToInsert)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateOkrsFromStrategy Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate OKRs' }
  }
}

/**
 * 5. Auto Align Roadmap to OKRs
 */
export async function autoAlignRoadmapToOkrs(
  projectId: string
): Promise<{ ok: boolean; alignedCount?: number; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch OKRs
    const { data: okrs } = await adminSupabase
      .from('okr_objectives')
      .select('id, title, description')
      .eq('project_id', projectId)

    if (!okrs || okrs.length === 0) return { ok: false, error: 'No OKRs found to align with.' }

    // 2. Fetch Backlog Items without an OKR
    const { data: backlogItems } = await adminSupabase
      .from('product_backlog_items')
      .select('id, title, description')
      .eq('project_id', projectId)
      .is('primary_okr_id', null)

    if (!backlogItems || backlogItems.length === 0) return { ok: false, error: 'No orphaned roadmap items to align.' }

    const systemPrompt = `You are an AI Product Operations Manager.
    Your job is to match Product Backlog Items to the most appropriate Strategic OKR.
    
    OKRs Available:
    ${JSON.stringify(okrs)}

    Backlog Items to align:
    ${JSON.stringify(backlogItems)}

    Return a JSON object with a single key "alignments" containing an array of mappings:
    {
      "alignments": [
        {
          "backlog_item_id": "item-id",
          "okr_id": "okr-id"
        }
      ]
    }
    CRITICAL: Only match items if there is a reasonable strategic fit. It's okay to omit an item if it doesn't fit any OKR.`

    const parsedResult = await generateStructuredJson<{
      alignments: { backlog_item_id: string; okr_id: string }[]
    }>({
      systemPrompt,
      userPrompt: 'Align these backlog items to the OKRs.',
    })

    if (!parsedResult.alignments || parsedResult.alignments.length === 0) {
      return { ok: true, alignedCount: 0 }
    }

    let count = 0
    // 3. Update DB
    for (const alignment of parsedResult.alignments) {
      if (!alignment.okr_id || !alignment.backlog_item_id) continue
      const { error } = await adminSupabase
        .from('product_backlog_items')
        .update({ primary_okr_id: alignment.okr_id })
        .eq('id', alignment.backlog_item_id)
      
      if (!error) count++
    }

    return { ok: true, alignedCount: count }
  } catch (err: any) {
    console.error('[autoAlignRoadmapToOkrs Error]:', err)
    return { ok: false, error: err.message || 'Failed to auto align roadmap.' }
  }
}


/**
 * 6. Generate North Star & Growth Levers from Strategy
 */
export async function generateNorthStarFromStrategy(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch Strategy
    const { data: strategy, error: stratErr } = await adminSupabase
      .from('product_strategies')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (stratErr || !strategy) return { ok: false, error: 'Product Strategy not found. Please complete the Strategy Canvas first.' }

    // 2. Prepare Context for AI
    const context = `
      Vision: ${strategy.vision_statement}
      Target Market: ${strategy.target_market}
      Goals: ${JSON.stringify(strategy.product_goals || [])}
      Pillars: ${JSON.stringify(strategy.strategic_pillars || [])}
      Bets: ${JSON.stringify(strategy.strategic_bets || [])}
    `

    const systemPrompt = `You are a Chief Strategy Officer and Growth Expert.
    Based on the provided Product Strategy context, define ONE primary "North Star" quantitative metric, and 3-4 supporting "Growth Levers" (e.g. acquisition, activation, retention, revenue, efficiency).
    
    Format your output as a JSON object with a single key "metrics" containing an array of objects. The first object MUST be the North Star.
    {
      "metrics": [
        {
          "name": "Metric Name",
          "category": "north_star | acquisition | activation | retention | revenue | efficiency",
          "current_value": "Current numeric string (e.g. '0')",
          "target_value": "Target numeric string (e.g. '10000')",
          "unit": "percentage | currency | number",
          "frequency": "daily | weekly | monthly | quarterly | yearly"
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      metrics: {
        name: string
        category: 'north_star' | 'acquisition' | 'activation' | 'retention' | 'revenue' | 'efficiency'
        current_value: string
        target_value: string
        unit: 'percentage' | 'currency' | 'number'
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.metrics || parsedResult.metrics.length === 0) {
      return { ok: false, error: 'Failed to generate metrics' }
    }

    // 3. Insert into DB
    const kpisToInsert = parsedResult.metrics.map(m => ({
      organization_id: organizationId,
      project_id: projectId,
      name: m.name,
      category: m.category,
      current_value: m.current_value,
      target_value: m.target_value,
      unit: m.unit,
      frequency: m.frequency,
      status: 'on_track',
      trend_direction: 'stable',
      created_at: now,
      updated_at: now
    }))

    const { error: insertErr } = await adminSupabase.from('product_kpis').insert(kpisToInsert)
    if (insertErr) return { ok: false, error: insertErr.message }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateNorthStarFromStrategy Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate North Star metrics' }
  }
}

/**
 * 7. Synthesize Lessons Learned (Retrospective)
 */
export async function synthesizeLessonsLearned(
  projectId: string,
  releaseId: string | null,
  rawNotes: string
): Promise<{ ok: boolean; insights?: any[]; id?: string; error?: string }> {
  try {
    const systemPrompt = `You are a Continuous Improvement Engine.
    Analyze the provided raw Post-Implementation Review (Retrospective) notes from a recent software release.
    Synthesize these notes into actionable, systemic insights (both positive 'moats/advantages' and negative 'risks/issues').
    
    Format your output as JSON:
    {
      "insights": [
        {
          "category": "risk | moat | process_improvement",
          "summary": "Brief summary of the insight",
          "description": "Detailed explanation",
          "action_item": "What should be done differently next time or added to strategy?"
        }
      ]
    }`

    const parsedResult = await generateStructuredJson<{
      insights: { category: string; summary: string; description: string; action_item: string }[]
    }>({
      systemPrompt,
      userPrompt: `Raw Retro Notes:\n${rawNotes}`
    })

    if (!parsedResult.insights) return { ok: false, error: 'Failed to synthesize insights' }

    const adminSupabase = createAdminClient()
    
    let lessonId = ''
    
    if (releaseId) {
      const { data: existing } = await adminSupabase
        .from('product_lessons_learned')
        .select('id')
        .eq('release_id', releaseId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
        
      if (existing) {
        await adminSupabase.from('product_lessons_learned').update({
          raw_notes: rawNotes,
          synthesized_insights: parsedResult.insights,
          status: 'synthesized',
          updated_at: new Date().toISOString()
        }).eq('id', existing.id)
        lessonId = existing.id
      } else {
        const { data: inserted } = await adminSupabase.from('product_lessons_learned').insert({
          project_id: projectId,
          release_id: releaseId,
          raw_notes: rawNotes,
          synthesized_insights: parsedResult.insights,
          status: 'synthesized'
        }).select('id').single()
        lessonId = inserted?.id || ''
      }
    } else {
       const { data: existing } = await adminSupabase
         .from('product_lessons_learned')
         .select('id')
         .eq('project_id', projectId)
         .is('release_id', null)
         .order('created_at', { ascending: false }).limit(1).maybeSingle()

       if (existing) {
         await adminSupabase.from('product_lessons_learned').update({
           raw_notes: rawNotes,
           synthesized_insights: parsedResult.insights,
           status: 'synthesized',
           updated_at: new Date().toISOString()
         }).eq('id', existing.id)
         lessonId = existing.id
       } else {
         const { data: inserted } = await adminSupabase.from('product_lessons_learned').insert({
            project_id: projectId,
            raw_notes: rawNotes,
            synthesized_insights: parsedResult.insights,
            status: 'synthesized'
          }).select('id').single()
          lessonId = inserted?.id || ''
       }
    }

    return { ok: true, insights: parsedResult.insights, id: lessonId }
  } catch (err: any) {
    console.error('[synthesizeLessonsLearned Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize lessons.' }
  }
}

/**
 * 8. Propose Strategy Updates from Lessons
 */
export async function proposeStrategyUpdates(
  projectId: string,
  lessonsLearnedId: string,
  insights?: any[]
): Promise<{ ok: boolean; proposedRisks?: any[]; proposedMoats?: any[]; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    
    let fetchedInsights = insights
    
    if (!fetchedInsights && lessonsLearnedId && lessonsLearnedId !== 'temp') {
      const { data: lesson } = await adminSupabase
        .from('product_lessons_learned')
        .select('synthesized_insights')
        .eq('id', lessonsLearnedId)
        .single()
      fetchedInsights = lesson?.synthesized_insights
    }
    
    if (!fetchedInsights || !fetchedInsights.length) return { ok: false, error: 'No insights found to propose updates from.' }
    
    const { data: strategy } = await adminSupabase
      .from('product_strategies')
      .select('strategic_risks, execution_moats')
      .eq('project_id', projectId)
      .single()
      
    const currentRisks = strategy?.strategic_risks || []
    const currentMoats = strategy?.execution_moats || []

    const systemPrompt = `You are a Chief Strategy Officer.
    Review the synthesized Retrospective insights and the CURRENT Product Strategy Risks and Moats.
    Propose NEW strategic risks and execution moats to append to the Strategy based ONLY on the new insights.
    Do not duplicate existing risks/moats. If an insight doesn't warrant a strategy update, ignore it.
    
    Format your output as JSON:
    {
      "proposed_risks": [
        { "title": "...", "description": "...", "mitigation_strategy": "..." }
      ],
      "proposed_moats": [
        { "title": "...", "description": "...", "impact": "..." }
      ]
    }`

    const parsedResult = await generateStructuredJson<{
      proposed_risks: any[];
      proposed_moats: any[];
    }>({
      systemPrompt,
      userPrompt: `CURRENT RISKS:\n${JSON.stringify(currentRisks)}\n\nCURRENT MOATS:\n${JSON.stringify(currentMoats)}\n\nNEW INSIGHTS:\n${JSON.stringify(fetchedInsights)}`
    })

    return { 
      ok: true, 
      proposedRisks: parsedResult.proposed_risks || [], 
      proposedMoats: parsedResult.proposed_moats || [] 
    }
  } catch (err: any) {
    console.error('[proposeStrategyUpdates Error]:', err)
    return { ok: false, error: err.message || 'Failed to propose updates.' }
  }
}

/**
 * 8. Generate OKRs from Project Charter / Scope Statement
 */
export async function generateOkrsFromProject(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch Project Documents (Charter or Scope Statement)
    const { data: projectDocs, error: docErr } = await adminSupabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', ['project_charter', 'scope_statement'])
      .order('created_at', { ascending: false })

    if (docErr || !projectDocs || projectDocs.length === 0) {
      return { ok: false, error: 'No Project Charter or Scope Statement found. Please complete project initiation first.' }
    }

    // Use the most recent/relevant document
    const bestDoc = projectDocs.find(d => d.document_type === 'project_charter') || projectDocs[0]
    const content = bestDoc.free_text_content as Record<string, string> || {}

    // Prepare Context for AI
    const rawText = Object.entries(content)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.replace(/_/g, ' ').toUpperCase()}]\n${v}`)
      .join('\n\n')

    const context = `Source Document: ${bestDoc.document_type === 'project_charter' ? 'Project Charter' : 'Scope Statement'}\n\n${rawText.substring(0, 10000)}`

    const systemPrompt = `You are a Project Management Executive. Generate 3-5 high-impact OKRs (Objectives and Key Results) based on the provided Project Document context (Charter or Scope).
    Focus on project delivery success, budget, timeline, and scope objectives.
    Format your output as a JSON object with a single key "objectives" containing an array of objects:
    {
      "objectives": [
        {
          "title": "Objective Title",
          "description": "Why this matters for the project",
          "timeframe": "Q3 2026",
          "key_results": [
            {
              "title": "Key Result Title",
              "target_value": "Numeric target (e.g., 100, 0, 50000)",
              "unit": "%, Days, USD, etc."
            }
          ]
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      objectives: {
        title: string
        description: string
        timeframe: string
        key_results: { title: string; target_value: string; unit: string }[]
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.objectives || parsedResult.objectives.length === 0) {
      return { ok: false, error: 'Failed to generate project objectives' }
    }

    // 3. Insert into DB
    for (const obj of parsedResult.objectives) {
      const { data: insertedObj, error: objErr } = await adminSupabase
        .from('okr_objectives')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          title: obj.title,
          description: obj.description,
          timeframe: obj.timeframe,
          progress: 0,
          status: 'on_track',
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (objErr || !insertedObj) continue

      const krsToInsert = obj.key_results.map(kr => ({
        objective_id: insertedObj.id,
        title: kr.title,
        baseline_value: '0',
        target_value: kr.target_value,
        current_value: '0',
        progress: 0,
        confidence_score: 5,
        unit: kr.unit,
        status: 'on_track',
        created_at: now,
        updated_at: now
      }))

      if (krsToInsert.length > 0) {
        await adminSupabase.from('okr_key_results').insert(krsToInsert)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateOkrsFromProject Error]:', err)
    return { ok: false, error: err.message || 'An unexpected error occurred generating Project OKRs.' }
  }
}

/**
 * 4. Synthesize Risk Register from Charter and Scope
 */
export async function synthesizeRiskRegisterFromCharterAndScope(
  projectId: string
): Promise<{ ok: boolean; documentId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // Fetch Charter and Scope documents
    const { data: documents } = await adminSupabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .in('document_type', ['charter', 'scope_statement'])
      .eq('is_snapshot', false)

    if (!documents || documents.length === 0) {
      return { ok: false, error: 'Project Charter and Scope Statement are missing.' }
    }

    const charterDoc = documents.find(d => d.document_type === 'charter')
    const scopeDoc = documents.find(d => d.document_type === 'scope_statement')

    let combinedContext = ''
    if (charterDoc?.free_text_content) {
      combinedContext += `--- PROJECT CHARTER ---\n${JSON.stringify(charterDoc.free_text_content)}\n\n`
    }
    if (scopeDoc?.free_text_content) {
      combinedContext += `--- SCOPE STATEMENT ---\n${JSON.stringify(scopeDoc.free_text_content)}\n\n`
    }

    if (combinedContext.length < 100) {
      return { ok: false, error: 'Not enough content in the Charter or Scope Statement.' }
    }

    const systemPrompt = `You are Praz-AI, an expert Risk Manager. Your task is to generate a comprehensive Risk Register document for a project based on its Project Charter and Scope Statement.
Identify potential threats by looking for aggressive timelines, ambiguous scope items, complex deliverables, or external dependencies.

Format your output as a JSON object with ALL of the following exact keys corresponding to the standard risk register sections. Each value must be a rich markdown string:
{
  "purpose": "1 paragraph explaining the purpose of this risk register in the context of the project goals.",
  "risk_management_approach": "Overview of the proactive risk management process steps and methodology.",
  "risk_assessment_matrix": "Markdown table explaining Probability (1-5) and Impact (1-5) scales, and the resulting priority matrix.",
  "risk_register": "A detailed Markdown table of identified risks: | Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |",
  "top_project_risks": "Detailed breakdown of the top 3-5 most critical risks identified, and why they matter.",
  "risk_response_strategies": "Outline of Avoid, Mitigate, Transfer, Accept strategies applied to the top risks.",
  "risk_monitoring": "How risks will be tracked and reviewed throughout the project lifecycle.",
  "risk_escalation_process": "Clear escalation paths and thresholds based on risk priority.",
  "risk_review_schedule": "Frequency and format of risk reviews (e.g., Weekly Project Status Meetings).",
  "approval": "Approval sign-off table: | Role | Name | Date | Status |"
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include a Google Search link that the user can click to instantly verify your claim (e.g., [Verify on Google](https://www.google.com/search?q=Your+Search+Query)) for any claims, statistics, market sizes, or references to external data.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: `DOCUMENTS TO ANALYZE:\n${combinedContext.substring(0, 20000)}`,
    })

    const templateVariantId = 'standard_risk_register'
    const syncTpl = getSyncDocumentTemplate('risk_register', templateVariantId)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      __prd_template_variant: templateVariantId,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    // Upsert the risk register document
    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'risk_register')
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

      if (error) throw error
      return { ok: true, documentId: existing.id }
    } else {
      const { data: newDoc, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'risk_register',
          document_title: 'Risk Register',
          free_text_content: freeTextPayload,
          is_snapshot: false,
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (error) throw error
      return { ok: true, documentId: newDoc.id }
    }
  } catch (err: any) {
    console.error('[synthesizeRiskRegisterFromCharterAndScope Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize Risk Register.' }
  }
}


// ==========================================
// 12-STEP AI AUTOMATION CHAIN PIPELINE
// ==========================================

export async function chainDocumentGeneration(
  projectId: string,
  targetDocumentType: string,
  upstreamDocumentType: string,
  personaRole: string,
  actionInstruction: string,
  uiTemplateId?: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch Upstream Document
    const { data: upstreamDoc, error: upErr } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', upstreamDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (upErr || !upstreamDoc || !upstreamDoc.free_text_content) {
      return { ok: false, error: `Required upstream document (${upstreamDocumentType}) is missing or empty. Please generate it first.` }
    }

    // 2. Format Upstream Context
    const upstreamText = Object.entries(upstreamDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
      .join('\n\n')
      
    const rawContext = `
[UPSTREAM CONTEXT: ${upstreamDocumentType.toUpperCase()}]
${upstreamText}
`

    // 3. Construct JSON Schema from Target Template
    // First, try to see what template the target document is actually using
    const { data: targetDoc } = await adminSupabase
      .from('generated_documents')
      .select('id, template_id, section_definitions, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', targetDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    let template: any = null
    let sectionDefs: any[] = []

    if (targetDoc?.section_definitions && Array.isArray(targetDoc.section_definitions)) {
       sectionDefs = targetDoc.section_definitions
    } else {
       template = STATIC_TEMPLATES[targetDocumentType]
       if (!template) {
          const finalTemplateId = uiTemplateId || targetDoc?.template_id || undefined
          template = getSyncDocumentTemplate(targetDocumentType, finalTemplateId)
       }
       if (template && template.section_definitions) {
          sectionDefs = template.section_definitions
       }
    }
    
    // Filter to only free_text sections — data_bound sections are auto-populated elsewhere
    const freeTextSections = sectionDefs.filter((s: any) => s.type !== 'data_bound')
    
    if (!freeTextSections || freeTextSections.length === 0) {
       return { ok: false, error: `No free-text sections found in template for ${targetDocumentType}.` }
    }
    
    let schemaObj: Record<string, string> = {}
    for (const section of freeTextSections) {
       let desc = `Markdown string for: ${section.title}`
       if (section.placeholder) {
         desc += `. Format exactly like this placeholder structure: ${section.placeholder.replace(/\n/g, ' ')}`
       }
       schemaObj[section.key] = desc
    }
    
    const schemaString = JSON.stringify(schemaObj, null, 2)

    // 4. Construct Prompt
    const systemPrompt = `You are Praz-AI, a ${personaRole}. ${actionInstruction}

CRITICAL CITATION & EVIDENCE REQUIREMENT:
For EVERY section you generate that includes claims, statistics, market data, competitor information, methodologies, or factual statements, you MUST provide verifiable citations within the markdown text. 
Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST include inline Google Search links that the user can click to instantly verify your claim.
Example format: "The market is expected to reach $100B by 2025 ([Verify Source](https://www.google.com/search?q=global+market+size+2025))."
If referencing the provided upstream context, cite it explicitly (e.g., "As established in the upstream document...").

Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
${schemaString}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    // 5. Merge with any existing free_text_content so data_bound sections are preserved
    const existingContent = targetDoc?.free_text_content as Record<string, string> || {}
    const mergedPayload: Record<string, string> = {
      ...existingContent,
      ...parsedResult,
    }

    // 6. Persist directly to the database — avoids client-side state race conditions
    const now = new Date().toISOString()
    if (targetDoc?.id) {
      await adminSupabase
        .from('generated_documents')
        .update({ free_text_content: mergedPayload, updated_at: now })
        .eq('id', targetDoc.id)
    } else {
      await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: targetDocumentType,
          template_id: uiTemplateId || targetDoc?.template_id || null,
          free_text_content: mergedPayload,
          is_snapshot: false,
          created_at: now,
          updated_at: now,
        })
    }

    // Invalidate the page so Next.js re-fetches the updated document
    revalidatePath(`/dashboard/projects/${projectId}`)

    return { ok: true, data: mergedPayload }

  } catch (err: any) {
    console.error(`[chainDocumentGeneration Error for ${targetDocumentType}]:`, err)
    return { ok: false, error: err.message || 'Failed to generate document' }
  }
}

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

export async function draftProductStrategyFromProblemDefinition(projectId: string, templateId?: string) {
  const result = await chainDocumentGeneration(
    projectId, 
    'product_strategy_document', 
    'problem_definition_workspace',
    'VP of Product',
    'Synthesize the upstream Problem Definition into a comprehensive Product Strategy.',
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

export async function draftOpportunityAssessmentFromStrategy(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'opportunity_assessment_workspace', 
    'product_strategy_document',
    'Senior Product Manager',
    'Synthesize the upstream Product Strategy into a tactical Opportunity Assessment.',
    templateId
  )
}

export async function draftPrioritizationFromOpportunities(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'prioritization_workspace', 
    'opportunity_assessment_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Opportunity Assessment into a RICE Prioritization matrix.',
    templateId
  )
}

export async function draftSolutionDesignFromPrioritization(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'solution_design_workspace', 
    'prioritization_workspace',
    'Senior Product Designer',
    'Synthesize the upstream context into a Product Discovery & Solution Design document.',
    templateId
  )
}

export async function draftValidationFromSolutionDesign(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'solution_validation_workspace', 
    'solution_design_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Solution Design into an Experimentation & Validation plan.',
    templateId
  )
}

export async function draftPrdFromValidation(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_requirements_document', 
    'solution_validation_workspace',
    'Technical Product Manager',
    'Synthesize the upstream Validation plan into a comprehensive Product Requirements Document (PRD).',
    templateId
  )
}

export async function draftRoadmapFromPrd(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_roadmap_document', 
    'product_requirements_document',
    'VP of Product',
    'Synthesize the upstream PRD into a Now/Next/Later Product Roadmap.',
    templateId
  )
}
