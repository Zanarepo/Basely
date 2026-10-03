'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function generateCostEstimates(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch Project Currency
    const { data: project } = await supabase.from('projects').select('currency').eq('id', projectId).single()
    const currency = project?.currency || 'USD'

    // 2. Fetch WBS Elements along with their activities (for duration)
    const { data: wbsElements, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('id, name, description, is_work_package, activities(duration)')
      .eq('project_id', projectId)

    if (wbsError) throw new Error('Failed to fetch WBS elements.')
    
    if (!wbsElements || wbsElements.length === 0) {
      return { success: false, error: 'No WBS elements found. Build your Work Breakdown Structure first.' }
    }

    const workPackages = wbsElements.filter(el => el.is_work_package)
    if (workPackages.length === 0) {
      return { success: false, error: 'No Work Packages found. Ensure your WBS has leaf-node work packages.' }
    }

    // 3. Fetch Project Context (Scope Statement)
    const { data: scopeDoc } = await supabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'scope_statement')
      .eq('is_snapshot', false)
      .maybeSingle()

    const scopeContext = scopeDoc ? JSON.stringify(scopeDoc.free_text_content) : 'No scope statement available.'

    // 4. AI Generation
    const wbsContext = wbsElements.map(el => {
      const type = el.is_work_package ? 'Work Package' : 'Deliverable'
      const duration = el.activities && el.activities.length > 0 ? el.activities[0].duration : 'Unknown'
      return `- [${type}] ID: ${el.id} | Name: ${el.name} | Duration: ${duration} days\n  Desc: ${el.description || ''}`
    }).join('\n')

    const systemPrompt = `You are an expert Project Estimator.
Your task is to estimate a realistic monetary budget for each Work Package in the provided Work Breakdown Structure.

Consider the Scope and the already-scheduled duration of each Work Package when estimating its monetary cost.
You must choose the best estimation method for each work package. Valid methods are "analogous", "parametric", or "bottom_up".

Format your output as a JSON object with exactly this key:
{
  "cost_estimates": [
    {
      "wbs_element_id": "Must be the exact ID string provided in the context.",
      "estimated_budget": 15000,
      "estimation_method": "analogous" 
    }
  ]
}

Instructions:
1. Estimate realistic costs in the project's currency (${currency}) for each Work Package based on standard industry practices and its duration.
2. For estimation_method, output either "analogous", "parametric", or "bottom_up".
3. Ensure every Work Package from the context is included in the cost_estimates array.
4. The wbs_element_id MUST match the provided IDs exactly.`

    const object = await generateStructuredJson({
      systemPrompt,
      userPrompt: `Project Scope Context:\n${scopeContext}\n\nWBS Elements:\n${wbsContext}`
    })

    // 5. Save Budget Estimates to cost_accounts
    if (object.cost_estimates && Array.isArray(object.cost_estimates)) {
      const costRows = object.cost_estimates.map((est: any) => ({
        project_id: projectId,
        wbs_element_id: est.wbs_element_id,
        budgeted_total: est.estimated_budget || 0,
        currency: currency,
        estimation_method: est.estimation_method || 'analogous',
        reconciliation_status: 'reconciled'
      }))

      if (costRows.length > 0) {
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

    return { success: true }
  } catch (error: any) {
    console.error('generateCostEstimates error:', error)
    return { success: false, error: error.message || 'An error occurred during cost estimation.' }
  }
}
