export const STATIC_TEMPLATES: Record<string, any> = {
  problem_discovery_workspace: {
    id: 'problem_discovery_template',
    document_type: 'problem_discovery_workspace',
    is_custom: false,
    section_definitions: [
      { key: 'problem_context', title: '1. Problem Context', type: 'free_text' },
      { key: 'target_user', title: '2. Target User / Customer', type: 'free_text' },
      { key: 'user_research', title: '3. User Research', type: 'free_text' },
      { key: 'current_state_journey', title: '4. Current-State Journey', type: 'free_text' },
      { key: 'pain_points', title: '5. Pain Points', type: 'free_text' },
      { key: 'jobs_to_be_done', title: '6. Jobs-to-be-Done (JTBD)', type: 'free_text' },
      { key: 'root_cause_analysis', title: '7. Root Cause Analysis', type: 'free_text' },
      { key: 'problem_evidence', title: '8. Problem Evidence', type: 'free_text' },
      { key: 'frequency_severity', title: '9. Problem Frequency & Severity', type: 'free_text' },
      { key: 'existing_solutions', title: '10. Existing Solutions / Workarounds', type: 'free_text' },
      { key: 'competitive_analysis', title: '11. Competitive / Alternative Analysis', type: 'free_text' },
      { key: 'problem_statement', title: '12. Problem Statement', type: 'free_text' },
      { key: 'hypotheses', title: '13. Opportunity / Problem Hypotheses', type: 'free_text' },
      { key: 'problem_validation', title: '14. Problem Validation', type: 'free_text' },
    ]
  },
  customer_research_strategy: {
    id: 'customer_research_template',
    document_type: 'customer_research_strategy',
    is_custom: false,
    section_definitions: [
      { key: 'research_objectives', title: '1. Research Objectives', type: 'free_text' },
      { key: 'target_customer', title: '2. Target Customer / User', type: 'free_text' },
      { key: 'customer_segmentation', title: '3. Customer Segmentation', type: 'free_text' },
      { key: 'research_questions', title: '4. Research Questions', type: 'free_text' },
      { key: 'research_hypotheses', title: '5. Research Hypotheses', type: 'free_text' },
      { key: 'research_methodology', title: '6. Research Methodology', type: 'free_text' },
      { key: 'participant_recruitment', title: '7. Participant Recruitment', type: 'free_text' },
      { key: 'interview_survey_design', title: '8. Interview / Survey Design', type: 'free_text' },
      { key: 'customer_interviews', title: '9. Customer Interviews', type: 'free_text' },
      { key: 'customer_observation', title: '10. Customer Observation', type: 'free_text' },
      { key: 'survey_research', title: '11. Survey Research', type: 'free_text' },
      { key: 'behavioral_product_data', title: '12. Behavioral / Product Data', type: 'free_text' },
      { key: 'customer_journey', title: '13. Customer Journey', type: 'free_text' },
      { key: 'jobs_to_be_done', title: '14. Jobs-to-be-Done', type: 'free_text' },
      { key: 'pain_points_frustrations', title: '15. Pain Points & Frustrations', type: 'free_text' },
      { key: 'needs_motivations', title: '16. Needs & Motivations', type: 'free_text' },
      { key: 'behaviors_workarounds', title: '17. Behaviors & Workarounds', type: 'free_text' },
      { key: 'customer_quotes_evidence', title: '18. Customer Quotes & Evidence', type: 'free_text' },
      { key: 'insight_synthesis', title: '19. Insight Synthesis', type: 'free_text' },
      { key: 'opportunity_identification', title: '20. Opportunity Identification', type: 'free_text' },
      { key: 'research_findings_recommendations', title: '21. Research Findings & Recommendations', type: 'free_text' },
    ]
  },
  problem_definition_workspace: {
    id: 'problem_definition_template',
    document_type: 'problem_definition_workspace',
    is_custom: false,
    section_definitions: [
      { key: 'problem_summary', title: '1. Problem Summary', type: 'free_text' },
      { key: 'target_user_segment', title: '2. Target User / Segment', type: 'free_text' },
      { key: 'user_need', title: '3. User Need', type: 'free_text' },
      { key: 'problem_statement', title: '4. Problem Statement', type: 'free_text' },
      { key: 'current_state', title: '5. Current State', type: 'free_text' },
      { key: 'desired_state', title: '6. Desired State', type: 'free_text' },
      { key: 'root_cause', title: '7. Root Cause', type: 'free_text' },
      { key: 'problem_scope', title: '8. Problem Scope', type: 'free_text' },
      { key: 'problem_impact', title: '9. Problem Impact', type: 'free_text' },
      { key: 'evidence', title: '10. Evidence', type: 'free_text' },
      { key: 'problem_frequency', title: '11. Problem Frequency', type: 'free_text' },
      { key: 'problem_severity', title: '12. Problem Severity', type: 'free_text' },
      { key: 'problem_reach', title: '13. Problem Reach', type: 'free_text' },
      { key: 'constraints_assumptions', title: '14. Constraints & Assumptions', type: 'free_text' },
      { key: 'problem_hypothesis', title: '15. Problem Hypothesis', type: 'free_text' },
      { key: 'success_criteria', title: '16. Success Criteria', type: 'free_text' },
      { key: 'problem_validation_signoff', title: '17. Problem Validation / Sign-off', type: 'free_text' },
    ]
  },
  opportunity_assessment_workspace: {
    id: 'opportunity_assessment_template',
    document_type: 'opportunity_assessment_workspace',
    is_custom: false,
    section_definitions: [
      { key: 'opportunity_definition', title: '1. Opportunity Definition', type: 'free_text' },
      { key: 'problem_evidence', title: '2. Problem Evidence', type: 'free_text' },
      { key: 'customer_impact', title: '3. Customer Impact', type: 'free_text' },
      { key: 'business_impact', title: '4. Business Impact', type: 'free_text' },
      { key: 'market_opportunity', title: '5. Market Opportunity', type: 'free_text' },
      { key: 'customer_demand', title: '6. Customer Demand', type: 'free_text' },
      { key: 'opportunity_sizing', title: '7. Opportunity Sizing', type: 'free_text' },
      { key: 'frequency_severity', title: '8. Frequency & Severity', type: 'free_text' },
      { key: 'strategic_alignment', title: '9. Strategic Alignment', type: 'free_text' },
      { key: 'competitive_landscape', title: '10. Competitive Landscape', type: 'free_text' },
      { key: 'existing_alternatives', title: '11. Existing Alternatives', type: 'free_text' },
      { key: 'unmet_needs', title: '12. Unmet Needs', type: 'free_text' },
      { key: 'value_potential', title: '13. Value Potential', type: 'free_text' },
      { key: 'feasibility_assessment', title: '14. Feasibility Assessment', type: 'free_text' },
      { key: 'viability_assessment', title: '15. Viability Assessment', type: 'free_text' },
      { key: 'desirability_assessment', title: '16. Desirability Assessment', type: 'free_text' },
      { key: 'risk_assessment', title: '17. Risk Assessment', type: 'free_text' },
      { key: 'dependencies_constraints', title: '18. Dependencies & Constraints', type: 'free_text' },
      { key: 'opportunity_prioritization', title: '19. Opportunity Prioritization', type: 'free_text' },
      { key: 'opportunity_score', title: '20. Opportunity Score', type: 'free_text' },
      { key: 'opportunity_portfolio', title: '21. Opportunity Portfolio', type: 'free_text' },
      { key: 'recommended_opportunities', title: '22. Recommended Opportunities', type: 'free_text' },
      { key: 'assessment_decision', title: '23. Assessment Decision', type: 'free_text' },
    ]
  },
  solution_design_workspace: {
    id: 'solution_design_template',
    document_type: 'solution_design_workspace',
    is_custom: false,
    section_definitions: [
      { key: 'opportunity_context', title: '1. Opportunity Context', type: 'free_text' },
      { key: 'problem_reframing', title: '2. Problem Reframing', type: 'free_text' },
      { key: 'desired_outcomes', title: '3. Desired Outcomes', type: 'free_text' },
      { key: 'solution_principles', title: '4. Solution Principles', type: 'free_text' },
      { key: 'solution_hypotheses', title: '5. Solution Hypotheses', type: 'free_text' },
      { key: 'solution_exploration', title: '6. Solution Exploration', type: 'free_text' },
      { key: 'ideation', title: '7. Ideation', type: 'free_text' },
      { key: 'solution_alternatives', title: '8. Solution Alternatives', type: 'free_text' },
      { key: 'concept_development', title: '9. Concept Development', type: 'free_text' },
      { key: 'user_flow', title: '10. User Flow', type: 'free_text' },
      { key: 'experience_design', title: '11. Experience Design', type: 'free_text' },
      { key: 'information_architecture', title: '12. Information Architecture', type: 'free_text' },
      { key: 'wireframes_prototypes', title: '13. Wireframes / Prototypes', type: 'free_text' },
      { key: 'technical_exploration', title: '14. Technical Exploration', type: 'free_text' },
      { key: 'feasibility_assessment', title: '15. Feasibility Assessment', type: 'free_text' },
      { key: 'business_model_viability', title: '16. Business Model / Viability', type: 'free_text' },
      { key: 'value_proposition', title: '17. Value Proposition', type: 'free_text' },
      { key: 'experiment_design', title: '18. Experiment Design', type: 'free_text' },
      { key: 'prototype_testing', title: '19. Prototype Testing', type: 'free_text' },
      { key: 'usability_testing', title: '20. Usability Testing', type: 'free_text' },
      { key: 'solution_validation', title: '21. Solution Validation', type: 'free_text' },
      { key: 'risks_assumptions', title: '22. Risks & Assumptions', type: 'free_text' },
      { key: 'trade_offs', title: '23. Trade-offs', type: 'free_text' },
      { key: 'mvp_definition', title: '24. MVP Definition', type: 'free_text' },
      { key: 'success_metrics', title: '25. Success Metrics', type: 'free_text' },
      { key: 'final_solution_concept', title: '26. Final Solution Concept', type: 'free_text' },
      { key: 'discovery_decision', title: '27. Discovery Decision', type: 'free_text' },
    ]
  },
  solution_validation_workspace: {
    id: 'solution_validation_template',
    document_type: 'solution_validation_workspace',
    is_custom: false,
    section_definitions: [
      { key: 'validation_objectives', title: '1. Validation Objectives', type: 'free_text' },
      { key: 'assumptions', title: '2. Assumptions', type: 'free_text' },
      { key: 'riskiest_assumptions', title: '3. Riskiest Assumptions', type: 'free_text' },
      { key: 'validation_hypotheses', title: '4. Validation Hypotheses', type: 'free_text' },
      { key: 'success_criteria', title: '5. Success Criteria', type: 'free_text' },
      { key: 'experiment_design', title: '6. Experiment Design', type: 'free_text' },
      { key: 'experiment_type', title: '7. Experiment Type', type: 'free_text' },
      { key: 'experiment_setup', title: '8. Experiment Setup', type: 'free_text' },
      { key: 'prototype_testing', title: '9. Prototype Testing', type: 'free_text' },
      { key: 'usability_testing', title: '10. Usability Testing', type: 'free_text' },
      { key: 'customer_validation', title: '11. Customer Validation', type: 'free_text' },
      { key: 'demand_validation', title: '12. Demand Validation', type: 'free_text' },
      { key: 'value_validation', title: '13. Value Validation', type: 'free_text' },
      { key: 'willingness_to_pay_validation', title: '14. Willingness-to-Pay Validation', type: 'free_text' },
      { key: 'technical_validation', title: '15. Technical Validation', type: 'free_text' },
      { key: 'business_validation', title: '16. Business Validation', type: 'free_text' },
      { key: 'ab_testing', title: '17. A/B Testing', type: 'free_text' },
      { key: 'experiment_execution', title: '18. Experiment Execution', type: 'free_text' },
      { key: 'data_collection', title: '19. Data Collection', type: 'free_text' },
      { key: 'results_analysis', title: '20. Results Analysis', type: 'free_text' },
      { key: 'qualitative_evidence', title: '21. Qualitative Evidence', type: 'free_text' },
      { key: 'quantitative_evidence', title: '22. Quantitative Evidence', type: 'free_text' },
      { key: 'hypothesis_evaluation', title: '23. Hypothesis Evaluation', type: 'free_text' },
      { key: 'learnings_insights', title: '24. Learnings & Insights', type: 'free_text' },
      { key: 'decision', title: '25. Decision', type: 'free_text' },
      { key: 'iteration', title: '26. Iteration', type: 'free_text' },
      { key: 'experiment_log', title: '27. Experiment Log', type: 'free_text' },
      { key: 'validation_report', title: '28. Validation Report', type: 'free_text' }
    ]
  },
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
