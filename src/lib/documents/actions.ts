'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/actions'

export type DocumentSectionDef = {
  key: string
  title: string
  type: 'data_bound' | 'free_text'
  source?: string
  placeholder?: string
}

export type DocumentTemplate = {
  id: string
  document_type: string
  section_definitions: DocumentSectionDef[]
  created_at: string
  is_custom?: boolean
}

export type GeneratedDocument = {
  id: string
  project_id: string
  document_type: string
  custom_template_id?: string
  free_text_content: Record<string, string>
  is_snapshot: boolean
  frozen_data?: any
  period_end?: string
  generated_at: string
  created_at: string
  updated_at: string
}

export async function getDocumentTemplate(documentType: string, templateId?: string): Promise<DocumentTemplate | null> {
  const supabase = await createClient()

  if (templateId) {
    const { data: customTemplate, error: customError } = await supabase
      .from('custom_document_templates')
      .select('id, document_type, section_definitions, created_at')
      .eq('id', templateId)
      .single()

    if (!customError && customTemplate) {
      return { ...customTemplate, is_custom: true } as DocumentTemplate
    }
  }

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('document_type', documentType)
    .single()

  if (documentType === 'charter') {
    return {
      id: data?.id || 'charter-template',
      document_type: 'charter',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'quality_management_plan_template',
      document_type: 'quality_management_plan',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'quality_management_data', title: 'Quality Standards', type: 'data_bound' }
      ]
    }
  }

  if (documentType === 'procurement_plan') {
    return {
      id: data?.id || 'procurement_plan_template',
      document_type: 'procurement_plan',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'procurement_entries', title: 'Procurement Register', type: 'data_bound' }
      ]
    }
  }

  if (documentType === 'closure_report') {
    return {
      id: data?.id || 'closure_report_template',
      document_type: 'closure_report',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'lessons_learned_template',
      document_type: 'lessons_learned',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'handover_document_template',
      document_type: 'handover_document',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'post_implementation_review_template',
      document_type: 'post_implementation_review',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'stakeholder_register_template',
      document_type: 'stakeholder_register',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Stakeholder Summary', type: 'free_text' },
        { key: 'stakeholder_roster', title: 'Stakeholder Roster & Analysis', type: 'data_bound', source: 'register.stakeholders' }
      ]
    }
  }

  if (documentType === 'risk_register') {
    return {
      id: data?.id || 'risk_register_template',
      document_type: 'risk_register',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Risk Summary & Profile', type: 'free_text' },
        { key: 'risk_log', title: 'Detailed Risk & Mitigation Log', type: 'data_bound', source: 'register.risks' }
      ]
    }
  }

  if (documentType === 'release_notes') {
    return {
      id: data?.id || 'release_notes_template',
      document_type: 'release_notes',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Summary & Context', type: 'free_text' },
        { key: 'release_scope', title: 'Release Scope (Derived)', type: 'data_bound', source: 'release.scope' },
        { key: 'release_exit_criteria', title: 'Exit Criteria', type: 'data_bound', source: 'release.criteria' }
      ]
    }
  }

  if (documentType === 'deployment_report') {
    return {
      id: data?.id || 'deployment_report_template',
      document_type: 'deployment_report',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'deployment_summary', title: 'Deployment Summary', type: 'free_text' },
        { key: 'deployment_plan', title: 'Deployment Plan & Execution', type: 'data_bound', source: 'release.deployment' }
      ]
    }
  }

  if (documentType === 'test_summary_report') {
    return {
      id: data?.id || 'test_summary_report_template',
      document_type: 'test_summary_report',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'test_summary', title: 'QA Summary & Sign-off', type: 'free_text' },
        { key: 'qa_readiness', title: 'QA Readiness Items', type: 'data_bound', source: 'release.qa' },
        { key: 'linked_defects', title: 'Linked Defects', type: 'data_bound', source: 'release.defects' }
      ]
    }
  }

  if (documentType === 'business_case') {
    return {
      id: data?.id || 'business_case_template',
      document_type: 'business_case',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'feasibility_study_template',
      document_type: 'feasibility_study',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'budget_baseline_template',
      document_type: 'budget_baseline',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Executive Budget Summary', type: 'free_text' },
        { key: 'budget_baseline_table', title: 'Work Package Estimates & S-Curve Baseline', type: 'data_bound', source: 'cost.budget_baseline' }
      ]
    }
  }

  if (documentType === 'issue_log') {
    return {
      id: data?.id || 'issue_log_template',
      document_type: 'issue_log',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Issue Management & Governance Summary', type: 'free_text' },
        { key: 'issue_roster', title: 'Active & Resolved Issue Log', type: 'data_bound', source: 'accountability.issue_log' }
      ]
    }
  }

  if (documentType === 'schedule_document') {
    return {
      id: data?.id || 'schedule_document_template',
      document_type: 'schedule_document',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'schedule_assumptions', title: 'Scheduling Assumptions & Constraints', type: 'free_text' },
        { key: 'schedule_narrative', title: 'Baseline Schedule, Milestones & Critical Path Summary', type: 'data_bound', source: 'planning.schedule_document' }
      ]
    }
  }

  if (documentType === 'change_management_plan') {
    return {
      id: data?.id || 'change_management_plan_template',
      document_type: 'change_management_plan',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'change_philosophy', title: 'Change Control Philosophy & Escalation Process', type: 'free_text' },
        { key: 'approval_workflows', title: 'Configured Approval Workflows & Thresholds', type: 'data_bound', source: 'governance.change_management_plan' }
      ]
    }
  }

  if (documentType === 'project_management_plan') {
    return {
      id: data?.id || 'project_management_plan_template',
      document_type: 'project_management_plan',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_overview', title: 'Master Project Plan Executive Overview', type: 'free_text' },
        { key: 'sub_plans_aggregator', title: 'Integrated Sub-Plans & References', type: 'data_bound', source: 'master.project_management_plan' }
      ]
    }
  }

  if (documentType === 'product_strategy_document') {
    return {
      id: data?.id || 'product_strategy_document_template',
      document_type: 'product_strategy_document',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'strategy_vision', title: 'Product Vision Canvas & Core Pillars', type: 'data_bound', source: 'product.strategy_canvas' },
        { key: 'executive_commentary', title: 'Executive Strategy & Strategic Intent', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'market_research_report') {
    return {
      id: data?.id || 'market_research_report_template',
      document_type: 'market_research_report',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      id: data?.id || 'competitive_benchmarking_matrix_template',
      document_type: 'competitive_benchmarking_matrix',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'defensibility_moats', title: 'Competitive Moat & Defensibility Profile', type: 'data_bound', source: 'product.competitive_moats' },
        { key: 'competitor_feature_comparison', title: 'Competitor Feature & Pricing Matrix', type: 'free_text' },
        { key: 'swot_evaluation', title: 'SWOT Evaluation', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'okr_kpi_performance_report') {
    return {
      id: data?.id || 'okr_kpi_performance_report_template',
      document_type: 'okr_kpi_performance_report',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'north_star_telemetry', title: 'Executive North Star KPI & Growth Levers', type: 'data_bound', source: 'okrs.north_star_report' },
        { key: 'okr_hierarchy', title: 'Quarterly OKR Objectives & Key Results Hierarchy', type: 'data_bound', source: 'okrs.hierarchy_tree' },
        { key: 'executive_commentary_and_adjustments', title: 'Quarterly Executive Commentary & Pivot Strategy', type: 'free_text' }
      ]
    }
  }

  if (documentType === 'product_requirements_document') {
    return {
      id: data?.id || 'product_requirements_document_template',
      document_type: 'product_requirements_document',
      is_custom: false,
      created_at: data?.created_at || new Date().toISOString(),
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
      ]
    }
  }

  if (error) {
    console.error('Failed to load document template:', error)
    return null
  }
  return { ...data, is_custom: false }
}

export async function getGeneratedDocument(projectId: string, documentType: string, isSnapshot = false, snapshotId?: string): Promise<GeneratedDocument | null> {
  const supabase = await createClient()
  let query = supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', isSnapshot)

  if (isSnapshot && snapshotId) {
    query = query.eq('id', snapshotId)
  } else if (isSnapshot) {
    // If asking for a snapshot but no ID provided, maybe order by latest
    query = query.order('generated_at', { ascending: false }).limit(1)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Failed to load generated document:', error)
    return null
  }
  return data
}

export async function getReportSnapshots(projectId: string, documentType: string): Promise<GeneratedDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select('id, period_end, generated_at')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', true)
    .order('period_end', { ascending: false })

  if (error) return []
  return data as GeneratedDocument[]
}

export async function saveGeneratedDocument(
  projectId: string,
  documentType: string,
  freeTextContent: Record<string, string>,
  isSnapshot = false,
  frozenData?: any,
  periodEnd?: string,
  templateId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  let docId = ''

  if (isSnapshot) {
    // Snapshots are always inserts now
    const { data: newDoc, error } = await supabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        custom_template_id: templateId || null,
        free_text_content: freeTextContent,
        is_snapshot: true,
        frozen_data: frozenData || {},
        period_end: periodEnd,
        generated_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    docId = newDoc?.id || projectId

    // Log snapshot published
    await logProjectActivity(projectId, 'document', docId, 'published', { period_end: periodEnd, document_type: documentType })
  } else {
    // Drafts are upserted using the partial unique index or manually
    // To be safe with the partial index, we can just do an update or insert
    const { data: existing } = await supabase
      .from('generated_documents')
      .select('id')
      .eq('project_id', projectId)
      .eq('document_type', documentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      docId = existing.id
      const { error } = await supabase
        .from('generated_documents')
        .update({
          custom_template_id: templateId || null,
          free_text_content: freeTextContent,
          updated_at: now,
        })
        .eq('id', existing.id)
      if (error) return { ok: false, error: error.message }
      
      // Log updated
      await logProjectActivity(projectId, 'document', existing.id, 'updated', { document_type: documentType })
    } else {
      const { data: newDoc, error } = await supabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          custom_template_id: templateId || null,
          free_text_content: freeTextContent,
          is_snapshot: false,
          generated_at: now,
          updated_at: now,
        })
        .select('id')
        .single()
      if (error) return { ok: false, error: error.message }
      docId = newDoc?.id || projectId
      
      // Log created
      await logProjectActivity(projectId, 'document', docId, 'created', { document_type: documentType })
    }
  }

  const { data: authData } = await supabase.auth.getUser()
  if (authData?.user?.id) {
    await dispatchNotification({
      userId: authData.user.id,
      projectId,
      triggerType: isSnapshot ? 'status_report' : 'document_change',
      referenceEntityType: 'document',
      referenceEntityId: docId || projectId,
      contentSummary: isSnapshot
        ? `Published status report snapshot for period ending ${periodEnd || 'now'}`
        : `Generated/updated ${documentType} document draft`
    }).catch(err => console.error('Webhook notification failed:', err))
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function updateDocumentTemplateId(
  projectId: string,
  documentType: string,
  templateId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('generated_documents')
    .update({
      custom_template_id: templateId,
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', false)

  if (error) return { ok: false, error: error.message }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function regenerateDocument(
  projectId: string,
  documentType: string,
  isSnapshot = false
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (isSnapshot) {
    return { ok: false, error: 'Cannot regenerate a snapshot directly this way' }
  }
  
  const { data: existing } = await supabase
    .from('generated_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', false)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('generated_documents')
      .update({ generated_at: now, updated_at: now })
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        free_text_content: {},
        is_snapshot: false,
        generated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function getAvailableDocumentTypes() {
  return [
    { id: 'charter', name: 'Project Charter' },
    { id: 'wbs_dictionary', name: 'WBS Dictionary' },
    { id: 'raci', name: 'RACI Matrix' },
    { id: 'stakeholder_register', name: 'Stakeholder Register' },
    { id: 'risk_register', name: 'Risk Register' },
    { id: 'status_report', name: 'Status Report' },
    { id: 'closure_report', name: 'Closure Report' },
    { id: 'lessons_learned', name: 'Lessons Learned' },
    { id: 'handover_document', name: 'Handover Document' },
    { id: 'post_implementation_review', name: 'Post-Implementation Review' },
    { id: 'signoff_board', name: 'Sign-Off Board' },
    { id: 'business_case', name: 'Business Case' },
    { id: 'feasibility_study', name: 'Feasibility Study' },
    { id: 'scope_statement', name: 'Scope Statement' },
    { id: 'communication_plan', name: 'Communication Plan' },
    { id: 'quality_management_plan', name: 'Quality Management Plan' },
    { id: 'procurement_plan', name: 'Procurement Plan' },
  ]
}
