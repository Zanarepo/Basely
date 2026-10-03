'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function generateWbsBaselines(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch WBS Elements along with their activities (for duration)
    const { data: wbsElements, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('id, name, description, is_work_package, status, activities(duration)')
      .eq('project_id', projectId)

    if (wbsError) throw new Error('Failed to fetch WBS elements.')
    
    if (!wbsElements || wbsElements.length === 0) {
      return { success: false, error: 'No WBS elements found. Build your Work Breakdown Structure first.' }
    }

    const workPackages = wbsElements.filter(el => el.is_work_package)
    if (workPackages.length === 0) {
      return { success: false, error: 'No Work Packages found. Ensure your WBS has leaf-node work packages.' }
    }

    // 2. Fetch Project Context (Scope Statement)
    const { data: scopeDoc } = await supabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'scope_statement')
      .eq('is_snapshot', false)
      .maybeSingle()

    const scopeContext = scopeDoc ? JSON.stringify(scopeDoc.free_text_content) : 'No scope statement available.'

    // 3. AI Generation
    const wbsContext = wbsElements.map(el => {
      const type = el.is_work_package ? 'Work Package' : 'Deliverable'
      const duration = el.activities && el.activities.length > 0 ? el.activities[0].duration : 'Unknown'
      return `- [${type}] ID: ${el.id} | Name: ${el.name} | Duration: ${duration} days\n  Desc: ${el.description || ''}`
    }).join('\n')

    const systemPrompt = `You are an expert Project Controller.
Your task is to estimate a realistic monetary budget for each Work Package in the provided Work Breakdown Structure, and generate narrative summaries for the Budget and Schedule documents. 

Consider the Scope and the already-scheduled duration of each Work Package when estimating its monetary cost.

Format your output as a JSON object with exactly these keys:
{
  "budget_executive_summary": "An executive summary of the budget baseline, cost drivers, and contingency reserves.",
  "schedule_assumptions": "Key scheduling assumptions, constraints, and dependencies based on the scope.",
  "cost_estimates": [
    {
      "wbs_element_id": "Must be the exact ID string provided in the context.",
      "estimated_budget": 15000,
      "estimation_method": "bottom_up or parametric"
    }
  ]
}

Instructions:
1. Estimate realistic costs for each Work Package based on standard industry practices and its duration.
2. Ensure every Work Package from the context is included in the cost_estimates array.
3. The wbs_element_id MUST match the provided IDs exactly.`

    const object = await generateStructuredJson({
      systemPrompt,
      userPrompt: `Project Scope Context:\n${scopeContext}\n\nWBS Elements:\n${wbsContext}`
    })

    // 4. Save Budget Estimates to cost_accounts
    if (object.cost_estimates && Array.isArray(object.cost_estimates)) {
      const costRows = object.cost_estimates.map((est: any) => ({
        project_id: projectId,
        wbs_element_id: est.wbs_element_id,
        budgeted_total: est.estimated_budget || 0,
        currency: 'USD',
        estimation_method: est.estimation_method || 'ai_estimated',
        reconciliation_status: 'reconciled'
      }))

      if (costRows.length > 0) {
        // Upsert cost accounts
        for (const row of costRows) {
          const { data: existingCa } = await supabase
            .from('cost_accounts')
            .select('id')
            .eq('wbs_element_id', row.wbs_element_id)
            .maybeSingle()

          if (existingCa) {
            await supabase
              .from('cost_accounts')
              .update({
                budgeted_total: row.budgeted_total,
                estimation_method: row.estimation_method
              })
              .eq('id', existingCa.id)
          } else {
            await supabase.from('cost_accounts').insert(row)
          }
        }
      }
    }

    // Helper for saving documents
    const saveDocument = async (docType: string, docName: string, content: any) => {
      const { data: existing } = await supabase
        .from('generated_documents')
        .select('id, free_text_content')
        .eq('project_id', projectId)
        .eq('document_type', docType)
        .eq('is_snapshot', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('generated_documents')
          .update({
            free_text_content: { ...(existing.free_text_content as Record<string, string> || {}), ...content },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        if (error) throw new Error(`Failed to save ${docName}: ${error.message}`)
      } else {
        const { error } = await supabase
          .from('generated_documents')
          .insert({
            project_id: projectId,
            document_type: docType,
            name: docName,
            is_snapshot: false,
            free_text_content: content,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
        if (error) throw new Error(`Failed to save ${docName}: ${error.message}`)
      }
    }

    // 5. Save Budget Baseline
    await saveDocument('budget_baseline', 'Budget Baseline', {
      executive_summary: object.budget_executive_summary || '',
    })

    // 6. Save Schedule Document
    await saveDocument('schedule_document', 'Schedule Document', {
      schedule_assumptions: object.schedule_assumptions || '',
    })

    return { success: true }
  } catch (error: any) {
    console.error('generateWbsBaselines error:', error)
    return { success: false, error: error.message || 'An error occurred during baseline generation.' }
  }
}
