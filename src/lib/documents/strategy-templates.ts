import type { DocumentSectionDef } from './types'

export interface StrategyTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'startup' | 'leadership' | 'growth' | 'go_to_market' | 'portfolio' | 'product_area' | 'master_spec'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const STRATEGY_TEMPLATE_VARIANTS: Record<string, StrategyTemplateVariant> = {
  standard_product_strategy: {
    id: 'standard_product_strategy',
    name: 'Standard Product Strategy Canvas',
    subtitle: 'Default strategy format with vision pillars and executive intent.',
    category: 'startup',
    bestFor: 'General product strategy overview & leadership commentary.',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'strategy_vision', title: 'Product Vision Canvas & Core Pillars', type: 'data_bound', source: 'product.strategy_canvas' },
      { key: 'executive_commentary', title: 'Executive Strategy & Strategic Intent', type: 'free_text' }
    ],
  },
  master_product_strategy: {
    id: 'master_product_strategy',
    name: 'Comprehensive Master Product Strategy (28 Sections)',
    subtitle: 'End-to-end enterprise product strategy spec covering market, JTBD, pillars, business model & GTM.',
    category: 'master_spec',
    bestFor: 'Enterprise products, multi-year strategic roadmaps, executive board reviews & investor memos.',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'executive_summary', title: '1. Executive Summary & Strategic Intent', type: 'free_text', placeholder: 'Concise summary of product strategy, problem being solved, target market, and expected business outcomes.' },
      { key: 'product_vision', title: '2. Product Vision (3-5 Year Horizon)', type: 'free_text', placeholder: 'Vision Statement: What future do we want to create for our customers?\nLong-Term Vision: Describe what the product should become in 3-5 years.' },
      { key: 'product_mission', title: '3. Product Mission Statement', type: 'free_text', placeholder: 'What does the product do every day to move toward the vision?' },
      { key: 'problem_statement', title: '4. Problem Statement & Impact', type: 'free_text', placeholder: 'Core Problem: Describe customer struggle.\nCurrent Situation: How customers solve it today.\nPain Points: 1, 2, 3.\nImpact: Revenue loss, operational inefficiency, missed opportunities.' },
      { key: 'market_opportunity', title: '5. Market Opportunity & TAM/SAM/SOM', type: 'free_text', placeholder: 'Target Market: Geography, Industry, Business Size.\nMarket Size: TAM, SAM, SOM estimates.\nMarket Trends & Why Now.' },
      { key: 'target_customers', title: '6. Target Customer Personas', type: 'data_bound', source: 'product.personas' },
      { key: 'jobs_to_be_done', title: '7. Customer Jobs-to-be-Done (JTBD)', type: 'free_text', placeholder: '| Customer Job | Current Solution | Pain | Desired Outcome |\n|---|---|---|---|\n\nPrimary Job Statement: When [situation], I want to [motivation], so I can [outcome].' },
      { key: 'value_proposition', title: '8. Value Proposition & Customer Value', type: 'free_text', placeholder: 'Statement: For [customer] who [problem], [product] is a [category] that [benefit]. Unlike [alternative], our product [differentiator].' },
      { key: 'product_positioning', title: '9. Product Positioning Matrix', type: 'free_text', placeholder: 'Category, Target Customer, Problem Solved, Primary Benefit, Key Differentiator.' },
      { key: 'competitive_landscape', title: '10. Competitive Landscape & Threats', type: 'data_bound', source: 'product.competitive_matrix' },
      { key: 'product_differentiation', title: '11. Product Differentiation & Defensibility', type: 'free_text', placeholder: 'Differentiators 1-3 & Defensibility Profile (Moat analysis).' },
      { key: 'strategic_bets', title: '12. Strategic Bets & Approach', type: 'free_text', placeholder: '| Strategic Bet | Why It Matters | Expected Outcome | Confidence |\n|---|---|---|---|' },
      { key: 'strategic_pillars', title: '13. Strategic Pillars & Initiatives', type: 'free_text', placeholder: 'Pillar 1, 2, 3: Objectives, Key Initiatives, and Success Metrics.' },
      { key: 'product_principles', title: '14. Product Principles', type: 'free_text', placeholder: 'Principles 1-4 guiding design and engineering tradeoffs.' },
      { key: 'product_goals', title: '15. Business, Customer & Product Goals', type: 'free_text', placeholder: '| Goal | Baseline | Target | Timeframe |\n|---|---|---|---|' },
      { key: 'metrics_and_kpis', title: '16. Product Metrics & North Star KPIs', type: 'data_bound', source: 'product.north_star_kpis' },
      { key: 'roadmap_themes', title: '17. Product Roadmap Themes (Q1-Q4)', type: 'free_text', placeholder: '| Period | Strategic Theme | Objective | Major Initiatives |\n|---|---|---|---|' },
      { key: 'prioritization_framework', title: '18. Feature Prioritization Framework', type: 'free_text', placeholder: '| Initiative | Customer Impact | Business Impact | Effort | Strategic Alignment | Priority |\n|---|---|---|---|---|---|' },
      { key: 'business_model', title: '19. Business & Revenue Model', type: 'free_text', placeholder: 'Revenue Model, Pricing Strategy, Revenue Drivers, Expansion Opportunities.' },
      { key: 'gtm_considerations', title: '20. Go-To-Market & Growth Loops', type: 'free_text', placeholder: 'Acquisition, Activation, Retention, Monetization, Expansion strategies.' },
      { key: 'assumptions', title: '21. Strategic Assumptions Matrix', type: 'free_text', placeholder: '| Assumption | Evidence | Confidence | Validation Method |\n|---|---|---|---|' },
      { key: 'risks', title: '22. Strategic Risk Register', type: 'free_text', placeholder: '| Risk | Probability | Impact | Mitigation | Owner |\n|---|---|---|---|---|' },
      { key: 'strategic_dependencies', title: '23. Strategic Dependencies', type: 'free_text', placeholder: 'Technology, Business, Partner, Regulatory, Resource dependencies.' },
      { key: 'strategic_decisions', title: '24. Strategic Decisions Log', type: 'free_text', placeholder: '| Date | Decision | Rationale | Owner |\n|---|---|---|---|' },
      { key: 'open_questions', title: '25. Open Strategic Questions', type: 'free_text', placeholder: '| Question | Owner | Due Date | Status |\n|---|---|---|---|' },
      { key: 'strategy_review', title: '26. Strategy Review Cadence & Questions', type: 'free_text', placeholder: 'Review frequency and 7 core strategy validation questions.' },
      { key: 'related_documents', title: '27. Cross-Referenced Related Documents', type: 'free_text', placeholder: 'Links to Market Research, Personas, PRDs, Roadmap, Business Case.' },
      { key: 'approval_board', title: '28. Executive Governance & Approval Board', type: 'free_text', placeholder: '| Role | Name | Approval | Date |\n| Product Manager | [Name] | Pending | [Date] |\n| Eng Lead | [Name] | Pending | [Date] |\n| Business Owner | [Name] | Pending | [Date] |\n| Exec Sponsor | [Name] | Pending | [Date] |' },
    ],
  },

  lean_strategy: {
    id: 'lean_strategy',
    name: 'Lean Strategy One-Pager',
    subtitle: 'Fast, high-altitude 1-page strategy for speed and alignment.',
    category: 'startup',
    bestFor: 'Early-stage, single team, needs to fit on one page and be referenced weekly.',
    iconName: 'Zap',
    section_definitions: [
      {
        key: 'where_we_are',
        title: 'Where We Are',
        type: 'free_text',
        placeholder: '1-2 sentences — honest current state.',
      },
      {
        key: 'where_we_are_going',
        title: "Where We're Going",
        type: 'free_text',
        placeholder: "1-2 sentences — the specific future state we're aiming for.",
      },
      {
        key: 'why_this_matters_now',
        title: 'Why This Matters Now',
        type: 'free_text',
        placeholder: 'The market/customer/business reason this is the right time.',
      },
      {
        key: 'how_we_will_get_there',
        title: "How We'll Get There",
        type: 'free_text',
        placeholder: '3-5 bullet initiatives — not a full roadmap, the big rocks.',
      },
      {
        key: 'what_we_are_not_doing',
        title: "What We're Not Doing",
        type: 'free_text',
        placeholder: "Explicit tradeoffs — the things a reasonable team might do that we've decided against.",
      },
      {
        key: 'how_we_will_know_it_is_working',
        title: "How We'll Know It's Working",
        type: 'free_text',
        placeholder: '1-3 metrics, with current baseline and target.',
      },
    ],
  },

  playing_to_win: {
    id: 'playing_to_win',
    name: 'Playing to Win (Strategy Choice Cascade)',
    subtitle: 'Roger Martin framework forcing hard choices and competitive advantage.',
    category: 'leadership',
    bestFor: 'Setting company or product-line direction, forcing genuinely hard choices.',
    iconName: 'Building',
    section_definitions: [
      {
        key: 'winning_aspiration',
        title: '1. What is Our Winning Aspiration?',
        type: 'free_text',
        placeholder: 'Not "grow revenue" — the specific definition of what winning looks like and why it matters.',
      },
      {
        key: 'where_to_play',
        title: '2. Where Will We Play?',
        type: 'free_text',
        placeholder: '- Which markets/segments/customers\n- Which geographies\n- Which channels\n- Which stage of the customer journey\n\n(Be as specific about where you WON\'T play as where you will.)',
      },
      {
        key: 'how_to_win',
        title: '3. How Will We Win There?',
        type: 'free_text',
        placeholder: 'The specific source of competitive advantage — cost, differentiation, network effects, distribution, speed. Not a list of good qualities — ONE clear theory of victory.',
      },
      {
        key: 'capabilities_required',
        title: '4. What Capabilities Must Be in Place?',
        type: 'free_text',
        placeholder: 'The 3-5 things the org must be able to do exceptionally well to execute the "how will we win" — often reveals gaps.',
      },
      {
        key: 'management_systems',
        title: '5. What Management Systems Are Required?',
        type: 'free_text',
        placeholder: 'What has to be true operationally — metrics tracked, processes, org structure, incentive alignment — to sustain this.',
      },
      {
        key: 'reverse_stress_test',
        title: 'Reverse Stress-Test',
        type: 'free_text',
        placeholder: 'For each choice above, ask: "For this to be true, what would have to be true about the market/customer/competitor?" If those conditions are implausible, the choice is wrong.',
      },
    ],
  },

  north_star_framework: {
    id: 'north_star_framework',
    name: 'North Star Framework',
    subtitle: 'Aligning product squads around value delivered to customers.',
    category: 'growth',
    bestFor: 'Aligning a team around a single unifying metric that captures customer value.',
    iconName: 'Compass',
    section_definitions: [
      {
        key: 'north_star_metric',
        title: 'North Star Metric',
        type: 'data_bound',
        source: 'product.north_star_kpis',
      },
      {
        key: 'why_this_metric',
        title: 'Why This Metric',
        type: 'free_text',
        placeholder: 'Why this one, not an adjacent metric — what makes it a true proxy for value delivered rather than just activity.',
      },
      {
        key: 'input_metrics_ladder',
        title: 'Input Metrics Ladder & Levers',
        type: 'free_text',
        placeholder: '| Input Metric | Current | Target | Owning Team/Initiative |\n|---|---|---|---|\n\nBrief causal logic — why moving each input actually moves the North Star.',
      },
      {
        key: 'guardrail_metrics',
        title: 'Guardrail Metrics',
        type: 'free_text',
        placeholder: 'What must NOT regress while we chase the North Star (e.g., churn, support load, quality).',
      },
      {
        key: 'review_cadence',
        title: 'Review Cadence & Re-Validation Schedule',
        type: 'free_text',
        placeholder: 'How often this is revisited — weekly/monthly dashboard review, quarterly re-validation that it\'s still the right metric.',
      },
    ],
  },

  okr_strategy: {
    id: 'okr_strategy',
    name: 'OKR-Based Strategy Doc',
    subtitle: 'Quarterly & annual strategic objectives with quantitative key results.',
    category: 'growth',
    bestFor: 'Setting quarterly/annual direction with measurable accountability.',
    iconName: 'BarChart3',
    section_definitions: [
      {
        key: 'strategic_context',
        title: 'Strategic Context',
        type: 'free_text',
        placeholder: '2-3 sentences on the broader "why" this quarter/year\'s OKRs exist — link to company mission/strategy.',
      },
      {
        key: 'okr_tree_data',
        title: 'OKR Objectives & Key Results Hierarchy',
        type: 'data_bound',
        source: 'okrs.report',
      },
      {
        key: 'non_objectives',
        title: 'Explicit Non-Objectives',
        type: 'free_text',
        placeholder: 'What we are explicitly deprioritizing this cycle, so a KR miss on something outside this list isn\'t treated as a failure.',
      },
      {
        key: 'cross_team_dependencies',
        title: 'Cross-Team Dependencies',
        type: 'free_text',
        placeholder: 'Where this team\'s OKRs rely on another team\'s OKRs landing first.',
      },
      {
        key: 'confidence_level',
        title: 'Self-Assessed Confidence Level',
        type: 'free_text',
        placeholder: 'Per objective — realistic self-assessed likelihood of hitting it (encourages ambitious KRs without punishing stretch goals).',
      },
    ],
  },

  vision_narrative: {
    id: 'vision_narrative',
    name: 'Vision & Strategy Narrative (Amazon-Style)',
    subtitle: 'Prose-first narrative format for executive and board alignment.',
    category: 'leadership',
    bestFor: 'Writing for board/exec buy-in on a new strategic direction.',
    iconName: 'TrendingUp',
    section_definitions: [
      {
        key: 'the_world_as_it_is',
        title: 'The World As It Is',
        type: 'free_text',
        placeholder: 'Honest description of the current market/customer/competitive reality, without spin.',
      },
      {
        key: 'the_world_as_it_should_be',
        title: 'The World As It Should Be',
        type: 'free_text',
        placeholder: 'The future state you\'re aiming to create — for the customer, specifically, not for the company.',
      },
      {
        key: 'unique_positioning',
        title: 'Why We Are Uniquely Positioned to Build This',
        type: 'free_text',
        placeholder: 'What advantage, insight, asset, or timing gives you the right to win here — and why others haven\'t already done this.',
      },
      {
        key: 'what_we_will_do',
        title: 'What We Will Do (Strategic Moves)',
        type: 'free_text',
        placeholder: 'The strategy itself, in narrative form — the sequence of moves, not just a list of features.',
      },
      {
        key: 'what_could_go_wrong',
        title: 'What Could Go Wrong (Honest Risk Assessment)',
        type: 'free_text',
        placeholder: 'Honest risk assessment — market risk, execution risk, competitive response.',
      },
      {
        key: 'what_success_looks_like',
        title: 'What Success Looks Like',
        type: 'free_text',
        placeholder: 'Concrete, vivid description of the state you\'ll be in if this works.',
      },
      {
        key: 'strategy_appendix',
        title: 'Strategy Appendix (Metrics & Milestones)',
        type: 'free_text',
        placeholder: '- Key metrics & targets\n- Resourcing requirements\n- Timeline / major milestones',
      },
    ],
  },

  gtm_strategy: {
    id: 'gtm_strategy',
    name: 'Go-to-Market Strategy Doc',
    subtitle: 'Commercial launch plan, positioning, channels, and pricing.',
    category: 'go_to_market',
    bestFor: 'Planning how a product enters or wins a market.',
    iconName: 'Smartphone',
    section_definitions: [
      {
        key: 'market_opportunity',
        title: 'Market Opportunity',
        type: 'free_text',
        placeholder: 'Size, growth rate, why now — grounded in data where possible.',
      },
      {
        key: 'target_segment_icp',
        title: 'Target Segment & Ideal Customer Profile (ICP)',
        type: 'free_text',
        placeholder: 'Specific ICP (ideal customer profile) — not "everyone," the actual first-wave buyer.',
      },
      {
        key: 'positioning_statement',
        title: 'Positioning Statement',
        type: 'free_text',
        placeholder: '"[Product] is the [category] for [target segment] who need [need], unlike [alternative] which [limitation]."',
      },
      {
        key: 'pricing_and_packaging',
        title: 'Pricing & Packaging',
        type: 'free_text',
        placeholder: 'How this is priced/packaged, and why — relative to alternatives and perceived value.',
      },
      {
        key: 'channel_strategy',
        title: 'Channel Strategy',
        type: 'free_text',
        placeholder: 'How target customers will find/acquire this — direct sales, self-serve, partnerships, content, existing customer base.',
      },
      {
        key: 'launch_sequence',
        title: 'Launch Sequence',
        type: 'free_text',
        placeholder: '- Pre-launch (beta, waitlist, early access)\n- Launch moment (what happens day 1)\n- Post-launch (expansion, iteration based on feedback)',
      },
      {
        key: 'sales_cs_enablement',
        title: 'Sales & Customer Success Enablement',
        type: 'free_text',
        placeholder: 'What internal teams need to sell/support this — training, collateral, FAQs.',
      },
      {
        key: 'success_metrics_and_competitive_response',
        title: 'Success Metrics & Competitive Response',
        type: 'free_text',
        placeholder: 'Adoption target, revenue target, and anticipated competitor reactions.',
      },
    ],
  },

  portfolio_strategy: {
    id: 'portfolio_strategy',
    name: 'Portfolio / Roadmap Strategy Doc',
    subtitle: 'Cross-product line prioritization and resource allocation.',
    category: 'portfolio',
    bestFor: 'Prioritizing across multiple product lines/features with limited resources.',
    iconName: 'GitMerge',
    section_definitions: [
      {
        key: 'strategic_pillars',
        title: 'Strategic Pillars',
        type: 'free_text',
        placeholder: 'The 3-5 themes everything in this portfolio should ladder up to. Anything that doesn\'t map to a pillar is a candidate for cutting.',
      },
      {
        key: 'initiative_prioritization_matrix',
        title: 'Initiative Prioritization Matrix',
        type: 'free_text',
        placeholder: '| Initiative | Pillar | Impact (H/M/L) | Effort (H/M/L) | Confidence | Decision |\n|---|---|---|---|---|---|',
      },
      {
        key: 'resource_allocation',
        title: 'Resource Allocation (% Headcount/Budget)',
        type: 'free_text',
        placeholder: 'Rough % or headcount split across pillars/initiatives — makes tradeoffs visible rather than implicit.',
      },
      {
        key: 'explicitly_deprioritized',
        title: "What We're Explicitly Deprioritizing",
        type: 'free_text',
        placeholder: 'Named initiatives that were considered and cut, with the reasoning — prevents the same idea resurfacing without new information.',
      },
      {
        key: 'sequencing_logic',
        title: 'Sequencing Logic',
        type: 'free_text',
        placeholder: 'Why this order — dependencies, market timing, resource availability.',
      },
      {
        key: 'review_triggers',
        title: 'Review Triggers',
        type: 'free_text',
        placeholder: 'Conditions that would cause this prioritization to be revisited before the next planning cycle (e.g., competitor launch, KR miss, new data).',
      },
    ],
  },

  product_strategy_canvas: {
    id: 'product_strategy_canvas',
    name: 'Product Strategy Canvas (Single Product Area)',
    subtitle: 'Strategic bets, customer insights, and kill criteria for a PM lead.',
    category: 'product_area',
    bestFor: 'A PM setting strategy for a single product area (not company-wide).',
    iconName: 'FileCheck',
    section_definitions: [
      {
        key: 'problem_space',
        title: 'Problem Space',
        type: 'free_text',
        placeholder: 'The durable, underlying problem this area exists to solve — should outlive any single feature.',
      },
      {
        key: 'customer_insight',
        title: 'Customer Insight',
        type: 'free_text',
        placeholder: 'The non-obvious thing you know about the customer that shapes this strategy — from research, data, or support patterns.',
      },
      {
        key: 'strategic_bets',
        title: 'Strategic Bets',
        type: 'free_text',
        placeholder: 'The 2-4 specific bets you\'re making about how to win in this space:\n- The bet\n- Why you believe it\n- What would prove it wrong',
      },
      {
        key: 'competitive_differentiation',
        title: 'Competitive Landscape & Differentiation',
        type: 'data_bound',
        source: 'product.competitive_matrix',
      },
      {
        key: 'roadmap_themes',
        title: 'Roadmap Themes (Now, Next, Later)',
        type: 'free_text',
        placeholder: 'The 3-5 themes the next several sprints/quarters will ladder up to.',
      },
      {
        key: 'leading_metrics_and_kill_criteria',
        title: 'Metrics That Matter & Kill Criteria',
        type: 'free_text',
        placeholder: 'Leading indicators you\'ll watch to know if the bets are paying off, and what evidence would cause you to abandon a bet.',
      },
    ],
  },
}
