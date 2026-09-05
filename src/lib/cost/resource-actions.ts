'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { EstimationMethod } from './types'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { logProjectActivity } from '@/lib/projects/activity-actions'

export async function createResourceRate(projectId: string, payload: {
  name: string, type: 'labor' | 'material' | 'fixed', rate: number, unit: 'hr' | 'day' | 'unit' | 'flat', currency?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resource_rates')
    .insert({
      project_id: projectId,
      name: payload.name,
      type: payload.type,
      rate: payload.rate,
      unit: payload.unit,
      currency: payload.currency || 'USD'
    })
    .select()
    .single()

  if (error) throw error
  
  await logProjectActivity(projectId, 'resources', data.id, 'created', { name: payload.name, type: payload.type, rate: payload.rate })
  
  return { success: true, data }
}

export async function updateResourceRate(rateId: string, payload: {
  name: string, type: 'labor' | 'material' | 'fixed', rate: number, unit: 'hr' | 'day' | 'unit' | 'flat', currency?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resource_rates')
    .update({
      name: payload.name,
      type: payload.type,
      rate: payload.rate,
      unit: payload.unit,
      currency: payload.currency,
      updated_at: new Date().toISOString()
    })
    .eq('id', rateId)
    .select()
    .single()

  if (error) throw error
  
  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'resources', rateId, 'updated', { name: payload.name, type: payload.type, rate: payload.rate })
  }
  
  return { success: true, data }
}

export async function deleteResourceRate(rateId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('resource_rates').select('project_id').eq('id', rateId).single()
  
  const { error } = await supabase
    .from('resource_rates')
    .delete()
    .eq('id', rateId)

  if (error) throw error
  
  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'resources', rateId, 'deleted', { id: rateId })
  }
  
  return { success: true }
}

export async function assignResourceToActivity(wbsElementId: string, resourceRateId: string, quantity: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('activity_resource_assignments')
    .insert({
      wbs_element_id: wbsElementId,
      resource_rate_id: resourceRateId,
      quantity: quantity
    })
    .select()
    .single()

  if (error) throw error
  
  const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', wbsElementId).single()
  if (wbsData?.project_id) {
    await logProjectActivity(wbsData.project_id, 'resources', data.id, 'created', { wbs_element_id: wbsElementId, quantity, type: 'assignment' })
  }
  
  return { success: true, data }
}

export async function deleteResourceAssignment(assignmentId: string) {
  const supabase = await createClient()
  const { data: assignmentData } = await supabase.from('activity_resource_assignments').select('wbs_element_id').eq('id', assignmentId).single()
  
  const { error } = await supabase
    .from('activity_resource_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw error
  
  if (assignmentData?.wbs_element_id) {
    const { data: wbsData } = await supabase.from('wbs_elements').select('project_id').eq('id', assignmentData.wbs_element_id).single()
    if (wbsData?.project_id) {
      await logProjectActivity(wbsData.project_id, 'resources', assignmentId, 'deleted', { id: assignmentId, type: 'assignment' })
    }
  }
  
  return { success: true }
}

export async function bulkImportResourceRates(projectId: string, resources: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in')

  if (!resources || resources.length === 0) return { success: true }

  const { error } = await supabase
    .from('resource_rates')
    .insert(resources)

  if (error) throw error
  return { success: true }
}

export async function bulkDeleteResourceRates(rateIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in')

  if (!rateIds || rateIds.length === 0) return { success: true }

  const { error } = await supabase
    .from('resource_rates')
    .delete()
    .in('id', rateIds)

  if (error) throw error
  return { success: true }
}
