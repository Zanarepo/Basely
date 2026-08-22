'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function autoGenerateWbsDeliverablesAndAcceptance(wbsElementId: string): Promise<{ ok: boolean; data?: { deliverables: any[]; criteria: any[] }; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: element, error } = await supabase
      .from('wbs_elements')
      .select('id, name, description, project_id')
      .eq('id', wbsElementId)
      .single()

    if (error || !element) {
      return { ok: false, error: error?.message || 'WBS Element not found' }
    }

    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')

    const result = await generateStructuredJson<{
      tangible_deliverables: string[]
      acceptance_criteria: string[]
    }>({
      systemPrompt: `You are an expert Technical Project Manager & Quality Lead. Auto-generate realistic, concrete Tangible Deliverables and Acceptance Criteria for a given WBS project task.
Output strictly a JSON object matching this schema:
{
  "tangible_deliverables": ["2 to 4 concrete deliverables/artifacts"],
  "acceptance_criteria": ["2 to 4 testable pass/fail conditions"]
}`,
      userPrompt: `Task Name: ${element.name}
Task Description: ${element.description || 'No description provided.'}`
    })

    const deliverablesItems = (result.tangible_deliverables || []).map((text, i) => ({
      id: `del_${i}_${Date.now()}`,
      text,
      completed: false
    }))

    const acceptanceItems = (result.acceptance_criteria || []).map((text, i) => ({
      id: `acc_${i}_${Date.now()}`,
      text,
      completed: false
    }))

    const { error: updateErr } = await supabase
      .from('wbs_elements')
      .update({
        deliverables: result.tangible_deliverables?.join('\
') || null,
        deliverables_data: deliverablesItems,
        acceptance_criteria: result.acceptance_criteria?.join('\
') || null,
        acceptance_criteria_data: acceptanceItems
      })
      .eq('id', wbsElementId)

    if (updateErr) return { ok: false, error: updateErr.message }

    revalidatePath(`/dashboard/projects/${element.project_id}`)
    return { ok: true, data: { deliverables: deliverablesItems, criteria: acceptanceItems } }
  } catch (err: any) {
    console.error('autoGenerateWbsDeliverablesAndAcceptance failed:', err)
    return { ok: false, error: err?.message || 'Praz-AI generation failed' }
  }
}

export async function generateScopeDetailsWithAiAction(name: string, description?: string): Promise<{
  ok: boolean
  data?: { tangible_deliverables: string[]; acceptance_criteria: string[] }
  error?: string
}> {
  try {
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    const result = await generateStructuredJson<{
      tangible_deliverables: string[]
      acceptance_criteria: string[]
    }>({
      systemPrompt: `You are an expert Technical Project Manager & Quality Lead. Auto-generate realistic, concrete Tangible Deliverables and Acceptance Criteria for a given WBS project task.
Output strictly a JSON object matching this schema:
{
  "tangible_deliverables": ["2 to 4 concrete deliverables/artifacts"],
  "acceptance_criteria": ["2 to 4 testable pass/fail conditions"]
}`,
      userPrompt: `Task Name: ${name}
Task Description: ${description || 'No description provided.'}`
    })
    return { ok: true, data: result }
  } catch (err: any) {
    console.error('generateScopeDetailsWithAiAction server error:', err)
    return { ok: false, error: err?.message || 'Praz-AI Generation failed' }
  }
}
