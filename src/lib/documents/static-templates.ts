export const STATIC_TEMPLATES: Record<string, any> = {
  quality_management_plan: {
    id: 'quality_management_plan_template',
    document_type: 'quality_management_plan',
    is_custom: false,
    section_definitions: [{ key: 'quality_management_data', title: 'Quality Standards', type: 'data_bound' }]
  },
  procurement_plan: {
    id: 'procurement_plan_template',
    document_type: 'procurement_plan',
    is_custom: false,
    section_definitions: [{ key: 'procurement_entries', title: 'Procurement Register', type: 'data_bound' }]
  },
  closure_report: {
    id: 'closure_report_template',
    document_type: 'closure_report',
    is_custom: false,
    section_definitions: [
      { key: 'executive_summary', title: 'Closure Summary & Statement', type: 'free_text' },
      { key: 'evm_summary', title: 'Final Budget & EVM Performance', type: 'data_bound' },
      { key: 'deliverables_status', title: 'WBS Deliverables Status', type: 'data_bound' },
      { key: 'risks_status', title: 'Final Risk Register & Mitigations', type: 'data_bound' }
    ]
  },
  lessons_learned: {
    id: 'lessons_learned_template',
    document_type: 'lessons_learned',
    is_custom: false,
    section_definitions: [
      { key: 'executive_context', title: 'Executive Context & Scope', type: 'free_text' },
      { key: 'what_worked_well', title: 'What Worked Well (Successes)', type: 'free_text' },
      { key: 'what_did_not_work', title: 'What Did Not Work (Challenges)', type: 'free_text' },
      { key: 'recommendations_for_future', title: 'Recommendations for Future Projects', type: 'free_text' }
    ]
  },

  post_implementation_review: {
    id: 'post_implementation_review_template',
    document_type: 'post_implementation_review',
    is_custom: false,
    section_definitions: [
      { key: 'charter_comparison', title: 'Original Charter Objectives vs Actuals', type: 'data_bound' },
      { key: 'outcome_assessment', title: 'Post-Implementation Outcome Assessment', type: 'free_text' },
      { key: 'roi_and_business_impact', title: 'ROI Realization & Business Impact', type: 'free_text' },
      { key: 'recommendations', title: 'Long-term Recommendations', type: 'free_text' }
    ]
  },
  release_notes: {
    id: 'release_notes_template',
    document_type: 'release_notes',
    is_custom: false,
    section_definitions: [
      { key: 'executive_summary', title: 'Summary & Context', type: 'free_text' },
      { key: 'release_scope', title: 'Release Scope (Derived)', type: 'data_bound', source: 'release.scope' },
      { key: 'release_exit_criteria', title: 'Exit Criteria', type: 'data_bound', source: 'release.criteria' }
    ]
  },
  deployment_report: {
    id: 'deployment_report_template',
    document_type: 'deployment_report',
    is_custom: false,
    section_definitions: [
      { key: 'deployment_summary', title: 'Deployment Summary', type: 'free_text' },
      { key: 'deployment_plan', title: 'Deployment Plan & Execution', type: 'data_bound', source: 'release.deployment' }
    ]
  },
  test_summary_report: {
    id: 'test_summary_report_template',
    document_type: 'test_summary_report',
    is_custom: false,
    section_definitions: [
      { key: 'test_summary', title: 'QA Summary & Sign-off', type: 'free_text' },
      { key: 'qa_readiness', title: 'QA Readiness Items', type: 'data_bound', source: 'release.qa' },
      { key: 'linked_defects', title: 'Linked Defects', type: 'data_bound', source: 'release.defects' }
    ]
  },
  business_case: {
    id: 'business_case_template',
    document_type: 'business_case',
    is_custom: false,
    section_definitions: [
      { key: 'problem_statement', title: 'Problem & Opportunity Statement', type: 'data_bound', source: 'initiation.business_case_problem' },
      { key: 'proposed_solution', title: 'Proposed Solution', type: 'data_bound', source: 'initiation.business_case_solution' },
      { key: 'financials', title: 'Financial Estimates & ROI', type: 'data_bound', source: 'initiation.business_case_financials' },
      { key: 'recommendation', title: 'Recommendation', type: 'data_bound', source: 'initiation.business_case_recommendation' }
    ]
  },
  feasibility_study: {
    id: 'feasibility_study_template',
    document_type: 'feasibility_study',
    is_custom: false,
    section_definitions: [
      { key: 'technical', title: 'Technical Assessment', type: 'data_bound', source: 'initiation.feasibility_technical' },
      { key: 'financial', title: 'Financial Assessment', type: 'data_bound', source: 'initiation.feasibility_financial' },
      { key: 'operational', title: 'Operational Assessment', type: 'data_bound', source: 'initiation.feasibility_operational' },
      { key: 'recommendation', title: 'Overall Recommendation', type: 'data_bound', source: 'initiation.feasibility_recommendation' }
    ]
  },
  budget_baseline: {
    id: 'budget_baseline_template',
    document_type: 'budget_baseline',
    is_custom: false,
    section_definitions: [
      { key: 'executive_summary', title: 'Executive Budget Summary', type: 'free_text' },
      { key: 'budget_baseline_table', title: 'Work Package Estimates & S-Curve Baseline', type: 'data_bound', source: 'cost.budget_baseline' }
    ]
  },
  issue_log: {
    id: 'issue_log_template',
    document_type: 'issue_log',
    is_custom: false,
    section_definitions: [
      { key: 'executive_summary', title: 'Issue Management & Governance Summary', type: 'free_text' },
      { key: 'issue_roster', title: 'Active & Resolved Issue Log', type: 'data_bound', source: 'accountability.issue_log' }
    ]
  },
  schedule_document: {
    id: 'schedule_document_template',
    document_type: 'schedule_document',
    is_custom: false,
    section_definitions: [
      { key: 'schedule_assumptions', title: 'Scheduling Assumptions & Constraints', type: 'free_text' },
      { key: 'schedule_narrative', title: 'Baseline Schedule, Milestones & Critical Path Summary', type: 'data_bound', source: 'planning.schedule_document' }
    ]
  },

  project_management_plan: {
    id: 'project_management_plan_template',
    document_type: 'project_management_plan',
    is_custom: false,
    section_definitions: [
      { key: 'executive_overview', title: 'Master Project Plan Executive Overview', type: 'free_text' },
      { key: 'sub_plans_aggregator', title: 'Integrated Sub-Plans & References', type: 'data_bound', source: 'master.project_management_plan' }
    ]
  },
  competitive_benchmarking_matrix: {
    id: 'competitive_benchmarking_matrix_template',
    document_type: 'competitive_benchmarking_matrix',
    is_custom: false,
    section_definitions: [
      { key: 'defensibility_moats', title: 'Competitive Moat & Defensibility Profile', type: 'data_bound', source: 'product.competitive_moats' },
      { key: 'competitor_feature_comparison', title: 'Competitor Feature & Pricing Matrix', type: 'free_text' },
      { key: 'swot_evaluation', title: 'SWOT Evaluation', type: 'free_text' }
    ]
  },
  okr_kpi_performance_report: {
    id: 'okr_kpi_performance_report_template',
    document_type: 'okr_kpi_performance_report',
    is_custom: false,
    section_definitions: [
      { key: 'north_star_telemetry', title: 'Executive North Star KPI & Growth Levers', type: 'data_bound', source: 'okrs.north_star_report' },
      { key: 'okr_hierarchy', title: 'Quarterly OKR Objectives & Key Results Hierarchy', type: 'data_bound', source: 'okrs.hierarchy_tree' },
      { key: 'executive_commentary_and_adjustments', title: 'Quarterly Executive Commentary & Pivot Strategy', type: 'free_text' }
    ]
  },
  discovery_insights_document: {
    id: 'discovery_insights_document_template',
    document_type: 'discovery_insights_document',
    is_custom: false,
    section_definitions: [
      { key: 'discovery_overview', title: 'Customer Discovery & VoC Executive Overview', type: 'free_text' },
      { key: 'voc_evidence_data', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
      { key: 'pain_point_themes', title: 'Customer Pain Points & Needs Analysis', type: 'free_text' },
      { key: 'customer_interview_quotes', title: 'Verbatim Customer Quotes & User Evidence', type: 'free_text' },
      { key: 'product_recommendations', title: 'Strategic Product Recommendations', type: 'free_text' }
    ]
  },
  raci: {
    id: 'raci_matrix_template',
    document_type: 'raci',
    is_custom: false,
    section_definitions: [
      { key: 'raci_matrix', title: 'RACI Matrix', type: 'data_bound', source: 'raci.matrix' }
    ]
  },
  wbs_dictionary: {
    id: 'wbs_dictionary_template',
    document_type: 'wbs_dictionary',
    is_custom: false,
    section_definitions: [
      { key: 'wbs_dictionary', title: 'WBS Dictionary', type: 'data_bound', source: 'wbs.dictionary' }
    ]
  },
  communication_plan: {
    id: 'communication_plan_template',
    document_type: 'communication_plan',
    is_custom: false,
    section_definitions: [
      { key: 'communication_matrix', title: 'Communication Matrix', type: 'free_text', placeholder: 'Target Audience | Key Messages | Channel | Frequency | Owner' },
      { key: 'escalation_path', title: 'Escalation Path', type: 'free_text' }
    ]
  },
  status_report: {
    id: 'status_report_template',
    document_type: 'status_report',
    is_custom: false,
    section_definitions: [
      { key: 'executive_summary', title: 'Executive Summary', type: 'free_text', placeholder: 'Current status, key achievements, and blockers.' },
      { key: 'milestones_status', title: 'Milestones Status', type: 'free_text', placeholder: 'Milestone | Target Date | Actual Date | Status' },
      { key: 'risks_issues', title: 'Risks & Issues Summary', type: 'free_text', placeholder: 'Top risks and active issues needing attention.' }
    ]
  }
}
