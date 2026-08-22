import type { DocumentSectionDef } from './types'

export interface CharterTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'software' | 'enterprise' | 'construction' | 'operations' | 'marketing' | 'transformation'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const CHARTER_TEMPLATE_VARIANTS: Record<string, CharterTemplateVariant> = {
  agile_software_charter: {
    id: 'agile_software_charter',
    name: 'Agile & Software Development Charter',
    subtitle: 'Product vision, epic-level scope, technical constraints, and definition of done.',
    category: 'software',
    bestFor: 'Aligns the development team on product direction, architecture, and sprint cadence.',
    iconName: 'Code',
    section_definitions: [
      { key: 'product_vision', title: 'Product Vision & Problem Statement', type: 'free_text', placeholder: 'Core user problem and overarching product direction.' },
      { key: 'target_audience', title: 'Target Audience & Key User Personas', type: 'free_text', placeholder: 'End-users who benefit from the product.' },
      { key: 'epic_scope', title: 'Epic-Level Scope & Release Goals', type: 'free_text', placeholder: 'High-level features targeted for initial releases.' },
      { key: 'technical_architecture', title: 'Architecture & Technical Stack Constraints', type: 'free_text', placeholder: 'Approved frameworks, languages, APIs, and infrastructure boundaries.' },
      { key: 'sprint_cadence', title: 'Sprint Cadence & Team Velocity Expectations', type: 'free_text', placeholder: 'Iteration length, estimation methods, and delivery pacing.' },
      { key: 'definition_of_done', title: 'Definition of Done (DoD) Criteria', type: 'free_text', placeholder: 'Non-negotiable quality standards required for release.' }
    ]
  },
  process_automation_charter: {
    id: 'process_automation_charter',
    name: 'Process Automation & Operations Charter',
    subtitle: 'As-is bottlenecks, automation scope, target systems, and ROI metrics.',
    category: 'operations',
    bestFor: 'Defines target future state workflows, system integrations, and performance metrics for automation.',
    iconName: 'Cpu',
    section_definitions: [
      { key: 'current_state', title: 'Current State Bottlenecks & As-Is Workflow', type: 'free_text', placeholder: 'Existing pain points, manual touchpoints, and error rates.' },
      { key: 'target_state', title: 'Target Future State & Automation Scope', type: 'free_text', placeholder: 'Workflows, systems, and manual tasks targeted for conversion.' },
      { key: 'target_systems', title: 'Target Systems & Integrations', type: 'free_text', placeholder: 'Key platforms (e.g., ERPs, CRMs, webhooks) involved in the build.' },
      { key: 'performance_roi', title: 'Process Performance Metrics & ROI', type: 'free_text', placeholder: 'Expected time savings, throughput gains, and labor cost reductions.' },
      { key: 'exception_handling', title: 'Exception Handling & Fallback Protocols', type: 'free_text', placeholder: 'Procedures when an automated run fails or data is malformed.' },
      { key: 'change_management', title: 'Change Management & Adoption Strategy', type: 'free_text', placeholder: 'Plans for training impacted staff and driving internal adoption.' }
    ]
  },
  business_transformation_charter: {
    id: 'business_transformation_charter',
    name: 'Business Transformation & Change Management Charter',
    subtitle: 'Strategic rationale, impacted stakeholders, readiness plan, and resistance mitigation.',
    category: 'transformation',
    bestFor: 'Guides organizational change by outlining communication plans and success factors.',
    iconName: 'RefreshCw',
    section_definitions: [
      { key: 'strategic_rationale', title: 'Strategic Rationale & Drivers', type: 'free_text', placeholder: 'Market shifts or internal catalysts driving the organizational change.' },
      { key: 'impacted_stakeholders', title: 'Impacted Stakeholder Groups & Departments', type: 'free_text', placeholder: 'Operations, sales, support, or leadership teams affected.' },
      { key: 'communication_plan', title: 'Communication & Readiness Plan', type: 'free_text', placeholder: 'Key messaging channels, feedback loops, and training schedules.' },
      { key: 'success_factors', title: 'Cultural & Behavioral Success Factors', type: 'free_text', placeholder: 'Intangible shift indicators like team alignment or tool adoption rates.' },
      { key: 'resistance_mitigation', title: 'Resistance Mitigation Strategy', type: 'free_text', placeholder: 'Identified friction points and plans to address team pushback.' }
    ]
  },
  marketing_campaign_charter: {
    id: 'marketing_campaign_charter',
    name: 'Marketing & Campaign Charter',
    subtitle: 'Campaign objectives, target channels, conversion metrics, and creative assets.',
    category: 'marketing',
    bestFor: 'Aligns marketing efforts around core messages, distribution plans, and CAC targets.',
    iconName: 'Megaphone',
    section_definitions: [
      { key: 'campaign_objective', title: 'Campaign Objective & Core Message', type: 'free_text', placeholder: 'Primary value proposition and call to action.' },
      { key: 'target_channels', title: 'Target Channels & Distribution Plan', type: 'free_text', placeholder: 'Platforms utilized (email, social, events, content marketing).' },
      { key: 'conversion_metrics', title: 'Conversion Metrics & CAC Targets', type: 'free_text', placeholder: 'Expected leads, customer acquisition cost, and revenue attribution.' },
      { key: 'creative_assets', title: 'Creative Asset Requirements', type: 'free_text', placeholder: 'Deliverable list (copy, design, video, landing pages).' },
      { key: 'agency_vendor', title: 'Agency & Vendor Involvement', type: 'free_text', placeholder: 'Third-party partners, contractors, and asset owners.' }
    ]
  },
  enterprise_project_charter: {
    id: 'enterprise_project_charter',
    name: 'Enterprise Project Charter',
    subtitle: 'Governance, financial modeling, enterprise scope, and risk management.',
    category: 'enterprise',
    bestFor: 'Strict governance and cross-functional accountability for large budgets.',
    iconName: 'Building2',
    section_definitions: [
      { key: 'project_governance', title: '1. Project Identification & Governance', type: 'free_text', placeholder: 'Project info, Executive Sponsor, Project Director, Steering Committee, and Cross-Functional Stakeholders.' },
      { key: 'strategic_alignment', title: '2. Strategic Alignment & Business Case', type: 'free_text', placeholder: 'Executive Summary, Strategic Fit, Problem Statement, Financial Business Case & ROI.' },
      { key: 'enterprise_scope', title: '3. Enterprise Scope Baseline', type: 'free_text', placeholder: 'In-Scope Boundaries, Out-of-Scope Exclusions, Key Enterprise Deliverables, and Acceptance Criteria.' },
      { key: 'milestones_budget', title: '4. Milestones, Budget & Resource Allocation', type: 'free_text', placeholder: 'Phase-Gate Milestones, CapEx/OpEx, and Resourcing Matrix.' },
      { key: 'technical_architecture', title: '5. Technical Architecture & Security Governance', type: 'free_text', placeholder: 'System Architecture Blueprint, Data Governance, Security & Business Continuity.' },
      { key: 'risk_dependencies', title: '6. Risk Management, Dependencies & Change Control', type: 'free_text', placeholder: 'Enterprise Risk Register, Critical External Dependencies, Scope Change Protocol, Communication Path.' }
    ]
  },
  construction_project_charter: {
    id: 'construction_project_charter',
    name: 'Construction & Engineering Project Charter',
    subtitle: 'Site conditions, regulatory compliance, safety protocols, and contractor management.',
    category: 'construction',
    bestFor: 'Establishes scope, structural design specs, and safety controls for physical builds.',
    iconName: 'HardHat',
    section_definitions: [
      { key: 'site_information', title: '1. Project Identification & Site Information', type: 'free_text', placeholder: 'Project Name, Location, Client, GC, Lead Architect, Project Manager, Superintendent.' },
      { key: 'scope_design', title: '2. Scope of Work & Design Specifications', type: 'free_text', placeholder: 'Project Description, Civil & Structural Scope, Exclusions, Permit & Regulatory Scope.' },
      { key: 'budget_financial', title: '3. Budget, Contract & Financial Baseline', type: 'free_text', placeholder: 'GMP / Total Cost, Cost Code Distribution, Contract Type, Owner Contingency Reserve.' },
      { key: 'master_schedule', title: '4. Master Schedule & Milestone Gates', type: 'free_text', placeholder: 'Pre-Construction, Substructure, Building Enclosure, Fit-Out, Substantial Completion & Handover.' },
      { key: 'logistics_safety', title: '5. Site Logistics, Safety & Risk Controls', type: 'free_text', placeholder: 'Site Logistics Plan, HSE Protocols, Environmental Risks, QA/QA & Inspection.' }
    ]
  },
  standard_it_project_charter: {
    id: 'standard_it_project_charter',
    name: 'Standard IT Project Charter',
    subtitle: 'Comprehensive 12-point IT charter covering business case, milestones, and organization.',
    category: 'software',
    bestFor: 'Formal IT projects requiring structured PMBOK-aligned governance and clear success criteria.',
    iconName: 'Code',
    section_definitions: [
      { key: 'executive_summary', title: '1. Executive Summary', type: 'free_text', placeholder: 'High-level project overview and goals.' },
      { key: 'business_case', title: '2. Business Case', type: 'free_text', placeholder: 'Problem statement and business justification.' },
      { key: 'project_objectives', title: '3. Project Objectives', type: 'free_text', placeholder: 'Specific, measurable goals of the project.' },
      { key: 'scope', title: '4. Scope', type: 'free_text', placeholder: 'In-scope and out-of-scope boundaries.' },
      { key: 'deliverables', title: '5. Deliverables', type: 'free_text', placeholder: 'Tangible outcomes to be produced.' },
      { key: 'success_criteria', title: '6. Success Criteria', type: 'free_text', placeholder: 'Metrics or conditions for project success.' },
      { key: 'assumptions', title: '7. Assumptions', type: 'free_text', placeholder: 'Factors considered true without proof.' },
      { key: 'constraints', title: '8. Constraints', type: 'free_text', placeholder: 'Limitations on project execution.' },
      { key: 'risks', title: '9. Risks', type: 'free_text', placeholder: 'High-level risks and uncertainties.' },
      { key: 'milestones', title: '10. Milestones', type: 'free_text', placeholder: 'Key target dates and outcomes.' },
      { key: 'project_organization', title: '11. Project Organization', type: 'free_text', placeholder: 'Roles, responsibilities, and team structure.' },
      { key: 'approval', title: '12. Approval', type: 'free_text', placeholder: 'Stakeholder sign-off and authorization.' }
    ]
  }
}
