import type { DocumentSectionDef } from './actions'

export interface RoadmapTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'exec_board' | 'theme' | 'timeline' | 'outcome' | 'lean_kanban' | 'gist' | 'okr_linked' | 'portfolio' | 'public' | 'master_spec'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const ROADMAP_TEMPLATE_VARIANTS: Record<string, RoadmapTemplateVariant> = {
  master_product_roadmap: {
    id: 'master_product_roadmap',
    name: 'Comprehensive Master Product Roadmap (20 Sections)',
    subtitle: 'End-to-end enterprise product roadmap spec covering strategy, themes, quarterly horizons & GTM mapping.',
    category: 'master_spec',
    bestFor: 'Enterprise products, annual planning, multi-quarter executive alignment & board presentations.',
    iconName: 'Compass',
    section_definitions: [
      { key: 'roadmap_purpose', title: '1. Roadmap Purpose & Strategic Context', type: 'free_text', placeholder: 'Explain what this roadmap communicates, strategic context, and core roadmap principles.' },
      { key: 'product_vision', title: '2. Product Vision & Mission', type: 'free_text', placeholder: 'Long-term product vision and mission statement.' },
      { key: 'strategic_objectives', title: '3. Strategic Objectives & Business Outcomes', type: 'free_text', placeholder: '| ID | Strategic Objective | Business Outcome | Success Metric |\n|---|---|---|---|\n| SO-01 | [Objective] | [Outcome] | [Metric] |' },
      { key: 'roadmap_themes', title: '4. Strategic Roadmap Themes', type: 'free_text', placeholder: '| Theme | Description | Strategic Objective |\n|---|---|---|\n| Inventory Intelligence | Improve visibility and accuracy | SO-01 |' },
      { key: 'roadmap_overview', title: '5. High-Level Roadmap Overview', type: 'free_text', placeholder: '| Initiative | Theme | Q1 | Q2 | Q3 | Q4 | Status |\n|---|---|---|---|---|---|---|\n| Initiative 1 | Theme 1 | ● | | | | Planned |' },
      { key: 'detailed_initiatives', title: '6. Detailed Roadmap Initiatives (RI-001+)', type: 'free_text', placeholder: 'Detailed initiative breakdown: Problem, Desired Outcome, Customer/Business Impact, Deliverables, Metrics, Risks & Dependencies.' },
      { key: 'quarterly_breakdown', title: '7. Quarterly Roadmap Horizon (Q1-Q4)', type: 'free_text', placeholder: 'Q1, Q2, Q3, Q4 Objectives, Key Initiatives, Expected Outcomes, and Success Metrics.' },
      { key: 'initiative_prioritization', title: '8. Initiative Prioritization & Tradeoffs', type: 'free_text', placeholder: '| Initiative | Customer Impact | Business Impact | Effort | Strategic Fit | Priority |\n|---|---|---|---|---|---|' },
      { key: 'roadmap_status_tracker', title: '9. Roadmap Status Tracker', type: 'free_text', placeholder: '| Initiative | Status | Progress % | Owner | Target Date |\n|---|---|---|---|---|' },
      { key: 'releases_schedule', title: '10. Releases & Launch Criteria', type: 'free_text', placeholder: '| Release | Target Date | Major Initiatives | Outcome | Status |\n|---|---|---|---|---|' },
      { key: 'discovery_pipeline', title: '11. Product Discovery Pipeline', type: 'free_text', placeholder: '| Idea | Problem | Evidence | Discovery Status | Decision |\n|---|---|---|---|---|' },
      { key: 'roadmap_dependencies', title: '12. Cross-Functional Dependencies', type: 'free_text', placeholder: '| Initiative | Dependency | Owner | Impact | Status |\n|---|---|---|---|---|' },
      { key: 'risks_and_assumptions', title: '13. Risks & Strategic Assumptions', type: 'free_text', placeholder: 'Risks & Assumptions matrices with probability, impact, confidence, and validation methods.' },
      { key: 'metrics_and_outcomes', title: '14. Key Metrics & Outcome Tracking', type: 'data_bound', source: 'product.north_star_kpis' },
      { key: 'delivery_mapping', title: '15. Roadmap → Delivery Mapping (Epics & PRDs)', type: 'free_text', placeholder: '| Roadmap Initiative | Epic | Feature PRD | User Stories | Sprint |\n|---|---|---|---|---|' },
      { key: 'roadmap_change_log', title: '16. Roadmap Change Log', type: 'free_text', placeholder: '| Date | Change | Reason | Approved By |\n|---|---|---|---|' },
      { key: 'stakeholder_communication', title: '17. Stakeholder Communication Plan', type: 'free_text', placeholder: 'Audience, Frequency, and Communication Formats across Leadership, Eng, Sales & Ops.' },
      { key: 'roadmap_review_cadence', title: '18. Roadmap Review Cadence', type: 'free_text', placeholder: 'Monthly operational review + quarterly strategic review guidelines.' },
      { key: 'related_documents', title: '19. Related Strategy & PRD Documents', type: 'free_text', placeholder: 'Links to Product Strategy, Market Research, PRDs, and Sprint Backlogs.' },
      { key: 'roadmap_approvals', title: '20. Governance & Executive Sign-Off', type: 'free_text', placeholder: '| Role | Name | Status | Date |\n|---|---|---|---|' }
    ]
  },
  now_next_later: {
    id: 'now_next_later',
    name: 'Now / Next / Later Roadmap',
    subtitle: 'Communicates intent and sequencing without the false precision of committed dates.',
    category: 'exec_board',
    bestFor: 'Exec and customer-facing roadmaps — ideal for ProdPad/Janna Bastow framework.',
    iconName: 'Zap',
    section_definitions: [
      { key: 'now_horizon', title: 'NOW Horizon (Actively Building This Quarter)', type: 'free_text', placeholder: 'Actively being built with high confidence:\n- [Initiative 1] — [1-line outcome it delivers]\n- [Initiative 2]' },
      { key: 'next_horizon', title: 'NEXT Horizon (Defined & Prioritized Soon)', type: 'free_text', placeholder: 'Defined, prioritized, starting soon (no fixed date):\n- [Initiative 1]\n- [Initiative 2]' },
      { key: 'later_horizon', title: 'LATER Horizon (Directionally Planned)', type: 'free_text', placeholder: 'Directionally planned, not yet scoped in detail (no committed dates):\n- [Initiative 1]' },
      { key: 'exploring_horizon', title: 'EXPLORING (Discovery & Concept Phase)', type: 'free_text', placeholder: 'Validating whether this belongs on the roadmap at all:\n- [Idea 1]' }
    ]
  },
  theme_based: {
    id: 'theme_based',
    name: 'Theme-Based Roadmap',
    subtitle: 'Organizes work around customer & business problems rather than feature lists.',
    category: 'theme',
    bestFor: 'Keeping roadmaps legible even as individual features change during discovery.',
    iconName: 'Layers',
    section_definitions: [
      { key: 'theme_1', title: 'Theme 1: Time-to-Value & Onboarding', type: 'free_text', placeholder: 'Why this theme: Problem/Opportunity statement.\n- Initiative A (Now)\n- Initiative B (Next)\n- Initiative C (Later)' },
      { key: 'theme_2', title: 'Theme 2: Enterprise Readiness & Security', type: 'free_text', placeholder: 'Why this theme: Problem/Opportunity statement.\n- Initiative A (Now)\n- Initiative B (Next)' },
      { key: 'theme_3', title: 'Theme 3: Growth & Monitization Levers', type: 'free_text', placeholder: 'Why this theme: Problem/Opportunity statement.\n- Initiative A (Now)' }
    ]
  },
  timeline_release: {
    id: 'timeline_release',
    name: 'Timeline / Release-Based Roadmap',
    subtitle: 'Commits to target dates for regulatory, contractual, or marketing launch coordination.',
    category: 'timeline',
    bestFor: 'Hardware, compliance deadlines, contractual commitments, and firm launch dates.',
    iconName: 'TrendingUp',
    section_definitions: [
      { key: 'swimlane_schedule', title: 'Team Swimlanes & Time Horizon Schedule', type: 'free_text', placeholder: '| Team | Q1 | Q2 | Q3 | Q4 |\n|---|---|---|---|---|\n| Core App | [Feature 1] | [Feature 2] | | |\n| Platform | | [Feature 3] | [Feature 4] | |' },
      { key: 'release_v1', title: 'Release v1.0 Horizon', type: 'free_text', placeholder: 'Target Date, Scope, Dependencies, Risk to date (Low/Med/High).' },
      { key: 'release_v2', title: 'Release v2.0 Horizon', type: 'free_text', placeholder: 'Target Date, Scope, Dependencies, Risk to date.' }
    ]
  },
  outcome_based: {
    id: 'outcome_based',
    name: 'Outcome-Based Roadmap',
    subtitle: 'Focuses every roadmap item on measurable outcomes rather than shipping features.',
    category: 'outcome',
    bestFor: 'Product teams moving away from "feature factory" mode toward measurable impact.',
    iconName: 'BarChart3',
    section_definitions: [
      { key: 'outcome_1', title: 'Outcome 1: Onboarding Friction Reduction', type: 'free_text', placeholder: 'Baseline Metric: [Current]\nTarget Metric: [Target]\nTimeframe: [Q1]\nContributing Initiatives: [List of features]' },
      { key: 'outcome_2', title: 'Outcome 2: Retention & Expansion Lift', type: 'free_text', placeholder: 'Baseline Metric: [Current]\nTarget Metric: [Target]\nTimeframe: [Q2]\nContributing Initiatives: [List of features]' },
      { key: 'outcome_3', title: 'Outcome 3: Cost & Infrastructure Efficiency', type: 'free_text', placeholder: 'Baseline Metric: [Current]\nTarget Metric: [Target]\nTimeframe: [Q3]\nContributing Initiatives: [List of features]' }
    ]
  },
  kanban_style: {
    id: 'kanban_style',
    name: 'Kanban-Style Roadmap',
    subtitle: 'Emphasizes continuous flow, WIP limits, and rapid iteration over fixed dates.',
    category: 'lean_kanban',
    bestFor: 'Lean, continuous-flow teams without fixed sprint boundaries.',
    iconName: 'GitMerge',
    section_definitions: [
      { key: 'kanban_backlog', title: 'Backlog & Raw Ideas', type: 'free_text', placeholder: 'Unscoped raw ideas undergoing initial review.' },
      { key: 'kanban_ready', title: 'Ready (Scoped & Prioritized)', type: 'free_text', placeholder: 'Fully scoped PRDs ready for engineering pickup.' },
      { key: 'kanban_in_progress', title: 'In Progress (Active WIP)', type: 'free_text', placeholder: 'Actively in engineering build phase.' },
      { key: 'kanban_validating', title: 'Validating (Post-Launch Telemetry)', type: 'free_text', placeholder: 'Shipped items actively monitoring success metrics.' },
      { key: 'kanban_done', title: 'Done (Completed & Shipped)', type: 'free_text', placeholder: 'Completed initiatives successfully validated.' }
    ]
  },
  gist_roadmap: {
    id: 'gist_roadmap',
    name: 'GIST Roadmap (Goals, Ideas, Step-Projects, Tasks)',
    subtitle: 'Itamar Gilad framework preventing big roadmap bets built on untested assumptions.',
    category: 'gist',
    bestFor: 'Large backlogs requiring time-boxed validation step-projects before full builds.',
    iconName: 'Building',
    section_definitions: [
      { key: 'gist_goals', title: '1. Goals (High-Level Objectives)', type: 'free_text', placeholder: 'Durable, high-level objectives reviewed quarterly/annually.' },
      { key: 'gist_ideas', title: '2. Ideas Backlog (Confidence Scored)', type: 'free_text', placeholder: '| Idea | Linked Goal | Confidence Score | Impact Estimate |\n|---|---|---|---|' },
      { key: 'gist_step_projects', title: '3. Step-Projects (1-6 Week Experiments)', type: 'free_text', placeholder: '| Step-Project | Linked Idea | Success Criteria | Status |\n|---|---|---|---|' },
      { key: 'gist_tasks', title: '4. Active Execution Tasks', type: 'free_text', placeholder: 'Day-to-day execution work supporting active step-projects.' }
    ]
  },
  goal_linked: {
    id: 'goal_linked',
    name: 'Goal-Linked Roadmap (OKR-Tied)',
    subtitle: 'Explicitly maps every roadmap initiative directly to quarterly OKRs and KRs.',
    category: 'okr_linked',
    bestFor: 'Organizations demanding direct accountability between roadmap items and OKRs.',
    iconName: 'Check',
    section_definitions: [
      { key: 'okr_objective_1', title: 'Objective 1 & Linked Initiatives', type: 'free_text', placeholder: 'Objective: [From OKR doc]\nKey Result: [Specific metric target]\nRoadmap Items:\n- [Initiative 1] — Owner: [Name] — Status: [Now] — Confidence: [High]' },
      { key: 'okr_objective_2', title: 'Objective 2 & Linked Initiatives', type: 'free_text', placeholder: 'Objective: [From OKR doc]\nKey Result: [Specific metric target]\nRoadmap Items:\n- [Initiative 1] — Owner: [Name] — Status: [Next]' },
      { key: 'unmapped_work', title: 'Unmapped Work & Tech Debt Audit', type: 'free_text', placeholder: 'Roadmap items not tied to current OKRs — flagged deliberately for leadership review.' }
    ]
  },
  portfolio_roadmap: {
    id: 'portfolio_roadmap',
    name: 'Portfolio Roadmap (Multi-Product)',
    subtitle: 'Manages roadmaps across multiple products under a unified strategic umbrella.',
    category: 'portfolio',
    bestFor: 'Multi-product companies, platform teams, and cross-product dependency management.',
    iconName: 'Smartphone',
    section_definitions: [
      { key: 'product_a_lane', title: 'Product Line A Roadmap', type: 'free_text', placeholder: 'Q1-Q4 roadmap themes and major releases for Product A.' },
      { key: 'product_b_lane', title: 'Product Line B Roadmap', type: 'free_text', placeholder: 'Q1-Q4 roadmap themes and major releases for Product B.' },
      { key: 'shared_platform_lane', title: 'Shared Platform & Infrastructure Lane', type: 'free_text', placeholder: 'Platform work benefiting all products (e.g. Shared Auth, Billing Engine).' },
      { key: 'cross_product_dependencies', title: 'Cross-Product Dependencies & Resource Bottlenecks', type: 'free_text', placeholder: '| Dependency | From → To | Risk Level | Resource Contention |\n|---|---|---|---|' }
    ]
  },
  public_facing: {
    id: 'public_facing',
    name: 'Public-Facing Roadmap',
    subtitle: 'External roadmap for customers and prospects — builds trust without contractual promises.',
    category: 'public',
    bestFor: 'Sharing externally on marketing sites, customer communities, and sales mappers.',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'shipped_recently', title: 'Shipped Recently', type: 'free_text', placeholder: 'Recently launched features highlighting customer benefits.' },
      { key: 'in_progress_public', title: 'In Progress (Coming Soon)', type: 'free_text', placeholder: 'Features actively being built with high-level customer benefits.' },
      { key: 'planned_public', title: 'Planned (Future Horizon)', type: 'free_text', placeholder: 'Broad themes and directions planned for future releases.' },
      { key: 'under_consideration', title: 'Under Consideration & Feedback Voting', type: 'free_text', placeholder: 'Ideas under review with customer voting & feedback mechanisms.' }
    ]
  }
}
