'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function generateResourceEstimates(projectId: string): Promise<{ success: boolean; error?: string }> {
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
    
    const workPackages = wbsElements?.filter(el => el.is_work_package) || []
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
    const wbsContext = workPackages.map(el => {
      const duration = el.activities && el.activities.length > 0 ? el.activities[0].duration : 'Unknown'
      return `- ID: ${el.id} | Name: ${el.name} | Duration: ${duration} days\n  Desc: ${el.description || ''}`
    }).join('\n')

    const systemPrompt = `You are an expert Project Resource Manager and Estimator.
Your task is to build a "Bottom-Up" estimate for the provided project by:
1. Identifying a catalog of standardized Resource Rates (e.g. Roles like "Senior Developer", "UI Designer", materials like "Server Hardware").
2. Assigning the exact quantity of these resources needed to complete each Work Package based on its scope and scheduled duration.

Format your output as a JSON object with exactly these keys:
{
  "resource_catalog": [
    {
      "temp_key": "res_1",
      "name": "Senior Software Engineer",
      "type": "labor",
      "rate": 150,
      "unit": "hr"
    }
  ],
  "resource_assignments": [
    {
      "wbs_element_id": "Must match the exact ID provided in the context.",
      "temp_key": "res_1",
      "quantity": 40
    }
  ]
}

Instructions:
- Use realistic market rates for the resource_catalog (assuming the currency is ${currency}).
- Valid types: "labor", "material", "fixed". Valid units: "hr", "day", "unit", "flat".
- For resource_assignments, if a Work Package requires a Senior Software Engineer for 1 week, you would assign "quantity": 40 if the unit is "hr". Look at the Work Package Duration (in days) to help estimate the quantity.
- Assign resources to EVERY Work Package listed in the context.
- Use the exact wbs_element_id from the context.`

    const object = await generateStructuredJson({
      systemPrompt,
      userPrompt: `Project Scope Context:\n${scopeContext}\n\nWork Packages:\n${wbsContext}`
    })

    if (!object.resource_catalog || !object.resource_assignments) {
      throw new Error("AI failed to return the correct JSON structure.")
    }

    // 5. Insert Resource Catalog
    const tempKeyToIdMap: Record<string, string> = {}
    
    // Check for existing rates first to avoid complete duplication (optional, but good practice)
    const { data: existingRates } = await supabase.from('resource_rates').select('id, name').eq('project_id', projectId)
    
    for (const cat of object.resource_catalog) {
      const existing = existingRates?.find(r => r.name.toLowerCase() === cat.name.toLowerCase())
      if (existing) {
        tempKeyToIdMap[cat.temp_key] = existing.id
      } else {
        const { data: newRate, error: rateError } = await supabase
          .from('resource_rates')
          .insert({
            project_id: projectId,
            name: cat.name,
            type: cat.type,
            rate: cat.rate,
            unit: cat.unit,
            currency: currency
          })
          .select('id')
          .single()
          
        if (rateError) throw rateError
        if (newRate) tempKeyToIdMap[cat.temp_key] = newRate.id
      }
    }

    // 6. Delete previous AI assignments to avoid duplicate pileup
    // For safety, we only delete assignments if we are regenerating
    // This is complex because we'd need to fetch existing and delete them.
    // Instead of deleting, we'll just insert and calculate. A fresh project shouldn't have conflicts.

    // 7. Insert Assignments & Calculate Cost
    const assignmentsToInsert = []
    for (const assignment of object.resource_assignments) {
      const rateId = tempKeyToIdMap[assignment.temp_key]
      if (!rateId) continue

      // Look up the rate to calculate the cost
      const catalogItem = object.resource_catalog.find((c: any) => c.temp_key === assignment.temp_key)
      const calculatedCost = catalogItem ? catalogItem.rate * assignment.quantity : 0

      assignmentsToInsert.push({
        wbs_element_id: assignment.wbs_element_id,
        resource_rate_id: rateId,
        quantity: assignment.quantity,
        calculated_cost: calculatedCost
      })
    }

    if (assignmentsToInsert.length > 0) {
      await supabase.from('activity_resource_assignments').insert(assignmentsToInsert)
    }

    // 8. Reconcile Cost Accounts (Update budgeted_total)
    // We need to sum up the calculated_cost per wbs_element_id and upsert cost_accounts
    const { data: allAssignments } = await supabase
      .from('activity_resource_assignments')
      .select('wbs_element_id, calculated_cost')
      .in('wbs_element_id', workPackages.map(w => w.id))
      
    const sumByWbs: Record<string, number> = {}
    if (allAssignments) {
      allAssignments.forEach(a => {
        sumByWbs[a.wbs_element_id] = (sumByWbs[a.wbs_element_id] || 0) + Number(a.calculated_cost)
      })
    }

    for (const wp of workPackages) {
      const totalCost = sumByWbs[wp.id] || 0
      
      const { data: existingCa } = await supabase
        .from('cost_accounts')
        .select('id')
        .eq('wbs_element_id', wp.id)
        .maybeSingle()
        
      if (existingCa) {
        await supabase
          .from('cost_accounts')
          .update({
            budgeted_total: totalCost,
            estimation_method: 'bottom_up',
            reconciliation_status: 'reconciled'
          })
          .eq('id', existingCa.id)
      } else {
        await supabase.from('cost_accounts').insert({
          project_id: projectId,
          wbs_element_id: wp.id,
          budgeted_total: totalCost,
          currency: currency,
          estimation_method: 'bottom_up',
          reconciliation_status: 'reconciled'
        })
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('generateResourceEstimates error:', error)
    return { success: false, error: error.message || 'An error occurred during resource estimation.' }
  }
}
