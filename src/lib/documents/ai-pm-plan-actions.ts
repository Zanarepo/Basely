'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function generateProjectManagementPlan(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch all generated documents for synthesis
    const { data: documents, error: docsError } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', ['charter', 'scope_statement', 'budget_baseline', 'schedule_document'])

    if (docsError) throw new Error(`Failed to fetch documents: ${docsError.message}`)

    // 2. Fetch Risks for risk synthesis
    const { data: risks } = await supabase
      .from('risks')
      .select('title, description, probability, impact, response_strategy')
      .eq('project_id', projectId)
      .eq('status', 'Identified')
      .limit(10)

    let combinedContext = ''
    
    const charterDoc = documents?.find(d => d.document_type === 'charter')
    const scopeDoc = documents?.find(d => d.document_type === 'scope_statement')
    const budgetDoc = documents?.find(d => d.document_type === 'budget_baseline')
    const scheduleDoc = documents?.find(d => d.document_type === 'schedule_document')

    if (charterDoc) combinedContext += `--- CHARTER ---\n${JSON.stringify(charterDoc.free_text_content)}\n\n`
    if (scopeDoc) combinedContext += `--- SCOPE ---\n${JSON.stringify(scopeDoc.free_text_content)}\n\n`
    if (budgetDoc) combinedContext += `--- BUDGET ---\n${JSON.stringify(budgetDoc.free_text_content)}\n\n`
    if (scheduleDoc) combinedContext += `--- SCHEDULE ---\n${JSON.stringify(scheduleDoc.free_text_content)}\n\n`
    if (risks && risks.length > 0) combinedContext += `--- RISKS ---\n${JSON.stringify(risks)}\n\n`

    if (combinedContext.length < 500) {
      return { success: false, error: 'Not enough planning documents exist to compile a Master Project Management Plan. Please complete the Charter, Scope, and Baselines first.' }
    }

    // 3. AI Generation
    const systemPrompt = `You are an expert Project Management Professional (PMP) acting as the Praz-AI system.
Your task is to synthesize the provided Project Charter, Scope, Budget, Schedule, and Risks into a comprehensive Master Project Management Plan.

Format your output as a JSON object with exactly these keys:
{
  "executive_summary": "High-level summary of the entire project plan, synthesizing the charter and scope.",
  "integrated_baselines": "A summary of the schedule and budget baselines and how they align with the scope.",
  "risk_management_approach": "A synthesized summary of the critical risks and the overall strategy to manage them.",
  "stakeholder_communication": "Recommended cadence for stakeholder communication based on the project complexity.",
  "sub_plans_aggregator": "A markdown table acting as an index referencing all sub-plans (e.g. | Plan | Status | Location |)."
}

Instructions:
1. Synthesize the context seamlessly. Do not just copy-paste.
2. The sub_plans_aggregator should list the Scope Statement, Budget Baseline, Schedule Document, and Risk Register as 'Approved' or 'Active'.`

    const object = await generateStructuredJson({
      systemPrompt,
      userPrompt: `DOCUMENTS TO SYNTHESIZE:\n${combinedContext.substring(0, 40000)}`
    })

    // 4. Save to generated_documents
    const { data: existing } = await supabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'project_management_plan')
      .eq('is_snapshot', false)
      .maybeSingle()

    const content = {
      executive_summary: object.executive_summary || '',
      integrated_baselines: object.integrated_baselines || '',
      risk_management_approach: object.risk_management_approach || '',
      stakeholder_communication: object.stakeholder_communication || '',
      sub_plans_aggregator: object.sub_plans_aggregator || '',
    }

    if (existing) {
      await supabase
        .from('generated_documents')
        .update({
          free_text_content: { ...(existing.free_text_content as Record<string, string> || {}), ...content },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'project_management_plan',
          name: 'Project Management Plan',
          is_snapshot: false,
          free_text_content: content,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
    }

    return { success: true }
  } catch (error: any) {
    console.error('generateProjectManagementPlan error:', error)
    return { success: false, error: error.message || 'An error occurred during PM Plan compilation.' }
  }
}
