'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRisk(projectId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
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

  if (error) {
    console.error('Create risk error:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function updateRisk(id: string, projectId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('risks')
    .update(data)
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('Update risk error:', error)
    return { ok: false, error: error.message }
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

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}

export async function createIssue(projectId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
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

  if (error) {
    console.error('Create issue error:', error)
    return { ok: false, error: error.message }
  }

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

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}
