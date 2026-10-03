import type { DocumentSectionDef } from './types'

export interface ScopeStatementTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'standard' | 'enterprise' | 'agile'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const SCOPE_STATEMENT_TEMPLATE_VARIANTS: Record<string, ScopeStatementTemplateVariant> = {
  // ─── ENTERPRISE / WATERFALL ─────────────────────────────────
  standard_scope_statement: {
    id: 'standard_scope_statement',
    name: 'Standard Scope Statement',
    subtitle: 'Comprehensive 10-point scope definition following PMBOK best practices.',
    category: 'enterprise',
    bestFor: 'Formal waterfall projects requiring strict scope boundaries, acceptance criteria, and sign-off.',
    iconName: 'FileText',
    section_definitions: [
      { key: 'executive_summary', title: '1. Executive Summary', type: 'free_text', placeholder: 'High-level summary of the project scope...' },
      { key: 'project_objectives', title: '2. Project Objectives', type: 'free_text', placeholder: 'Specific, measurable, achievable, relevant, and time-bound (SMART) objectives...' },
      { key: 'project_scope_description', title: '3. Project Scope Description', type: 'free_text', placeholder: 'Detailed description of the project boundaries and what it will accomplish...' },
      { key: 'project_deliverables', title: '4. Project Deliverables', type: 'free_text', placeholder: 'List of specific outputs, products, or results to be produced...' },
      { key: 'product_acceptance_criteria', title: '5. Product Acceptance Criteria', type: 'free_text', placeholder: 'Conditions that must be met before deliverables are accepted...' },
      { key: 'project_exclusions', title: '6. Project Exclusions (Out of Scope)', type: 'free_text', placeholder: 'Explicit statements about what is NOT included in the project...' },
      { key: 'project_constraints', title: '7. Project Constraints', type: 'free_text', placeholder: 'Limitations on the project (e.g., budget, timeline, resources)...' },
      { key: 'project_assumptions', title: '8. Project Assumptions', type: 'free_text', placeholder: 'Factors considered to be true, real, or certain without proof...' },
      { key: 'milestone_schedule', title: '9. Milestone Schedule', type: 'free_text', placeholder: 'High-level schedule of key milestones...' },
      { key: 'approval', title: '10. Approval & Sign-off', type: 'free_text', placeholder: 'Role | Responsibility | Sign-off' }
    ]
  },

  waterfall_scope_statement: {
    id: 'waterfall_scope_statement',
    name: 'Waterfall Scope Statement',
    subtitle: 'Phase-gated scope definition with WBS linkage and formal change control.',
    category: 'enterprise',
    bestFor: 'Sequential, phase-gated projects in construction, engineering, or regulated industries.',
    iconName: 'Milestone',
    section_definitions: [
      { key: 'project_purpose', title: '1. Project Purpose & Justification', type: 'free_text', placeholder: 'Business need, problem statement, and strategic alignment...' },
      { key: 'scope_description', title: '2. Scope Description', type: 'free_text', placeholder: 'Detailed narrative of the project scope boundaries...' },
      { key: 'major_deliverables', title: '3. Major Deliverables by Phase', type: 'free_text', placeholder: 'Phase | Deliverable | Description | Acceptance Criteria\n\nInitiation | Project Charter | ...\nPlanning | WBS, Schedule | ...\nExecution | Developed Solution | ...\nClosure | Final Report | ...' },
      { key: 'wbs_reference', title: '4. Work Breakdown Structure (WBS) Reference', type: 'free_text', placeholder: 'WBS ID | Work Package | Description | Owner\n\n1.0 | Project Management | ... | PM\n2.0 | Requirements | ... | BA\n3.0 | Design | ... | Architect' },
      { key: 'in_scope', title: '5. In Scope', type: 'free_text', placeholder: 'Explicitly included work, features, and capabilities...' },
      { key: 'out_of_scope', title: '6. Out of Scope', type: 'free_text', placeholder: 'Explicitly excluded work and future phase items...' },
      { key: 'constraints', title: '7. Constraints', type: 'free_text', placeholder: 'Budget, timeline, resource, regulatory, and technology constraints...' },
      { key: 'assumptions', title: '8. Assumptions', type: 'free_text', placeholder: 'Environmental and organizational assumptions...' },
      { key: 'dependencies', title: '9. External Dependencies', type: 'free_text', placeholder: 'Dependency | Source | Impact if Delayed | Mitigation' },
      { key: 'change_control', title: '10. Scope Change Control Process', type: 'free_text', placeholder: 'Process for raising, evaluating, approving, and implementing scope changes...' },
      { key: 'milestone_schedule', title: '11. Key Milestones & Phase Gates', type: 'free_text', placeholder: 'Phase Gate | Milestone | Target Date | Approval Authority' },
      { key: 'approval', title: '12. Approval & Sign-off', type: 'free_text', placeholder: 'Name | Role | Signature | Date' }
    ]
  },

  // ─── AGILE ──────────────────────────────────────────────────
  agile_scope_statement: {
    id: 'agile_scope_statement',
    name: 'Agile Scope Statement',
    subtitle: 'Lightweight, vision-driven scope definition for iterative delivery.',
    category: 'agile',
    bestFor: 'Scrum/Kanban projects focusing on product vision and release goals rather than rigid boundaries.',
    iconName: 'Zap',
    section_definitions: [
      { key: 'product_vision', title: '1. Product Vision', type: 'free_text', placeholder: 'The overarching vision and goal for the product...' },
      { key: 'target_audience', title: '2. Target Audience & Personas', type: 'free_text', placeholder: 'Who this product is for, their jobs-to-be-done, and main pain points...' },
      { key: 'in_scope', title: '3. In Scope (Release Goals)', type: 'free_text', placeholder: 'High-level capabilities and epics targeted for the upcoming releases...' },
      { key: 'out_of_scope', title: '4. Explicitly Out of Scope', type: 'free_text', placeholder: 'Features or epics that are deferred or excluded from this release...' },
      { key: 'success_metrics', title: '5. Success Metrics (KPIs)', type: 'free_text', placeholder: 'How we will measure success (e.g., adoption rate, NPS, velocity)...' }
    ]
  },

  safe_scope_statement: {
    id: 'safe_scope_statement',
    name: 'SAFe / Scaled Agile Scope',
    subtitle: 'PI-level scope definition for large-scale agile programs.',
    category: 'agile',
    bestFor: 'SAFe Agile Release Trains (ARTs), PI Planning, and multi-team agile programs.',
    iconName: 'Network',
    section_definitions: [
      { key: 'solution_vision', title: '1. Solution Vision & Strategic Themes', type: 'free_text', placeholder: 'Overarching solution vision aligned to portfolio strategic themes...' },
      { key: 'pi_objectives', title: '2. PI Objectives', type: 'free_text', placeholder: 'Team | PI Objective | Business Value (1-10) | Committed/Uncommitted\n\nTeam Alpha | Implement payment gateway | 8 | Committed\nTeam Beta | Migrate legacy data | 6 | Uncommitted' },
      { key: 'features_in_scope', title: '3. Features In Scope (this PI)', type: 'free_text', placeholder: 'Feature ID | Feature Name | Team | Description | Acceptance Criteria' },
      { key: 'features_out_of_scope', title: '4. Features Out of Scope (Backlog)', type: 'free_text', placeholder: 'Deferred features and their tentative PI assignment...' },
      { key: 'dependencies_risks', title: '5. Cross-Team Dependencies & Risks', type: 'free_text', placeholder: 'Dependency | Provider Team | Consumer Team | Needed By | Risk Level' },
      { key: 'program_milestones', title: '6. Program Milestones', type: 'free_text', placeholder: 'Milestone | Date | Type (Learning, PI, Fixed Date)' },
      { key: 'confidence_vote', title: '7. Confidence Vote & Roam', type: 'free_text', placeholder: 'Team confidence votes and ROAM analysis (Resolved, Owned, Accepted, Mitigated)...' }
    ]
  },

  // ─── STANDARD (HYBRID / METHODOLOGY-AGNOSTIC) ──────────────
  hybrid_scope_statement: {
    id: 'hybrid_scope_statement',
    name: 'Hybrid Scope Statement',
    subtitle: 'Blended scope definition combining waterfall governance with agile delivery.',
    category: 'standard',
    bestFor: 'Projects using a hybrid approach — waterfall for planning/governance, agile for execution.',
    iconName: 'Blend',
    section_definitions: [
      { key: 'project_overview', title: '1. Project Overview & Business Case', type: 'free_text', placeholder: 'Brief business justification, problem statement, and expected benefits...' },
      { key: 'objectives', title: '2. Project Objectives (SMART)', type: 'free_text', placeholder: 'Measurable objectives aligned to business goals...' },
      { key: 'scope_description', title: '3. Scope Description', type: 'free_text', placeholder: 'High-level description of the overall scope and boundaries...' },
      { key: 'fixed_deliverables', title: '4. Fixed Deliverables (Plan-Driven)', type: 'free_text', placeholder: 'Deliverables defined upfront with fixed requirements (e.g., infrastructure, compliance docs)...' },
      { key: 'iterative_deliverables', title: '5. Iterative Deliverables (Agile)', type: 'free_text', placeholder: 'Deliverables developed iteratively through sprints (e.g., software features, UX)...' },
      { key: 'in_scope', title: '6. In Scope', type: 'free_text', placeholder: 'Work explicitly included across both plan-driven and agile streams...' },
      { key: 'out_of_scope', title: '7. Out of Scope', type: 'free_text', placeholder: 'Work explicitly excluded...' },
      { key: 'constraints_assumptions', title: '8. Constraints & Assumptions', type: 'free_text', placeholder: 'Constraints:\n- Budget: ...\n- Timeline: ...\n\nAssumptions:\n- Stakeholder availability: ...\n- Technology stack: ...' },
      { key: 'acceptance_criteria', title: '9. Acceptance Criteria', type: 'free_text', placeholder: 'Definition of Done for fixed deliverables and sprint-level acceptance criteria...' },
      { key: 'governance_model', title: '10. Governance & Decision-Making', type: 'free_text', placeholder: 'Phase gate reviews for waterfall items, sprint reviews for agile items, escalation paths...' },
      { key: 'milestone_schedule', title: '11. Key Milestones', type: 'free_text', placeholder: 'Milestone | Target Date | Type (Phase Gate / Sprint Review / Release)' },
      { key: 'approval', title: '12. Approval & Sign-off', type: 'free_text', placeholder: 'Name | Role | Signature | Date' }
    ]
  },

  minimal_scope_statement: {
    id: 'minimal_scope_statement',
    name: 'Minimal Scope Statement',
    subtitle: 'Quick, no-frills scope definition for small or internal projects.',
    category: 'standard',
    bestFor: 'Small, low-risk projects, internal initiatives, or proof-of-concept work.',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'purpose', title: '1. Purpose', type: 'free_text', placeholder: 'Why are we doing this project? What problem does it solve?' },
      { key: 'in_scope', title: '2. In Scope', type: 'free_text', placeholder: 'What work is included...' },
      { key: 'out_of_scope', title: '3. Out of Scope', type: 'free_text', placeholder: 'What is explicitly excluded...' },
      { key: 'deliverables', title: '4. Deliverables', type: 'free_text', placeholder: 'What will be produced...' },
      { key: 'timeline', title: '5. Timeline & Key Dates', type: 'free_text', placeholder: 'Start date, end date, and any key milestones...' },
      { key: 'done_criteria', title: '6. Definition of Done', type: 'free_text', placeholder: 'How do we know the project is complete?' }
    ]
  }
}
