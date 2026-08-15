import { DocumentSectionDef } from './actions'

export interface PrdTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'startup' | 'leadership' | 'technical' | 'enterprise' | 'growth' | 'b2c'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const PRD_TEMPLATE_VARIANTS: Record<string, PrdTemplateVariant> = {
  standard_prd: {
    id: 'standard_prd',
    name: 'Standard Default PRD',
    subtitle: 'Original default product requirements document format with VoC evidence & telemetry.',
    category: 'startup',
    bestFor: 'General product specs, agile user stories & balanced telemetry.',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'prd_objective', title: 'Objective & Business Value', type: 'data_bound', source: 'prd.objective_overview' },
      { key: 'prd_scope_in', title: 'In Scope', type: 'free_text' },
      { key: 'prd_scope_out', title: 'Out of Scope', type: 'free_text' },
      { key: 'prd_acceptance_criteria', title: 'Acceptance Criteria', type: 'free_text' },
      { 
        key: 'prd_telemetry', 
        title: 'Tracking & Metrics', 
        type: 'free_text',
        placeholder: 'Example:\n- Click rate on the "Checkout" button\n- Time spent on the new form (Goal: < 30s)\n- Daily Active Users (DAU) interacting with the feature'
      },
      { key: 'prd_discovery_insights', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
      { key: 'prd_wireframes', title: 'UX Wireframes & Visual Specifications', type: 'free_text' }
    ],
  },

  startup_one_pager: {
    id: 'startup_one_pager',
    name: 'Lightweight Startup One-Pager',
    subtitle: 'Fast, single-screen format for speed over process.',
    category: 'startup',
    bestFor: 'Pre-seed to Series A startups, fast single-team execution.',
    iconName: 'Zap',
    section_definitions: [
      { key: 'problem', title: 'Problem Statement', type: 'free_text', placeholder: "What's broken or missing in 2-3 sentences." },
      { key: 'solution', title: 'Proposed Solution', type: 'free_text', placeholder: "What we're building in 2-3 sentences." },
      { key: 'success_metric', title: 'Success Metric', type: 'free_text', placeholder: 'The single key metric that proves this worked.' },
      { key: 'scope_in_out', title: 'Scope (In & Out)', type: 'free_text', placeholder: '- In Scope:\n- Out of Scope:' },
      { key: 'done_when', title: 'Done When (Definition of Done)', type: 'free_text', placeholder: 'Specific, observable condition that means this feature ships.' },
    ],
  },

  amazon_pr_faq: {
    id: 'amazon_pr_faq',
    name: 'Amazon Working Backwards (PR-FAQ)',
    subtitle: 'Forces clarity on customer value before building.',
    category: 'leadership',
    bestFor: 'Writing for executive leadership buy-in before implementation.',
    iconName: 'Building',
    section_definitions: [
      { key: 'press_release_headline', title: 'Press Release Headline & Subheading', type: 'free_text', placeholder: 'Headline: One sentence customer-benefit framing.\nSubheading: Who it is for.' },
      { key: 'customer_problem_narrative', title: 'Customer Problem & Solution Narrative', type: 'free_text', placeholder: 'Summary of the customer struggle and how this feature solves it in plain language.' },
      { key: 'leader_and_customer_quotes', title: 'Leader & Customer Quotes', type: 'free_text', placeholder: 'Leader Quote: "Why this matters to our mission..."\nCustomer Quote: "Before and after impact..."' },
      { key: 'internal_faq', title: 'Internal Stakeholder FAQ', type: 'free_text', placeholder: '- Why now?\n- What is the cost/effort?\n- What could make this fail?\n- What are we explicitly NOT doing?' },
      { key: 'external_faq', title: 'External Customer FAQ', type: 'free_text', placeholder: '- What does this cost?\n- How is this different from alternatives?\n- What happens to existing data?' },
    ],
  },

  google_design_doc: {
    id: 'google_design_doc',
    name: 'Google-Style Design Doc Split',
    subtitle: 'Separates product requirements (what/why) from engineering design (how).',
    category: 'technical',
    bestFor: 'Engineering-driven orgs with dedicated PM & Tech Lead pairs.',
    iconName: 'FileCode',
    section_definitions: [
      { key: 'objective_background', title: 'Objective & Background Context', type: 'free_text', placeholder: 'Outcome-oriented goal statement, prior attempts, and background context.' },
      { key: 'user_problem_data', title: 'User Problem & Research', type: 'free_text', placeholder: 'Grounded in research data and user evidence, not assumptions.' },
      { key: 'numbered_requirements', title: 'Numbered Functional Requirements', type: 'free_text', placeholder: '1. Testable requirement statement...\n2. Requirement statement...' },
      { key: 'non_goals', title: 'Explicit Non-Goals', type: 'free_text', placeholder: 'Things we are explicitly NOT solving in this iteration.' },
      { key: 'architecture_context', title: 'System Architecture & Context', type: 'free_text', placeholder: 'Overview of where this feature sits in the technical stack.' },
      { key: 'detailed_engineering_design', title: 'Detailed Engineering Design', type: 'free_text', placeholder: 'Data model, API contracts, schema changes, and sequence diagrams.' },
      { key: 'alternatives_and_tradeoffs', title: 'Alternatives Considered', type: 'free_text', placeholder: 'Alternative designs evaluated and reasons for rejection.' },
      { key: 'cross_cutting_concerns', title: 'Security, Scalability & Monitoring', type: 'free_text', placeholder: 'Auth rules, data privacy, load targets, and alert thresholds.' },
    ],
  },

  shopify_rfc: {
    id: 'shopify_rfc',
    name: 'Shopify-Style RFC',
    subtitle: 'Discussion-first proposal inviting early engineering & design critique.',
    category: 'technical',
    bestFor: 'Cross-functional teams iterating in the open before locking specs.',
    iconName: 'MessageSquare',
    section_definitions: [
      { key: 'rfc_summary_status', title: 'RFC Summary & Status', type: 'free_text', placeholder: 'Status: Draft -> Under Discussion -> Accepted -> Implemented\nSummary: 2-3 sentences on what and why.' },
      { key: 'motivation_inaction', title: 'Motivation & Cost of Inaction', type: 'free_text', placeholder: 'What happens if we do nothing? What is the cost of delay?' },
      { key: 'proposal_approach', title: 'Proposal & Architecture Approach', type: 'free_text', placeholder: 'Detailed proposal for team critique and feedback.' },
      { key: 'alternatives_tradeoffs', title: 'Alternatives Considered', type: 'free_text', placeholder: 'At least 2 alternative approaches with trade-off analysis.' },
      { key: 'open_questions', title: 'Open Unresolved Questions', type: 'free_text', placeholder: 'Explicitly unresolved items inviting team comments.' },
      { key: 'impact_analysis', title: 'Impact on Adjacent Systems & Teams', type: 'free_text', placeholder: 'Which teams, APIs, or customer surfaces are touched.' },
    ],
  },

  technical_pm: {
    id: 'technical_pm',
    name: 'Technical PM Spec',
    subtitle: 'API-first, schema-heavy, and data contract focused spec.',
    category: 'technical',
    bestFor: 'API-first features, engine updates, data infrastructure, and POS work.',
    iconName: 'Cpu',
    section_definitions: [
      { key: 'problem_goal', title: 'Problem Statement & Measurable Goal', type: 'free_text', placeholder: 'Standard problem statement + quantitative success target.' },
      { key: 'user_stories', title: 'User Stories', type: 'free_text', placeholder: 'As a [role], I want [action], so that [benefit].' },
      { key: 'api_data_contract', title: 'API & Data Schema Contract', type: 'free_text', placeholder: 'Endpoints, request/response shapes, database migrations, and schema fields.' },
      { key: 'system_behavior_rules', title: 'System Behavior & Business Rules', type: 'free_text', placeholder: 'State transitions, validation rules, and calculation formulas.' },
      { key: 'edge_cases_failure_modes', title: 'Edge Cases & Failure Modes', type: 'free_text', placeholder: 'Scenario | Expected Behavior | Recovery Action' },
      { key: 'performance_scale', title: 'Performance, Latency & Scale Budget', type: 'free_text', placeholder: 'Expected throughput (RPS), max latency budget (ms), rate limits.' },
      { key: 'security_permissions', title: 'Security, Auth & Role Permissions', type: 'free_text', placeholder: 'Role RBAC permissions, token auth, audit logging.' },
      { key: 'rollout_monitoring', title: 'Feature Flagging & Monitoring Alert Thresholds', type: 'free_text', placeholder: 'Ramp strategy, logging parameters, and alerting thresholds.' },
    ],
  },

  growth_pm: {
    id: 'growth_pm',
    name: 'Generalist / Growth PM Spec',
    subtitle: 'Experimentation-driven spec for funnel optimization & conversion.',
    category: 'growth',
    bestFor: 'A/B testing, funnel optimization, onboarding improvements, and growth loops.',
    iconName: 'TrendingUp',
    section_definitions: [
      { key: 'hypothesis_rationale', title: 'Experiment Hypothesis & Rationale', type: 'free_text', placeholder: 'If we [change], then [user behavior] will [improve], because [reasoning].' },
      { key: 'baseline_state', title: 'Current Funnel Baseline & Target Users', type: 'free_text', placeholder: 'Baseline metrics, drop-off rates, and target user cohort.' },
      { key: 'experiment_design', title: 'Experiment Design (Control vs Variants)', type: 'free_text', placeholder: 'Control vs Variant A/B parameters, sample size, and test duration.' },
      { key: 'primary_guardrail_metrics', title: 'Primary Lift & Guardrail Metrics', type: 'free_text', placeholder: 'Primary success metric + guardrail metrics to prevent cannibalization.' },
      { key: 'user_flow_ux', title: 'Before & After User Flow', type: 'free_text', placeholder: 'Step-by-step user interaction flow.' },
      { key: 'ramp_kill_criteria', title: 'Rollout Ramp & Kill Criteria', type: 'free_text', placeholder: '% allocation ramp schedule and kill switch triggers.' },
    ],
  },

  b2b_enterprise: {
    id: 'b2b_enterprise',
    name: 'B2B Enterprise Spec',
    subtitle: 'Tailored for multi-tenant, permission-heavy enterprise software.',
    category: 'enterprise',
    bestFor: 'Enterprise software, financial tools, inventory platforms, multi-role admin software.',
    iconName: 'ShieldCheck',
    section_definitions: [
      { key: 'problem_tier_segment', title: 'Problem Statement (SMB vs Enterprise)', type: 'free_text', placeholder: 'Defines affected customer tiers (SMB vs Mid-Market vs Enterprise).' },
      { key: 'business_product_metrics', title: 'Business & Retention Metrics', type: 'free_text', placeholder: 'Impact on retention, expansion ARR, support ticket reduction, and NRR.' },
      { key: 'personas_buyer_admin', title: 'Personas (End-User vs Admin vs Buyer)', type: 'free_text', placeholder: 'Differentiates requirements for Buyers, Admins, and End-Users.' },
      { key: 'core_functionality', title: 'Core Functional Requirements', type: 'free_text', placeholder: 'Detailed requirements table with priority tags.' },
      { key: 'admin_permissions_matrix', title: 'Admin & Role Permissions Matrix', type: 'free_text', placeholder: 'RBAC breakdown: what each role can view/edit/approve.' },
      { key: 'integration_data_reqs', title: 'ERP & Third-Party System Integrations', type: 'free_text', placeholder: 'Sync protocols with accounting, ERP, or external B2B APIs.' },
      { key: 'compliance_security', title: 'Compliance, Data Residency & SOC2', type: 'free_text', placeholder: 'Data residency rules, audit trail requirements, and SOC2 compliance.' },
      { key: 'rollout_support_enablement', title: 'Beta Selection & Support Enablement', type: 'free_text', placeholder: 'Beta customer cohort, account feature flags, CS enablement.' },
    ],
  },

  b2c_consumer: {
    id: 'b2c_consumer',
    name: 'B2C Consumer App Spec',
    subtitle: 'High-volume, consumer-facing app specification with microcopy focus.',
    category: 'b2c',
    bestFor: 'Mobile apps, consumer web apps, high-volume consumer features.',
    iconName: 'Smartphone',
    section_definitions: [
      { key: 'problem_research', title: 'User Research Problem Statement', type: 'free_text', placeholder: 'Grounded in user reviews, app feedback, and qualitative interviews.' },
      { key: 'north_star_metric', title: 'North-Star Metric & Core Goal', type: 'free_text', placeholder: 'Primary consumer engagement/retention metric.' },
      { key: 'persona_behavior', title: 'Consumer Behavioral Persona', type: 'free_text', placeholder: 'Primary persona defined by behavioral patterns rather than demographics.' },
      { key: 'user_flow_wireframes', title: 'User Flow, Wireframes & Microcopy', type: 'free_text', placeholder: 'UX interaction states, motion notes, and copy specs.' },
      { key: 'ab_test_plan', title: 'A/B Test & Rollout Plan', type: 'free_text', placeholder: 'Experiment allocation and phased % app rollout.' },
      { key: 'empty_offline_states', title: 'Empty, Error & Offline States', type: 'free_text', placeholder: 'Zero-data states, offline syncing, and connectivity recovery.' },
      { key: 'accessibility_wcag', title: 'Accessibility & Screen Reader Specs', type: 'free_text', placeholder: 'WCAG compliance, contrast, and screen reader labels.' },
    ],
  },

  merged_tech_spec: {
    id: 'merged_tech_spec',
    name: 'Merged PRD + Tech Spec',
    subtitle: 'Single combined document shared between PM and Engineering.',
    category: 'technical',
    bestFor: 'Small agile squads where PM and Eng leads co-author specs.',
    iconName: 'GitMerge',
    section_definitions: [
      { key: 'problem_goal', title: '1. Problem & Measurable Goal', type: 'free_text', placeholder: 'Problem statement + quantitative success metric.' },
      { key: 'user_stories', title: '2. User Stories', type: 'free_text', placeholder: 'As a [user], I want [action], so that [benefit].' },
      { key: 'requirements_moscow', title: '3. Functional Requirements (MoSCoW)', type: 'free_text', placeholder: 'Must Have / Should Have / Could Have requirements.' },
      { key: 'technical_approach', title: '4. Technical Approach & Schema Changes', type: 'free_text', placeholder: 'Architecture summary, database migrations, API changes.' },
      { key: 'edge_cases_errors', title: '5. Edge Cases & Failure Modes', type: 'free_text', placeholder: 'Combined product + engineering edge case list.' },
      { key: 'out_of_scope', title: '6. Out of Scope (Non-Goals)', type: 'free_text', placeholder: 'Explicit non-goals to prevent scope creep.' },
      { key: 'testing_qa_plan', title: '7. Testing & QA Plan', type: 'free_text', placeholder: 'QA approach, automated test suite, and key test cases.' },
      { key: 'rollout_plan', title: '8. Rollout & Rollback Strategy', type: 'free_text', placeholder: 'Feature flag strategy, monitoring alerts, rollback plan.' },
    ],
  },

  enterprise_full_prd: {
    id: 'enterprise_full_prd',
    name: '23-Section Enterprise PRD',
    subtitle: 'Comprehensive 23-section enterprise format covering vision, RBAC, compliance, analytics & DoD.',
    category: 'enterprise',
    bestFor: 'Fortune 500, regulated enterprise platforms, high-stakes product releases & audit compliance.',
    iconName: 'ShieldCheck',
    section_definitions: [
      { key: 'executive_summary', title: '1. Executive Summary', type: 'free_text', placeholder: '### 1.1 Feature Overview\n[Brief overview]\n\n### 1.2 Problem Statement\n> [Problem narrative]\n\n### 1.3 Opportunity\n[Why solving this matters]' },
      { key: 'goals_objectives', title: '2. Goals & Objectives', type: 'free_text', placeholder: '### 2.1 Feature Goals\n1. [Goal 1]\n2. [Goal 2]\n\n### 2.2 Success Criteria\n- [ ] [Criteria 1]\n\n### 2.3 Non-Goals\n- [Explicit out-of-scope non-goal]' },
      { key: 'user_personas', title: '3. User Personas', type: 'free_text', placeholder: '### Primary Persona: [Role]\n- Needs: ...\n- Pain Points: ...\n\n### Secondary Persona: [Role]\n- Needs: ...' },
      { key: 'prd_discovery_insights', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
      { key: 'user_stories', title: '4. User Stories', type: 'free_text', placeholder: '### US-01 — [Story Name]\n**As a** [user]\n**I want to** [action]\n**So that** [benefit]\n\n### US-02 — [Story Name]\n**As a** [user]\n**I want to** [action]\n**So that** [benefit]' },
      { key: 'functional_requirements', title: '5. Functional Requirements', type: 'free_text', placeholder: '### FR-01: [Requirement Name]\n**Description:** [Details]\n**Requirements:**\n- The system shall...\n- The user shall...' },
      { key: 'user_flow', title: '6. User Flow', type: 'free_text', placeholder: '### Primary Flow\n1. User navigates to...\n2. System processes...\n\n### Alternative Flow\n1. If [condition]...\n\n### Error Flow\n1. If [error]...' },
      { key: 'ui_ux_requirements', title: '7. UI / UX Requirements', type: 'free_text', placeholder: '### Screens Required\n- [Screen 1]\n- [Loading State]\n- [Error State]\n\n### Design Reference\n[Figma Link / UI Guidelines]' },
      { key: 'business_rules', title: '8. Business Rules', type: 'free_text', placeholder: '| ID | Business Rule |\n|---|---|\n| BR-01 | Only authorized users can approve adjustments. |\n| BR-02 | Stock quantity cannot drop below zero. |' },
      { key: 'data_requirements', title: '9. Data Requirements', type: 'free_text', placeholder: '### Inputs & Validation\n| Field | Type | Required | Rule |\n|---|---|---|---|\n\n### Output & Data Changes\n- Table/Collection updates\n- API endpoint contracts' },
      { key: 'permissions_access_control', title: '10. Permissions & Access Control', type: 'free_text', placeholder: '| User Role | View | Create | Edit | Delete | Approve |\n|---|---:|---:|---:|---:|---:|\n| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |\n| Staff | ✓ | ✓ | ✗ | ✗ | ✗ |' },
      { key: 'notifications_channels', title: '11. Notifications', type: 'free_text', placeholder: '### Triggers\n- [Event 1]\n- [Event 2]\n\n### Channels\n- In-app / Email / SMS / Push' },
      { key: 'non_functional_requirements', title: '12. Non-Functional Requirements', type: 'free_text', placeholder: '### Performance\n- Load time < 2s\n\n### Security & Compliance\n- Auth, data encryption & residency\n\n### Scalability & Accessibility\n- WCAG AA compliance' },
      { key: 'analytics_tracking', title: '13. Analytics & Tracking', type: 'free_text', placeholder: '### Events\n| Event | Trigger | Properties |\n|---|---|---|\n| `[feature_opened]` | User opens feature | user_id, role |\n\n### Key Metrics\n- Adoption & completion rates' },
      { key: 'acceptance_criteria', title: '14. Acceptance Criteria', type: 'free_text', placeholder: '### AC-01: [Scenario]\n**Given** [initial condition]\n**When** [user action]\n**Then** [expected result]' },
      { key: 'edge_cases', title: '15. Edge Cases', type: 'free_text', placeholder: 'The system must handle:\n- Duplicate submissions\n- Network dropouts\n- Empty states & invalid inputs\n- Session timeout & concurrent updates' },
      { key: 'technical_considerations', title: '16. Technical Considerations', type: 'free_text', placeholder: '### Frontend\n- Components & state management\n\n### Backend\n- Database migrations & API logic\n\n### Infrastructure & Dependencies\n- Deployment & third-party packages' },
      { key: 'qa_testing_requirements', title: '17. QA & Testing Requirements', type: 'free_text', placeholder: '### Testing Suites\n- [ ] Functional testing passed\n- [ ] Integration testing passed\n- [ ] Regression testing passed\n\n### UAT Criteria\n**UAT Owner:** [Name]\n- [Criterion 1]' },
      { key: 'sprint_scope', title: '18. Sprint Scope', type: 'free_text', placeholder: '### In Scope\n- [Deliverables]\n\n### Out of Scope\n- [Deferred items]\n\n### Deliverables Checklist\n- [ ] UI/UX completed\n- [ ] Frontend & Backend completed\n- [ ] Deployment completed' },
      { key: 'dependencies_risks', title: '19. Dependencies & Risks', type: 'free_text', placeholder: '| Type | Description | Impact | Mitigation | Owner |\n|---|---|---|---|---|\n| Dependency | [Details] | High | [Mitigation] | [Name] |\n| Risk | [Details] | Med | [Mitigation] | [Name] |' },
      { key: 'definition_of_done', title: '20. Definition of Done', type: 'free_text', placeholder: 'The feature is considered **Done** when:\n- [ ] All acceptance criteria pass\n- [ ] Code review completed\n- [ ] Automated tests pass\n- [ ] QA & UAT approved\n- [ ] Deployed to production' },
      { key: 'open_questions', title: '21. Open Questions', type: 'free_text', placeholder: '| Question | Owner | Due Date | Status |\n|---|---|---|---|\n| [Question 1] | [Name] | [Date] | Open |' },
      { key: 'decisions_log', title: '22. Decisions Log', type: 'free_text', placeholder: '| Date | Decision | Rationale | Owner |\n|---|---|---|---|\n| [Date] | [Decision] | [Reasoning] | [Owner] |' },
      { key: 'related_documents_approvals', title: '23. Related Documents & Approvals', type: 'free_text', placeholder: '### Document Approval\n| Role | Name | Status | Date |\n|---|---|---|---|\n| Product Manager | [Name] | Pending | [Date] |\n| Tech Lead | [Name] | Pending | [Date] |\n| QA Lead | [Name] | Pending | [Date] |' },
    ],
  },
}

export function getSyncDocumentTemplate(documentType: string, templateId?: string): any {
  if (templateId && PRD_TEMPLATE_VARIANTS[templateId]) {
    const variant = PRD_TEMPLATE_VARIANTS[templateId]
    return {
      id: variant.id,
      document_type: documentType || 'product_requirements_document',
      is_custom: true,
      created_at: new Date().toISOString(),
      section_definitions: variant.section_definitions,
    }
  }

  if (documentType === 'charter') {
    return {
      id: 'charter-template',
      document_type: 'charter',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Executive Summary', type: 'free_text' },
        { key: 'business_case', title: 'Business Case & Justification', type: 'free_text' },
        { key: 'objectives', title: 'Project Objectives', type: 'free_text' },
        { key: 'scope_statement', title: 'Scope Statement', type: 'free_text' },
        { key: 'wbs_dictionary', title: 'Key Deliverables & Work Packages', type: 'free_text' },
        { key: 'success_criteria', title: 'Success Criteria', type: 'free_text' },
        { key: 'assumptions', title: 'Assumptions', type: 'free_text' },
        { key: 'constraints', title: 'Constraints', type: 'free_text' },
        { key: 'risks', title: 'High-Level Risks', type: 'free_text' },
        { key: 'milestones', title: 'Milestones & Key Dates', type: 'free_text' },
        { key: 'organization', title: 'Project Organization & RACI', type: 'free_text' },
        { key: 'approval', title: 'Sign-Off & Approval', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'quality_management_plan') {
    return {
      id: 'quality_management_plan_template',
      document_type: 'quality_management_plan',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [{ key: 'quality_management_data', title: 'Quality Standards', type: 'data_bound' }]
    }
  }

  if (documentType === 'procurement_plan') {
    return {
      id: 'procurement_plan_template',
      document_type: 'procurement_plan',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [{ key: 'procurement_entries', title: 'Procurement Register', type: 'data_bound' }]
    }
  }

  if (documentType === 'closure_report') {
    return {
      id: 'closure_report_template',
      document_type: 'closure_report',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Closure Summary & Statement', type: 'free_text' },
        { key: 'evm_summary', title: 'Final Budget & EVM Performance', type: 'data_bound' },
        { key: 'deliverables_status', title: 'WBS Deliverables Status', type: 'data_bound' },
        { key: 'risks_status', title: 'Final Risk Register & Mitigations', type: 'data_bound' }
      ]
    }
  }

  if (documentType === 'lessons_learned') {
    return {
      id: 'lessons_learned_template',
      document_type: 'lessons_learned',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_context', title: 'Executive Context & Scope', type: 'free_text' },
        { key: 'what_worked_well', title: 'What Worked Well (Successes)', type: 'free_text' },
        { key: 'what_did_not_work', title: 'What Did Not Work (Challenges)', type: 'free_text' },
        { key: 'recommendations_for_future', title: 'Recommendations for Future Projects', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'handover_document') {
    return {
      id: 'handover_document_template',
      document_type: 'handover_document',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'operational_instructions', title: 'Operational & Acceptance Instructions', type: 'free_text' },
        { key: 'deliverables_table', title: 'Transferred WBS Deliverables', type: 'data_bound' },
        { key: 'ongoing_owners', title: 'Ongoing Ownership & Support RACI', type: 'data_bound' },
        { key: 'support_escalation', title: 'Support & Escalation Procedures', type: 'free_text' },
        { key: 'transition_notes', title: 'Transition & Archival Notes', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'post_implementation_review') {
    return {
      id: 'post_implementation_review_template',
      document_type: 'post_implementation_review',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'charter_comparison', title: 'Original Charter Objectives vs Actuals', type: 'data_bound' },
        { key: 'outcome_assessment', title: 'Post-Implementation Outcome Assessment', type: 'free_text' },
        { key: 'roi_and_business_impact', title: 'ROI Realization & Business Impact', type: 'free_text' },
        { key: 'recommendations', title: 'Long-term Recommendations', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'stakeholder_register') {
    return {
      id: 'stakeholder_register_template',
      document_type: 'stakeholder_register',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Stakeholder Summary', type: 'free_text' },
        { key: 'stakeholder_roster', title: 'Stakeholder Roster & Analysis', type: 'data_bound', source: 'register.stakeholders' }
      ]
    }
  }

  if (documentType === 'risk_register') {
    return {
      id: 'risk_register_template',
      document_type: 'risk_register',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Risk Summary & Profile', type: 'free_text' },
        { key: 'risk_log', title: 'Detailed Risk & Mitigation Log', type: 'data_bound', source: 'register.risks' }
      ]
    }
  }

  if (documentType === 'release_notes') {
    return {
      id: 'release_notes_template',
      document_type: 'release_notes',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Summary & Context', type: 'free_text' },
        { key: 'release_scope', title: 'Release Scope (Derived)', type: 'data_bound', source: 'release.scope' },
        { key: 'release_exit_criteria', title: 'Exit Criteria', type: 'data_bound', source: 'release.criteria' }
      ]
    }
  }

  if (documentType === 'deployment_report') {
    return {
      id: 'deployment_report_template',
      document_type: 'deployment_report',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'deployment_summary', title: 'Deployment Summary', type: 'free_text' },
        { key: 'deployment_plan', title: 'Deployment Plan & Execution', type: 'data_bound', source: 'release.deployment' }
      ]
    }
  }

  if (documentType === 'test_summary_report') {
    return {
      id: 'test_summary_report_template',
      document_type: 'test_summary_report',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'test_summary', title: 'QA Summary & Sign-off', type: 'free_text' },
        { key: 'qa_readiness', title: 'QA Readiness Items', type: 'data_bound', source: 'release.qa' },
        { key: 'linked_defects', title: 'Linked Defects', type: 'data_bound', source: 'release.defects' }
      ]
    }
  }

  if (documentType === 'business_case') {
    return {
      id: 'business_case_template',
      document_type: 'business_case',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'problem_statement', title: 'Problem & Opportunity Statement', type: 'data_bound', source: 'initiation.business_case_problem' },
        { key: 'proposed_solution', title: 'Proposed Solution', type: 'data_bound', source: 'initiation.business_case_solution' },
        { key: 'financials', title: 'Financial Estimates & ROI', type: 'data_bound', source: 'initiation.business_case_financials' },
        { key: 'recommendation', title: 'Recommendation', type: 'data_bound', source: 'initiation.business_case_recommendation' }
      ]
    }
  }

  if (documentType === 'feasibility_study') {
    return {
      id: 'feasibility_study_template',
      document_type: 'feasibility_study',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'technical', title: 'Technical Assessment', type: 'data_bound', source: 'initiation.feasibility_technical' },
        { key: 'financial', title: 'Financial Assessment', type: 'data_bound', source: 'initiation.feasibility_financial' },
        { key: 'operational', title: 'Operational Assessment', type: 'data_bound', source: 'initiation.feasibility_operational' },
        { key: 'recommendation', title: 'Overall Recommendation', type: 'data_bound', source: 'initiation.feasibility_recommendation' }
      ]
    }
  }

  if (documentType === 'budget_baseline') {
    return {
      id: 'budget_baseline_template',
      document_type: 'budget_baseline',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Executive Budget Summary', type: 'free_text' },
        { key: 'budget_baseline_table', title: 'Work Package Estimates & S-Curve Baseline', type: 'data_bound', source: 'cost.budget_baseline' }
      ]
    }
  }

  if (documentType === 'issue_log') {
    return {
      id: 'issue_log_template',
      document_type: 'issue_log',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Issue Management & Governance Summary', type: 'free_text' },
        { key: 'issue_roster', title: 'Active & Resolved Issue Log', type: 'data_bound', source: 'accountability.issue_log' }
      ]
    }
  }

  if (documentType === 'schedule_document') {
    return {
      id: 'schedule_document_template',
      document_type: 'schedule_document',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'schedule_assumptions', title: 'Scheduling Assumptions & Constraints', type: 'free_text' },
        { key: 'schedule_narrative', title: 'Baseline Schedule, Milestones & Critical Path Summary', type: 'data_bound', source: 'planning.schedule_document' }
      ]
    }
  }

  if (documentType === 'change_management_plan') {
    return {
      id: 'change_management_plan_template',
      document_type: 'change_management_plan',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'change_philosophy', title: 'Change Control Philosophy & Escalation Process', type: 'free_text' },
        { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
      ]
    }
  }

  if (documentType === 'project_management_plan') {
    return {
      id: 'project_management_plan_template',
      document_type: 'project_management_plan',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'executive_overview', title: 'Master Project Plan Executive Overview', type: 'free_text' },
        { key: 'sub_plans_aggregator', title: 'Integrated Sub-Plans & References', type: 'data_bound', source: 'master.project_management_plan' }
      ]
    }
  }

  if (documentType === 'product_strategy_document') {
    return {
      id: 'product_strategy_document_template',
      document_type: 'product_strategy_document',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'strategy_vision', title: 'Product Vision Canvas & Core Pillars', type: 'data_bound', source: 'product.strategy_canvas' },
        { key: 'executive_commentary', title: 'Executive Strategy & Strategic Intent', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'market_research_report') {
    return {
      id: 'market_research_report_template',
      document_type: 'market_research_report',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'target_market_segmentation', title: 'Target Market & Customer Segments', type: 'data_bound', source: 'product.target_market' },
        { key: 'customer_personas', title: 'Customer Personas & JTBD Analysis', type: 'data_bound', source: 'product.personas' },
        { key: 'tam_sam_som_analysis', title: 'TAM / SAM / SOM Financial Opportunity', type: 'free_text' },
        { key: 'industry_trends', title: 'Industry Trends & Macro Factors', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'competitive_benchmarking_matrix') {
    return {
      id: 'competitive_benchmarking_matrix_template',
      document_type: 'competitive_benchmarking_matrix',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'defensibility_moats', title: 'Competitive Moat & Defensibility Profile', type: 'data_bound', source: 'product.competitive_moats' },
        { key: 'competitor_feature_comparison', title: 'Competitor Feature & Pricing Matrix', type: 'free_text' },
        { key: 'swot_evaluation', title: 'SWOT Evaluation', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'okr_kpi_performance_report') {
    return {
      id: 'okr_kpi_performance_report_template',
      document_type: 'okr_kpi_performance_report',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'north_star_telemetry', title: 'Executive North Star KPI & Growth Levers', type: 'data_bound', source: 'okrs.north_star_report' },
        { key: 'okr_hierarchy', title: 'Quarterly OKR Objectives & Key Results Hierarchy', type: 'data_bound', source: 'okrs.hierarchy_tree' },
        { key: 'executive_commentary_and_adjustments', title: 'Quarterly Executive Commentary & Pivot Strategy', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'discovery_insights_document') {
    return {
      id: 'discovery_insights_document_template',
      document_type: 'discovery_insights_document',
      is_custom: false,
      created_at: new Date().toISOString(),
      section_definitions: [
        { key: 'discovery_overview', title: 'Customer Discovery & VoC Executive Overview', type: 'free_text' },
        { key: 'voc_evidence_data', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
        { key: 'pain_point_themes', title: 'Customer Pain Points & Needs Analysis', type: 'free_text' },
        { key: 'customer_interview_quotes', title: 'Verbatim Customer Quotes & User Evidence', type: 'free_text' },
        { key: 'product_recommendations', title: 'Strategic Product Recommendations', type: 'free_text' }
      ]
    }
  }

  const selectedVariant = templateId ? PRD_TEMPLATE_VARIANTS[templateId] || null : null
  const defaultSectionDefs: DocumentSectionDef[] = [
    { key: 'prd_objective', title: 'Objective & Business Value', type: 'data_bound', source: 'prd.objective_overview' },
    { key: 'prd_scope_in', title: 'In Scope', type: 'free_text' },
    { key: 'prd_scope_out', title: 'Out of Scope', type: 'free_text' },
    { key: 'prd_acceptance_criteria', title: 'Acceptance Criteria', type: 'free_text' },
    { 
      key: 'prd_telemetry', 
      title: 'Tracking & Metrics', 
      type: 'free_text',
      placeholder: 'Example:\n- Click rate on the "Checkout" button\n- Time spent on the new form (Goal: < 30s)\n- Daily Active Users (DAU) interacting with the feature'
    },
    { key: 'prd_discovery_insights', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
    { key: 'prd_wireframes', title: 'UX Wireframes & Visual Specifications', type: 'free_text' }
  ]

  return {
    id: selectedVariant ? selectedVariant.id : 'product_requirements_document_template',
    document_type: documentType || 'product_requirements_document',
    is_custom: !!selectedVariant,
    created_at: new Date().toISOString(),
    section_definitions: selectedVariant ? selectedVariant.section_definitions : defaultSectionDefs
  }
}
