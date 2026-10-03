import type { DocumentSectionDef } from './types'

export interface MarketResearchTemplateVariant {
  id: string
  name: string
  subtitle: string
  category:
    | 'master_spec'
    | 'competitive'
    | 'market_sizing'
    | 'customer_icp'
    | 'discovery'
    | 'win_loss'
    | 'opportunity'
    | 'positioning'
    | 'trends'
    | 'pricing'
    | 'voc'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const MARKET_RESEARCH_TEMPLATE_VARIANTS: Record<string, MarketResearchTemplateVariant> = {
  master_market_research: {
    id: 'master_market_research',
    name: 'Master Market Research Spec (28 Sections)',
    subtitle: 'Comprehensive market research spec covering TAM/SAM/SOM, ICP, competitor matrix, SWOT, and research-to-strategy mapping.',
    category: 'master_spec',
    bestFor: 'Enterprise market research, fundraising decks, new market entry & strategic planning.',
    iconName: 'Sparkles',
    section_definitions: [
      { key: 'executive_summary', title: '1. Executive Summary', type: 'free_text' },
      { key: 'research_purpose', title: '2. Research Purpose & Business Decision', type: 'free_text' },
      { key: 'market_definition', title: '3. Market Definition & Boundaries', type: 'free_text' },
      { key: 'tam_sam_som_sizing', title: '4. Market Size (TAM / SAM / SOM)', type: 'free_text' },
      { key: 'market_growth', title: '5. Market Growth, Drivers & Constraints', type: 'free_text' },
      { key: 'target_customer_research', title: '6. Target Customer Research & Segmentation', type: 'data_bound', source: 'product.target_market' },
      { key: 'customer_problems', title: '7. Customer Problems & Pain Points', type: 'free_text' },
      { key: 'customer_jtbd', title: '8. Customer Jobs-to-be-Done (JTBD)', type: 'free_text' },
      { key: 'customer_research_methods', title: '9. Customer Research Methods & Participants', type: 'free_text' },
      { key: 'customer_research_findings', title: '10. Customer Research Findings & Evidence', type: 'free_text' },
      { key: 'competitor_research', title: '11. Competitor Research & Landscape', type: 'data_bound', source: 'product.competitors' },
      { key: 'competitive_gap_analysis', title: '12. Competitive Gap Analysis & Edge', type: 'free_text' },
      { key: 'pricing_research', title: '13. Pricing Research & Willingness to Pay', type: 'free_text' },
      { key: 'market_drivers_barriers', title: '14. Market Drivers, Barriers & Enablers', type: 'free_text' },
      { key: 'regulatory_environmental', title: '15. Regulatory & Environmental Factors', type: 'free_text' },
      { key: 'swot_analysis', title: '16. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)', type: 'free_text' },
      { key: 'market_opportunities', title: '17. Market Opportunities & Potential Value', type: 'free_text' },
      { key: 'hypotheses_assumptions', title: '18. Hypotheses & Assumption Validation', type: 'free_text' },
      { key: 'key_insights', title: '19. Key Synthesized Insights', type: 'free_text' },
      { key: 'research_conclusions', title: '20. Research Conclusions & Attractiveness Rating', type: 'free_text' },
      { key: 'recommendations', title: '21. Strategic Recommendations', type: 'free_text' },
      { key: 'strategic_implications', title: '22. Strategic Implications for Roadmap & Strategy', type: 'free_text' },
      { key: 'research_to_strategy_mapping', title: '23. Research-to-Strategy Mapping Table', type: 'free_text' },
      { key: 'research_limitations', title: '24. Research Limitations & Confidence Bounds', type: 'free_text' },
      { key: 'sources', title: '25. Information Sources & Citations', type: 'free_text' },
      { key: 'research_decision', title: '26. Research Decision & Rationale', type: 'free_text' },
      { key: 'next_steps', title: '27. Immediate Actionable Next Steps', type: 'free_text' },
      { key: 'approval_signoff', title: '28. Executive Approval & Sign-Off Matrix', type: 'free_text' },
    ],
  },

  competitive_analysis_matrix: {
    id: 'competitive_analysis_matrix',
    name: 'Competitive Analysis Matrix',
    subtitle: 'Direct & indirect competitor breakdown, feature comparison matrix, pricing models & GTM channel analysis.',
    category: 'competitive',
    bestFor: 'Understanding competitive landscape before positioning or roadmap decisions.',
    iconName: 'Table',
    section_definitions: [
      { key: 'market_scope', title: 'Market & Scope Definition', type: 'free_text' },
      { key: 'direct_competitors', title: 'Direct Competitors Matrix', type: 'data_bound', source: 'product.competitors' },
      { key: 'indirect_competitors', title: 'Indirect Competitors & Substitutes', type: 'free_text' },
      { key: 'feature_comparison', title: 'Feature Comparison Grid', type: 'free_text' },
      { key: 'pricing_comparison', title: 'Pricing & Business Model Comparison', type: 'free_text' },
      { key: 'gtm_comparison', title: 'Go-to-Market & Acquisition Channels', type: 'free_text' },
      { key: 'key_takeaways', title: 'Strategic Takeaways & Differentiation Edge', type: 'free_text' },
    ],
  },

  tam_sam_som_sizing: {
    id: 'tam_sam_som_sizing',
    name: 'TAM / SAM / SOM Sizing',
    subtitle: 'Total addressable, serviceable addressable, and serviceable obtainable market sizing with calculations.',
    category: 'market_sizing',
    bestFor: 'Assessing market opportunity size, investor decks, and market entry prioritization.',
    iconName: 'TrendingUp',
    section_definitions: [
      { key: 'market_name', title: 'Target Market Scope', type: 'free_text' },
      { key: 'tam_calculation', title: 'TAM (Total Addressable Market) Calculation', type: 'free_text' },
      { key: 'sam_calculation', title: 'SAM (Serviceable Addressable Market) Calculation', type: 'free_text' },
      { key: 'som_calculation', title: 'SOM (Serviceable Obtainable Market) Calculation', type: 'free_text' },
      { key: 'sanity_check', title: 'Sanity Check & Competitor Comparison', type: 'free_text' },
    ],
  },

  icp_and_persona: {
    id: 'icp_and_persona',
    name: 'Ideal Customer Profile (ICP) & Persona',
    subtitle: 'Firmographics, buyer persona vs user persona, jobs-to-be-done, and anti-persona boundaries.',
    category: 'customer_icp',
    bestFor: 'B2B SaaS targeting where buyer and user are separate stakeholders.',
    iconName: 'Users',
    section_definitions: [
      { key: 'icp_definition', title: 'ICP Firmographics & Company Profile', type: 'data_bound', source: 'product.target_market' },
      { key: 'buyer_persona', title: 'Buyer Persona Profile', type: 'data_bound', source: 'product.personas' },
      { key: 'user_persona', title: 'User Persona & JTBD Profile', type: 'free_text' },
      { key: 'anti_persona', title: 'Anti-Persona (Who We Explicitly Avoid)', type: 'free_text' },
      { key: 'validation_sources', title: 'Validation Evidence & Research Sources', type: 'free_text' },
    ],
  },

  customer_discovery_guide: {
    id: 'customer_discovery_guide',
    name: 'Customer Discovery & Interview Guide',
    subtitle: 'Structured discovery goals, non-leading interview questions, and synthesis template.',
    category: 'discovery',
    bestFor: 'Qualitative customer interviews to uncover real problems before building.',
    iconName: 'MessageSquare',
    section_definitions: [
      { key: 'research_goal', title: 'Research Goal & Core Questions', type: 'free_text' },
      { key: 'participant_criteria', title: 'Participant Criteria & Screener', type: 'free_text' },
      { key: 'interview_guide', title: 'Interview Question Guide (Non-Leading)', type: 'free_text' },
      { key: 'synthesis_matrix', title: 'Interview Synthesis Matrix', type: 'free_text' },
      { key: 'cross_interview_patterns', title: 'Cross-Interview Patterns & Recurring Language', type: 'free_text' },
    ],
  },

  win_loss_analysis: {
    id: 'win_loss_analysis',
    name: 'Win / Loss Analysis',
    subtitle: 'Deal outcome analysis, decision criteria, primary win/loss drivers, and aggregate pattern tracking.',
    category: 'win_loss',
    bestFor: 'Understanding why sales deals are won or lost to improve conversion & positioning.',
    iconName: 'BarChart2',
    section_definitions: [
      { key: 'deal_overview', title: 'Deal Overview & Segment', type: 'free_text' },
      { key: 'decision_criteria', title: 'Buyer Decision Criteria', type: 'free_text' },
      { key: 'competitive_context', title: 'Competitive Alternatives Evaluated', type: 'free_text' },
      { key: 'why_won_lost', title: 'Primary Win / Loss Drivers', type: 'free_text' },
      { key: 'sales_cycle_notes', title: 'Sales Cycle Friction & Stakeholder Notes', type: 'free_text' },
      { key: 'pattern_tracking', title: 'Aggregate Pattern Tracking', type: 'free_text' },
      { key: 'action_items', title: 'Product & Positioning Action Items', type: 'free_text' },
    ],
  },

  opportunity_assessment: {
    id: 'opportunity_assessment',
    name: 'Problem Validation & Opportunity Assessment',
    subtitle: 'Hypothesis testing, evidence for/against, severity vs frequency, and willingness to pay.',
    category: 'opportunity',
    bestFor: 'Validating an idea before committing strategy bets or PRDs.',
    iconName: 'Target',
    section_definitions: [
      { key: 'hypothesis', title: 'Problem & Value Hypothesis', type: 'free_text' },
      { key: 'evidence_for', title: 'Evidence Supporting Hypothesis', type: 'free_text' },
      { key: 'evidence_against', title: 'Evidence Against & Unknowns', type: 'free_text' },
      { key: 'market_signal', title: 'Market Signal & Existing Workarounds', type: 'free_text' },
      { key: 'severity_frequency', title: 'Severity vs Frequency Matrix', type: 'free_text' },
      { key: 'willingness_to_pay', title: 'Willingness to Pay Signals', type: 'free_text' },
      { key: 'validation_verdict', title: 'Validation Verdict (Proceed / Kill / Pivot)', type: 'free_text' },
    ],
  },

  positioning_perceptual_map: {
    id: 'positioning_perceptual_map',
    name: 'Positioning & Perceptual Map',
    subtitle: 'Buyer evaluation axes, 2x2 perceptual map, white space identification, and positioning statement.',
    category: 'positioning',
    bestFor: 'Mapping market positioning relative to competitors on key buyer axes.',
    iconName: 'Compass',
    section_definitions: [
      { key: 'buyer_axes', title: 'Buyer Evaluation Axes', type: 'free_text' },
      { key: 'perceptual_map', title: '2x2 Perceptual Map Layout', type: 'free_text' },
      { key: 'white_space', title: 'Unoccupied White Space Opportunities', type: 'free_text' },
      { key: 'positioning_statement', title: 'Product Positioning Statement', type: 'free_text' },
      { key: 'positioning_validation', title: 'Customer Perception Validation', type: 'free_text' },
    ],
  },

  industry_trends_scan: {
    id: 'industry_trends_scan',
    name: 'Industry & Market Trends Scan',
    subtitle: 'Macro trends, customer behavior shifts, competitor moves, tech shifts, and strategic implications.',
    category: 'trends',
    bestFor: 'Quarterly or annual environmental scanning to adapt product strategy.',
    iconName: 'Globe',
    section_definitions: [
      { key: 'macro_trends', title: 'Macro Economic & Industry Trends', type: 'free_text' },
      { key: 'customer_shifts', title: 'Customer Behavior Shifts', type: 'free_text' },
      { key: 'competitor_moves', title: 'Competitor Movements & Pivots', type: 'free_text' },
      { key: 'technology_shifts', title: 'Technology Shifts & Emerging Capabilities', type: 'free_text' },
      { key: 'emerging_segments', title: 'Emerging Buyer Segments & Use Cases', type: 'free_text' },
      { key: 'strategy_implications', title: 'Strategic Implications & Roadmap Adjustments', type: 'free_text' },
    ],
  },

  pricing_research_spec: {
    id: 'pricing_research_spec',
    name: 'Pricing Research & Value Metrics',
    subtitle: 'Value metric identification, competitor pricing benchmarks, Van Westendorp price sensitivity analysis.',
    category: 'pricing',
    bestFor: 'Gaining empirical evidence before setting or changing product pricing.',
    iconName: 'DollarSign',
    section_definitions: [
      { key: 'value_metric', title: 'Value Metric Identification', type: 'free_text' },
      { key: 'pricing_benchmark', title: 'Competitor Pricing Benchmark', type: 'free_text' },
      { key: 'van_westendorp', title: 'Van Westendorp Price Sensitivity Analysis', type: 'free_text' },
      { key: 'willingness_to_pay', title: 'Customer Willingness to Pay Data', type: 'free_text' },
      { key: 'packaging_hypothesis', title: 'Proposed Tiers & Feature Gating', type: 'free_text' },
      { key: 'pricing_risks', title: 'Pricing & Packaging Risk Analysis', type: 'free_text' },
    ],
  },

  voc_usage_synthesis: {
    id: 'voc_usage_synthesis',
    name: 'Product Usage & Voice of Customer Synthesis',
    subtitle: 'Product analytics, support ticket themes, feature request clustering, NPS verbatims, and sales call themes.',
    category: 'voc',
    bestFor: 'Mining existing product usage and customer feedback for high-signal roadmap inputs.',
    iconName: 'PieChart',
    section_definitions: [
      { key: 'usage_patterns', title: 'Product Analytics & Usage Patterns', type: 'free_text' },
      { key: 'support_themes', title: 'Support Ticket & Friction Themes', type: 'free_text' },
      { key: 'feature_requests', title: 'Feature Request Clusters & Root Needs', type: 'free_text' },
      { key: 'nps_verbatims', title: 'NPS & CSAT Verbatim Analysis', type: 'free_text' },
      { key: 'sales_call_themes', title: 'Sales & CS Call Themes', type: 'free_text' },
      { key: 'synthesized_insights', title: 'Top Synthesized Insights for Roadmap', type: 'free_text' },
    ],
  },
}
