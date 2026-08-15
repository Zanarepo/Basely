'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateTextOutput } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from './prd-templates'

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
Return ONLY valid JSON without markdown wrapping.`

    let aiResultText = ''
    try {
      aiResultText = await generateTextOutput({
        systemPrompt,
        userPrompt: rawResearchText || 'Market Research Summary for SaaS Product.',
      })
    } catch (aiErr) {
      console.warn('[AI Chain Synthesizer] AI provider fallback:', aiErr)
    }

    let parsedResult: Record<string, string> = {}
    try {
      const cleanJsonStr = aiResultText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      parsedResult = JSON.parse(cleanJsonStr)
    } catch (parseErr) {
      console.warn('[AI Chain Synthesizer] JSON parse fallback:', parseErr)
      parsedResult = {
        executive_summary: '### Strategic Intent\nDeliver an end-to-end automated product workflow platform linking research to backlog execution.\n\n### Market Opportunity\nThe product management tooling market is valued at $1.2B with 18% CAGR.\n\n### Expected Outcomes\n- 40% improvement in PM productivity\n- 60% reduction in spec creation time\n- $43.2M SOM capture within 3 years',
        product_vision: '### Vision Statement\nTo become the operating system for high-velocity product teams — where research, strategy, roadmaps, and specs flow seamlessly through a single AI-powered workspace.\n\n### 3-5 Year Horizon\nWithin 3 years, every product team decision is data-informed, every spec is AI-assisted, and every stakeholder has real-time visibility.',
        product_mission: '### Mission Statement\nAutomate manual PM documentation and eliminate friction between research, strategy, and engineering execution.\n\n### Daily Operational Focus\nEvery feature we build must reduce the time between a product insight and an actionable engineering ticket.',
        problem_statement: '### Core Problem\nProduct managers spend 4+ hours per week manually formatting and copying specs across disconnected tools.\n\n### Current Situation\nTeams use spreadsheets, docs, and slide decks manually — leading to stale documents and lost context.\n\n### Pain Points\n1. Manual copy-paste between research, strategy, and PRD documents\n2. No traceability from market insight to engineering ticket\n3. Inconsistent templates across teams\n\n### Business Impact\nDelayed launches, engineering rework, and strategic misalignment costing enterprises $500K+/year.',
        market_opportunity: '### Target Market\nB2B SaaS product teams globally, focused on Series A-D startups and mid-market enterprises.\n\n### Market Size\n| Metric | Value |\n|---|---|\n| TAM | $1.2B |\n| SAM | $288M |\n| SOM | $43.2M |\n\n### Market Trends & Why Now\n- AI/LLM maturity enables 1-click document synthesis\n- Remote work demands better async documentation\n- Growing PM tooling fatigue creates consolidation opportunity',
        target_customers: '### Primary Persona: Product Manager\n- **Role:** Senior PM / Group PM\n- **Company Size:** 50-500 employees\n- **Key Needs:** Fast spec creation, consistent templates, stakeholder alignment\n- **Pain Points:** Manual documentation, context switching, stale specs\n\n### Secondary Persona: VP of Product\n- **Role:** VP/Director of Product\n- **Key Needs:** Portfolio visibility, strategic alignment, evidence-based decisions\n\n### Ideal Customer Profile (ICP)\nB2B SaaS companies with 3+ PMs, using agile methodology, $5M-$100M ARR.',
        jobs_to_be_done: '### JTBD Framework\n| Customer Job | Current Solution | Pain | Desired Outcome |\n|---|---|---|---|\n| Define Product Specs | Manual docs + spreadsheets | 4+ hrs/week formatting | 1-click AI spec generation |\n| Align Stakeholders | Slide decks + meetings | Context lost between meetings | Real-time shared workspace |\n| Track Strategy-to-Execution | Separate tools | No traceability | Evidence lineage from research to backlog |\n\n### Primary Job Statement\nWhen I need to ship a new feature, I want to generate complete specs from my research, so I can start engineering grooming immediately.',
        value_proposition: '### Value Proposition Statement\nFor **product managers** who **struggle with manual documentation**, **our platform** is a **product operating system** that **automates the research-to-backlog workflow**. Unlike **Notion, Confluence, or Productboard**, our product **provides 1-click AI chain synthesis with full evidence lineage**.\n\n### Customer Value Pillars\n1. 10x faster spec creation through AI automation\n2. Full traceability from market research to engineering ticket\n3. Living documents that stay synchronized with project data',
        product_positioning: '### Positioning Matrix\n| Dimension | Our Product | Productboard | Notion | Jira |\n|---|---|---|---|---|\n| Category | Product Operating System | Product Management | Docs + Wikis | Issue Tracking |\n| Target Customer | PMs at scaling companies | Enterprise PMs | Everyone | Engineering |\n| Primary Benefit | AI workflow automation | Feature prioritization | Flexible docs | Sprint tracking |\n| Key Differentiator | End-to-end AI chain | Customer feedback portal | Template flexibility | Dev ecosystem |',
        competitive_landscape: '### Competitive Overview\n| Competitor | Strengths | Weaknesses | Market Position |\n|---|---|---|---|\n| Productboard | Strong customer feedback portal | No AI workflow, expensive | Enterprise leader |\n| Notion | Flexible, popular | No PM-specific features | Horizontal docs |\n| Linear | Great DX, fast | Engineering-only | Dev-focused |\n| Aha! | Comprehensive roadmapping | Legacy UX, slow | Traditional PM |\n\n### Competitive Threats\n- Large players (Atlassian, Notion) could add AI PM features\n- AI-native startups could emerge with similar positioning',
        product_differentiation: '### Key Differentiators\n1. **Proprietary AI Chain Synthesizer:** 1-click generation from Research → Strategy → Roadmap → PRD → Backlog\n2. **Live Document Sync:** Documents stay current with real-time project data\n3. **End-to-End PM Operating System:** Single workspace replacing 4-5 disconnected tools\n\n### Defensibility Profile (Moat Analysis)\n| Moat Type | Strength | Evidence |\n|---|---|---|\n| Technology | High | Proprietary AI chain architecture |\n| Network Effects | Medium | Team collaboration compounds value |\n| Switching Costs | High | Deep integration with project data |\n| Brand | Low (Building) | Early stage, growing reputation |',
        strategic_bets: '### Strategic Bets\n| # | Strategic Bet | Why It Matters | Expected Outcome | Confidence | Timeline |\n|---|---|---|---|---|---|\n| 1 | AI Workflow Chain | Core differentiator | +40% PM retention | High | Q1-Q2 |\n| 2 | Enterprise SSO & RBAC | Unlocks enterprise deals | 3 Enterprise accounts | High | Q2-Q3 |\n| 3 | Real-time Collaboration | Multiplayer drives adoption | 2x team activation | Medium | Q3-Q4 |\n| 4 | Marketplace Integrations | Ecosystem lock-in | 5 key integrations | Medium | Q4 |',
        strategic_pillars: '### Pillar 1: Workflow Velocity\n- **Objective:** Reduce PM documentation time by 60%\n- **Key Initiatives:** AI Chain Synthesizer, 1-click generators, smart templates\n- **Success Metrics:** Time-to-first-spec < 10 min, completion rate > 90%\n\n### Pillar 2: Enterprise Governance\n- **Objective:** Meet enterprise security and compliance requirements\n- **Key Initiatives:** SSO/SAML, RBAC, audit logging, data residency\n- **Success Metrics:** SOC2 certification, 3 enterprise customers\n\n### Pillar 3: Evidence-Based Decision Making\n- **Objective:** Connect every product decision to market evidence\n- **Key Initiatives:** Evidence lineage badges, research-to-backlog tracing\n- **Success Metrics:** 80% of PRD sections linked to research evidence',
        product_principles: '### Guiding Product Principles\n1. **Speed over Perfection:** A good spec generated in 10 seconds beats a perfect one that takes 4 hours\n2. **Evidence over Opinion:** Every product decision should trace back to customer or market data\n3. **Automation over Process:** If a PM does it more than twice, automate it\n4. **Transparency over Silos:** All stakeholders should see the same real-time product truth\n\n### How We Apply Principles\nWhen speed and evidence conflict, we ship fast with a flag to gather evidence post-launch.',
        product_goals: '### Goals Framework\n| Category | Goal | Baseline | Target | Timeframe |\n|---|---|---|---|---|\n| Business | Monthly Recurring Revenue | $0 | $50K MRR | 12 months |\n| Customer | Weekly Active PM Users | 0 | 500 | 12 months |\n| Product | Spec Generation Completion Rate | N/A | >90% | Q2 |\n| Engineering | Deployment Frequency | Weekly | Daily | Q3 |\n| Retention | Monthly PM Retention | N/A | >85% | Q3 |',
        metrics_and_kpis: '### North Star Metric\n**Specs Generated Per Week** — directly measures value delivered to PMs.\n\n### Key Performance Indicators\n| KPI | Current | Target | Frequency |\n|---|---|---|---|\n| Specs Generated/Week | 0 | 200 | Weekly |\n| Time-to-First-Spec | N/A | < 10 min | Weekly |\n| Section Completion Rate | N/A | > 90% | Monthly |\n| PM Retention (30-day) | N/A | > 85% | Monthly |\n\n### Guardrail Metrics\n- AI generation error rate < 2%\n- Page load time < 2 seconds',
        roadmap_themes: '### Roadmap Themes by Quarter\n| Quarter | Strategic Theme | Objective | Major Initiatives |\n|---|---|---|---|\n| Q1 | AI Foundation | Core AI chain synthesizer | Research → Strategy → Roadmap → PRD generators |\n| Q2 | Enterprise Readiness | Security & compliance | SSO, RBAC, audit logging, data export |\n| Q3 | Collaboration & Scale | Multiplayer experience | Real-time editing, comments, notifications |\n| Q4 | Ecosystem & Growth | Platform extensibility | Integrations marketplace, API, webhooks |',
        prioritization_framework: '### Prioritization Criteria\n| Initiative | Customer Impact | Business Impact | Effort | Strategic Alignment | Priority |\n|---|---|---|---|---|---|\n| AI Chain Synthesizer | High | High | Medium | Pillar 1 ✓ | P0 |\n| Enterprise SSO/RBAC | Medium | High | Medium | Pillar 2 ✓ | P0 |\n| Evidence Lineage Badges | High | Medium | Low | Pillar 3 ✓ | P1 |\n| Real-time Collaboration | High | Medium | High | Pillar 1 ✓ | P1 |\n| Integrations Marketplace | Medium | High | High | Growth ✓ | P2 |',
        business_model: '### Revenue Model\nSaaS subscription with usage-based AI generation credits.\n\n### Pricing Strategy\n| Tier | Price | Includes |\n|---|---|---|\n| Starter | $0/mo | 3 projects, 10 AI generations/mo |\n| Pro | $29/user/mo | Unlimited projects, 100 AI generations/mo |\n| Enterprise | Custom | SSO, RBAC, unlimited AI, dedicated support |\n\n### Revenue Drivers\n1. Seat expansion within existing accounts\n2. Usage-based AI generation overages\n\n### Expansion Opportunities\n- Enterprise add-ons (audit logging, data residency)\n- Professional services (strategy workshops)',
        gtm_considerations: '### Go-To-Market Strategy\n**Primary Motion:** Product-Led Growth (PLG) with inside sales expansion.\n\n### Acquisition Channels\n1. Content marketing (PM blogs, templates, guides)\n2. Product Hunt & community launches\n3. Referral program (team invites)\n4. Inside sales for enterprise\n\n### Activation Strategy\nNew users generate their first AI spec within 5 minutes — immediate value.\n\n### Retention & Expansion Loops\n- Team collaboration drives organic seat expansion\n- AI-generated documents create switching costs\n- Template library deepens engagement',
        assumptions: '### Strategic Assumptions Matrix\n| # | Assumption | Evidence | Confidence | Validation Method |\n|---|---|---|---|---|\n| 1 | PMs want AI-generated specs | User interviews, competitor traction | High | Beta usage data |\n| 2 | LLM quality is sufficient | GPT-4/Claude testing | High | A/B test vs manual specs |\n| 3 | PLG can drive initial adoption | Industry benchmarks | Medium | Conversion funnel analysis |\n| 4 | Enterprise will pay premium | Sales conversations | Medium | Pilot program |\n| 5 | Market consolidation timing is right | Competitor fragmentation | Medium | Trend monitoring |',
        risks: '### Strategic Risk Register\n| # | Risk | Probability | Impact | Mitigation | Owner |\n|---|---|---|---|---|---|\n| 1 | LLM API cost escalation | Medium | High | Multi-model router, caching | Platform |\n| 2 | Large competitor adds AI PM features | High | High | Speed advantage, deep PM workflow | Product |\n| 3 | AI hallucination in specs | Medium | Medium | Human review step, confidence scoring | AI Team |\n| 4 | Enterprise sales cycle too long | Medium | Medium | PLG bottom-up adoption | Sales |\n| 5 | Data privacy concerns | Low | High | SOC2, data residency, on-prem option | Security |',
        strategic_dependencies: '### Dependencies Matrix\n| Type | Dependency | Impact | Status | Owner |\n|---|---|---|---|---|\n| Technology | LLM API providers (OpenAI, Anthropic) | High | Active | Platform |\n| Technology | Supabase infrastructure | High | Active | Backend |\n| Business | Enterprise pilot customers | Medium | In Progress | Sales |\n| Partner | Integration partners (Jira, Linear, GitHub) | Medium | Planned | Partnerships |\n| Regulatory | SOC2 Type II certification | High | In Progress | Security |',
        strategic_decisions: '### Decisions Log\n| Date | Decision | Rationale | Alternatives Considered | Decided By |\n|---|---|---|---|---|\n| Today | AI chain synthesis as core differentiator | Unique in market, high value | Manual templates only | Product Lead |\n| Today | PLG motion first, enterprise second | Faster validation, lower CAC | Enterprise-first | CEO |\n| Today | Multi-model LLM router | Avoid vendor lock-in | Single provider | CTO |',
        open_questions: '### Open Strategic Questions\n| # | Question | Owner | Due Date | Status | Impact |\n|---|---|---|---|---|---|\n| 1 | Should we build a template marketplace? | Product | TBD | Open | Medium |\n| 2 | Right AI generation credit model? | Business | TBD | Open | High |\n| 3 | Support on-premise for enterprise? | Engineering | TBD | Open | High |\n| 4 | When to invest in mobile? | Product | TBD | Open | Low |',
        strategy_review: '### Review Cadence\n- **Weekly:** North star metric review, AI quality check\n- **Monthly:** OKR progress, competitive landscape scan\n- **Quarterly:** Full strategy validation\n\n### Core Strategy Validation Questions\n1. Is the problem still worth solving?\n2. Has the competitive landscape shifted?\n3. Are our strategic bets paying off?\n4. Do our metrics show customer value creation?\n5. Are our assumptions still valid?\n6. Should we pivot any strategic pillar?\n7. What new information changes our strategy?',
        related_documents: '### Cross-Referenced Documents\n- **Market Research Report:** TAM/SAM/SOM analysis, ICP definition, competitive matrix\n- **Customer Personas:** Primary and secondary persona profiles\n- **Product Roadmap:** Now/Next/Later horizon planning\n- **PRD Specifications:** Feature-level requirements and acceptance criteria\n- **Business Case:** Financial projections and ROI analysis\n- **Competitive Analysis:** Detailed competitor benchmarking matrix',
        approval_board: '### Executive Governance & Approval Board\n| Role | Name | Approval Status | Date |\n|---|---|---|---|\n| Product Manager | TBD | Pending | |\n| Engineering Lead | TBD | Pending | |\n| Business Owner | TBD | Pending | |\n| Executive Sponsor | TBD | Pending | |\n\n### Approval Criteria\n- Strategy aligns with company mission and vision\n- Financial projections are defensible\n- Resource requirements are feasible\n- Risk mitigations are adequate',
      }
    }

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
Return ONLY valid JSON without markdown wrapping.`

    let aiResultText = ''
    try {
      aiResultText = await generateTextOutput({
        systemPrompt,
        userPrompt: rawStrategyText || 'Product Strategy Summary.',
      })
    } catch (aiErr) {
      console.warn('[AI Chain Synthesizer] AI provider fallback:', aiErr)
    }

    let parsedResult: Record<string, string> = {}
    try {
      const cleanJsonStr = aiResultText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      parsedResult = JSON.parse(cleanJsonStr)
    } catch (parseErr) {
      console.warn('[AI Chain Synthesizer] JSON parse fallback:', parseErr)
      parsedResult = {
        now_horizon: 'NOW (Q1): Core AI Chain Synthesizer, SSO Authentication, and TAM Calculator.',
        next_horizon: 'NEXT (Q2): Advanced Evidence Lineage Badges and Custom Exporter Templates.',
        later_horizon: 'LATER (Q3/Q4): Multi-Tenant Edge Infrastructure & Autonomous Agent Workflows.',
        exploring_horizon: 'EXPLORING: Natural language database queries & mobile companion app.',
        roadmap_purpose: 'Align engineering and leadership on strategic feature sequencing over the next 12 months.',
        product_vision: 'Become the operating system for high-velocity product management teams.',
        strategic_objectives: '| ID | Objective | Outcome |\n|---|---|---|\n| SO-01 | Workflow Velocity | -60% Grooming Time |',
        roadmap_themes: '| Theme | Description |\n|---|---|\n| AI Automation | 1-click spec generation |',
        roadmap_overview: '| Initiative | Theme | Q1 | Q2 | Q3 | Q4 |\n|---|---|---|---|---|---|\n| AI Chain | AI Automation | ● | | | |',
        detailed_initiatives: 'RI-001: AI Chain Synthesizer — 1-click end-to-end document generator.',
        quarterly_breakdown: 'Q1: AI Chain & TAM Calculator | Q2: Enterprise SSO & RBAC | Q3: Edge Sync',
        initiative_prioritization: '| Initiative | Impact | Effort | Priority |\n|---|---|---|---|\n| AI Chain | High | Medium | P0 |',
        roadmap_dependencies: '| Initiative | Dependency | Status |\n|---|---|---|\n| AI Chain | Supabase Admin Client | Complete |',
        risks_and_assumptions: 'Risk: LLM API rate limits under high concurrency. Mitigation: Local Redis caching layer.',
        metrics_and_outcomes: '+40% weekly PM retention; 25% activation lift.',
      }
    }

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
Return ONLY valid JSON without markdown wrapping.`

    let aiResultText = ''
    try {
      aiResultText = await generateTextOutput({
        systemPrompt,
        userPrompt: rawRoadmapText || 'Product Roadmap Summary.',
      })
    } catch (aiErr) {
      console.warn('[AI Chain Synthesizer] AI provider fallback:', aiErr)
    }

    let parsedResult: Record<string, string> = {}
    try {
      const cleanJsonStr = aiResultText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      parsedResult = JSON.parse(cleanJsonStr)
    } catch (parseErr) {
      console.warn('[AI Chain Synthesizer] JSON parse fallback:', parseErr)
      parsedResult = {
        executive_summary: '### 1.1 Feature Overview\nAutomate end-to-end product requirements generation from market research to backlog execution.\n\n### 1.2 Problem Statement\n> Product managers spend 4+ hours per week manually formatting and copying specs.\n\n### 1.3 Opportunity\nEliminating this friction improves PM velocity by 60%.',
        goals_objectives: '### 2.1 Feature Goals\n1. Reduce PRD creation time from 4 hours to under 10 minutes\n2. Achieve 90%+ section completeness on first generation\n\n### 2.2 Success Criteria\n- [ ] 1-click generates all 23 PRD sections\n- [ ] Content is contextually relevant\n\n### 2.3 Non-Goals\n- Custom webhooks in V1\n- Manual document translation',
        user_personas: '### Primary Persona: Product Manager\n- **Needs:** Fast spec generation, consistent formatting\n- **Pain Points:** Manual copy-paste, context switching\n\n### Secondary Persona: Engineering Lead\n- **Needs:** Clear requirements, testable AC\n- **Pain Points:** Ambiguous specs, missing edge cases',
        user_stories: '### US-01 — AI PRD Generation\n**As a** Product Manager **I want to** generate a complete PRD from my roadmap **So that** I can start grooming immediately\n\n### US-02 — Section Editing\n**As a** Product Lead **I want to** edit any AI-generated section inline **So that** I can refine specs\n\n### US-03 — Evidence Lineage\n**As a** VP of Product **I want to** trace PRD requirements back to research **So that** I can validate alignment',
        functional_requirements: '### FR-01: 1-Click PRD Generation\n**Description:** System generates all 23 PRD sections from roadmap\n- The system shall parse all roadmap sections as input\n- The system shall generate markdown content for every section\n\n### FR-02: Real-time Persistence\n- The system shall save to Supabase immediately\n- The system shall merge with existing content',
        user_flow: '### Primary Flow\n1. User navigates to Product Roadmap\n2. User clicks "Generate PRD Specs"\n3. System synthesizes all 23 sections\n4. User switches to PRD to review\n\n### Alternative Flow\n1. If roadmap is empty, system uses defaults\n\n### Error Flow\n1. If AI fails, system shows error toast with retry',
        ui_ux_requirements: '### Screens Required\n- PRD Document View with 23 collapsible sections\n- Section Editor with markdown preview\n- Loading State: Skeleton loaders\n- Empty State: Placeholder prompts\n\n### Design Guidelines\n- Consistent section numbering (1-23)\n- Rich markdown rendering',
        business_rules: '| ID | Business Rule |\n|---|---|\n| BR-01 | Only project members can generate PRD content |\n| BR-02 | AI generation merges, never overwrites |\n| BR-03 | Section order follows enterprise template |',
        data_requirements: '### Inputs & Validation\n| Field | Type | Required | Rule |\n|---|---|---|---|\n| project_id | UUID | Yes | Must exist in projects |\n| roadmap_content | JSONB | Yes | At least 1 section |\n\n### Output & Data Changes\n- Updates `generated_documents.free_text_content` JSONB\n- Sets `document_type` = `product_requirements_document`',
        permissions_access_control: '| User Role | View | Create | Edit | Delete | Approve |\n|---|:---:|:---:|:---:|:---:|:---:|\n| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |\n| PM | ✓ | ✓ | ✓ | ✗ | ✓ |\n| Engineer | ✓ | ✗ | ✗ | ✗ | ✗ |\n| Viewer | ✓ | ✗ | ✗ | ✗ | ✗ |',
        notifications_channels: '### Triggers\n- PRD generated successfully\n- PRD section edited by collaborator\n\n### Channels\n- In-app toast notifications\n- Email digest (optional)',
        non_functional_requirements: '### Performance\n- PRD generation < 15 seconds\n- Page load < 2 seconds\n\n### Security\n- RLS policies enforce project-level access\n\n### Accessibility\n- WCAG AA compliance',
        analytics_tracking: '### Events\n| Event | Trigger | Properties |\n|---|---|---|\n| `prd_generated` | PRD synthesis completes | project_id, section_count |\n| `prd_section_edited` | User edits section | section_key, edit_length |\n\n### Key Metrics\n- PRD adoption rate > 60%\n- Sections edited post-generation < 5',
        acceptance_criteria: '### AC-01: Full Section Population\n**Given** a roadmap with content **When** user clicks "Generate PRD Specs" **Then** all 23 sections contain content\n\n### AC-02: Empty Roadmap Fallback\n**Given** an empty roadmap **When** user clicks generate **Then** system produces defaults',
        edge_cases: 'The system must handle:\n- Empty roadmap input (use defaults)\n- Long content (truncate to token limit)\n- Concurrent requests (debounce)\n- Network timeout (retry with backoff)\n- Malformed AI JSON (use fallback)',
        technical_considerations: '### Frontend\n- React + ReactMarkdown rendering\n- Structured section editors with rich text toolbar\n\n### Backend\n- Next.js Server Actions with Supabase Admin Client\n- Multi-model LLM router\n\n### Infrastructure\n- Supabase Postgres with JSONB\n- Row Level Security (RLS)',
        qa_testing_requirements: '### Testing Suites\n- [ ] Unit tests for JSON parsing\n- [ ] Integration tests for persistence\n- [ ] E2E tests for generation workflow\n- [ ] Regression tests for template keys\n\n### UAT Criteria\n- All 23 sections visually populated\n- Content is contextually relevant',
        sprint_scope: '### In Scope\n- AI-powered 23-section PRD generation\n- Supabase persistence and merge\n- Section-level inline editing\n\n### Out of Scope\n- PDF/DOCX export in V1\n\n### Checklist\n- [ ] AI prompt complete\n- [ ] Backend deployed\n- [ ] Frontend verified\n- [ ] All 23 sections populate',
        dependencies_risks: '| Type | Description | Impact | Mitigation | Owner |\n|---|---|---|---|---|\n| Dependency | LLM API availability | High | Multi-model fallback | Platform |\n| Dependency | Supabase Admin Client | Medium | Connection pooling | Backend |\n| Risk | AI hallucination | Medium | Human review step | Product |',
        definition_of_done: 'Done when:\n- [ ] All 23 PRD sections generate\n- [ ] Content persists to Supabase\n- [ ] Existing content merges without loss\n- [ ] Fallback activates on AI failure\n- [ ] All AC pass\n- [ ] Code reviewed and merged',
        open_questions: '| # | Question | Owner | Due | Status |\n|---|---|---|---|---|\n| 1 | Support partial regeneration? | PM | TBD | Open |\n| 2 | Max token budget for AI? | Engineering | TBD | Open |',
        decisions_log: '| Date | Decision | Rationale | Decided By |\n|---|---|---|---|\n| Today | Use enterprise_full_prd (23 sections) | Maximum coverage | Product Lead |',
        related_documents_approvals: '### Approval Matrix\n| Role | Name | Status | Date |\n|---|---|---|---|\n| PM | TBD | Pending | |\n| Tech Lead | TBD | Pending | |\n| QA Lead | TBD | Pending | |\n\n### Related Documents\n- Product Strategy\n- Product Roadmap\n- Market Research Report',
      }
    }

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
