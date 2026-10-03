'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import type { OkrObjective, OkrKeyResult } from './types'

async function syncObjectiveProgress(objectiveId: string) {
  const supabase = await createClient()
  const { data: krs } = await supabase.from('okr_key_results').select('progress').eq('objective_id', objectiveId)
  if (krs && krs.length > 0) {
    const total = krs.reduce((sum, item) => sum + (item.progress || 0), 0)
    const avg = Math.round(total / krs.length)
    let status = 'on_track'
    if (avg < 40) status = 'behind'
    else if (avg < 75) status = 'at_risk'
    await supabase.from('okr_objectives').update({ progress: avg, status, updated_at: new Date().toISOString() }).eq('id', objectiveId)
  }
}

export async function getOkrObjectives(organizationId: string, projectId?: string): Promise<OkrObjective[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('okr_objectives')
    .select('*, key_results:okr_key_results(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching OKRs:', error)
    return []
  }
  return data as OkrObjective[]
}

export async function createOkrObjective(payload: Partial<OkrObjective>): Promise<{ ok: boolean; error?: string; data?: OkrObjective }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('okr_objectives')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select('*, key_results:okr_key_results(*)')
    .single()

  if (error) {
    console.error('Error creating OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'okr_objective' as any, data.id, 'created', { title: data.title })
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
  }
  
  return { ok: true, data: data as OkrObjective }
}

export async function updateOkrObjective(id: string, payload: Partial<OkrObjective>): Promise<{ ok: boolean; error?: string; data?: OkrObjective }> {
  const supabase = await createClient()
  
  // Strip nested relations before updating table
  const updateData = { ...payload }
  delete (updateData as any).key_results

  const { data, error } = await supabase
    .from('okr_objectives')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, key_results:okr_key_results(*)')
    .single()

  if (error) {
    console.error('Error updating OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'okr_objective' as any, data.id, 'updated', { title: data.title })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as OkrObjective }
}

export async function deleteOkrObjective(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('okr_objectives').select('project_id, title').eq('id', id).single()
  const { error } = await supabase.from('okr_objectives').delete().eq('id', id)

  if (error) {
    console.error('Error deleting OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'okr_objective' as any, id, 'deleted', { title: data.title })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true }
}

export async function createOkrKeyResult(payload: Partial<OkrKeyResult>): Promise<{ ok: boolean; error?: string; data?: OkrKeyResult }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('okr_key_results')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (payload.objective_id) {
    await syncObjectiveProgress(payload.objective_id)
  }
  
  return { ok: true, data: data as OkrKeyResult }
}

export async function updateOkrKeyResult(id: string, payload: Partial<OkrKeyResult>): Promise<{ ok: boolean; error?: string; data?: OkrKeyResult }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('okr_key_results')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (data?.objective_id) {
    await syncObjectiveProgress(data.objective_id)
  }

  return { ok: true, data: data as OkrKeyResult }
}

export async function deleteOkrKeyResult(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('okr_key_results').select('objective_id, title').eq('id', id).single()
  const { error } = await supabase.from('okr_key_results').delete().eq('id', id)

  if (error) {
    console.error('Error deleting Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (data?.objective_id) {
    await syncObjectiveProgress(data.objective_id)
  }

  return { ok: true }
}
