'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'

export async function createRisk(projectId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: newRisk, error } = await supabase
    .from('risks')
    .insert([
      {
        project_id: projectId,
        title: data.title,
        description: data.description,
        probability: data.probability,
        impact: data.impact,
        response_strategy: data.response_strategy,
        status: data.status,
        owner_stakeholder_id: data.owner_stakeholder_id || null,
        allocated_contingency_amount: data.allocated_contingency_amount || null,
        linked_wbs_element_id: data.linked_wbs_element_id || null
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Create risk error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'risk', newRisk.id, 'created', { title: data.title })

  if (user) {
    await dispatchNotification({
      userId: user.id,
      triggerType: 'risk_change',
      referenceEntityType: 'risk',
      referenceEntityId: newRisk.id,
      projectId,
      contentSummary: `New risk created: ${data.title} (Impact: ${data.impact}, Probability: ${data.probability})`,
    })
  }

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function updateRisk(id: string, projectId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('risks')
    .update(data)
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('Update risk error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'risk', id, 'updated', { title: data.title || 'Risk Updated' })

  if (user) {
    await dispatchNotification({
      userId: user.id,
      triggerType: 'risk_change',
      referenceEntityType: 'risk',
      referenceEntityId: id,
      projectId,
      contentSummary: `Risk assessment updated: ${data.title || 'Risk item'}`,
    })
  }

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function deleteRisk(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('risks')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('Delete risk error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'risk', id, 'deleted', { id })

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function createIssue(projectId: string, data: any) {
  const supabase = await createClient()

  const { data: newIssue, error } = await supabase
    .from('issues')
    .insert([
      {
        project_id: projectId,
        title: data.title,
        description: data.description,
        raised_date: data.raised_date || new Date().toISOString(),
        status: data.status,
        owner_stakeholder_id: data.owner_stakeholder_id || null,
        linked_risk_id: data.linked_risk_id || null
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Create issue error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'issue', newIssue.id, 'created', { title: data.title })

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function updateIssue(id: string, projectId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('issues')
    .update(data)
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('Update issue error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'issue', id, 'updated', { title: data.title || 'Issue Updated' })

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function deleteIssue(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('Delete issue error:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'issue', id, 'deleted', { id })

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

/**
 * Extracts parsed risks from the 'risk_register' document's Markdown table
 */
export async function extractRisksFromDocument(projectId: string) {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('generated_documents')
    .select('free_text_content')
    .eq('project_id', projectId)
    .eq('document_type', 'risk_register')
    .eq('is_snapshot', false)
    .maybeSingle()

  if (!doc || !doc.free_text_content) {
    return { ok: false, error: 'Risk Register document not found. Generate it first in the Documents tab.' }
  }

  const freeText = doc.free_text_content as Record<string, string>
  const riskTableMd = freeText.risk_register || ''

  if (!riskTableMd.includes('|')) {
    return { ok: false, error: 'No valid risk table found in the Risk Register document.' }
  }

  // Parse markdown table
  // Expected headers: Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner
  const lines = riskTableMd.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'))
  
  if (lines.length < 3) {
    return { ok: false, error: 'Risk table is empty or malformed.' }
  }

  const headers = lines[0].split('|').map(h => h.trim().toLowerCase()).filter(Boolean)
  const risks = []

  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1)
    if (cells.length === headers.length) {
      const riskData: any = {}
      headers.forEach((h, idx) => {
        if (h.includes('title') || h.includes('description') || h.includes('risk')) riskData.title = cells[idx]
        if (h.includes('prob')) riskData.probability = parseInt(cells[idx]) || 3
        if (h.includes('impact')) riskData.impact = parseInt(cells[idx]) || 3
        if (h.includes('mitigation') || h.includes('response')) riskData.response_strategy = 'Mitigate'
        if (h.includes('mitigation') || h.includes('plan')) riskData.mitigation_plan = cells[idx]
      })
      
      risks.push({
        id: `extracted-${i}`, // temp id for UI selection
        title: riskData.title || `Extracted Risk ${i-1}`,
        description: riskData.title || '', // Fallback description
        probability: riskData.probability || 3,
        impact: riskData.impact || 3,
        response_strategy: riskData.response_strategy || 'Mitigate',
        status: 'Identified',
        mitigation_plan: riskData.mitigation_plan || ''
      })
    }
  }

  return { ok: true, data: risks }
}

export async function bulkImportRisks(projectId: string, risks: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const insertData = risks.map(r => ({
    project_id: projectId,
    title: r.title,
    description: r.description,
    probability: r.probability,
    impact: r.impact,
    response_strategy: r.response_strategy,
    status: r.status,
    mitigation_plan: r.mitigation_plan
  }))

  const { error } = await supabase.from('risks').insert(insertData)

  if (error) {
    console.error('Bulk import error:', error)
    return { ok: false, error: error.message }
  }

  if (user) {
    await logProjectActivity(projectId, 'risk', 'bulk-import', 'created', { title: `Imported ${risks.length} risks from document` })
  }

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}
