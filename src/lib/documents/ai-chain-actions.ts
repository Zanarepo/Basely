'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from './prd-templates'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/actions'

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
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

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
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

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
 * 3. Synthesize PRD from Roadmap — All 23 sections
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
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

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
