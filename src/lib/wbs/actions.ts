'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { wbsElementSchema } from '@/lib/validations/wbs'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import type { WbsElement, WbsStatus, RaciRoleType, DeliverableItem, AcceptanceCriteriaItem } from './constants'
import { recalculateSchedule } from '@/lib/schedule/actions/recalculate'

export type ActionResponse = { ok: true } | { ok: false; error: string }
export type CreateWbsResult = { ok: true; id: string } | { ok: false; error: string }

export async function getWbsElements(projectId: string): Promise<
  | { ok: true; data: WbsElement[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wbs_elements')
    .select('*, activities(duration), raci_assignments(*, stakeholder:stakeholders(*, profiles(full_name, email)))')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  const mapped: WbsElement[] = data.map((d: any) => ({
    id: d.id,
    projectId: d.project_id,
    parentId: d.parent_id,
    code: d.code,
    name: d.name,
    description: d.description,
    ownerId: d.owner_id,
    deliverables: d.deliverables,
    deliverablesData: d.deliverables_data || [],
    acceptanceCriteria: d.acceptance_criteria,
    acceptanceCriteriaData: d.acceptance_criteria_data || [],
    status: d.status as WbsStatus,
    isWorkPackage: d.is_work_package,
    sortOrder: d.sort_order,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    duration: d.activities ? Number(d.activities.duration) : undefined,
    raciAssignments: d.raci_assignments?.map((r: any) => ({
      id: r.id,
      wbsElementId: r.wbs_element_id,
      stakeholderId: r.stakeholder_id,
      roleType: r.role_type,
      stakeholder: r.stakeholder
    })) || [],
  }))

  return { ok: true, data: mapped }
}

export async function createWbsElement(
  projectId: string,
  parentId: string | null,
  name: string,
  sortOrder: number,
  initialData?: { status?: string; isWorkPackage?: boolean }
): Promise<CreateWbsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Simple validation for name
  if (!name.trim()) return { ok: false, error: 'Name is required' }

  const insertPayload: any = {
    project_id: projectId,
    parent_id: parentId,
    name: name.trim(),
    sort_order: sortOrder,
  }

  if (initialData?.status) insertPayload.status = initialData.status
  if (initialData?.isWorkPackage !== undefined) insertPayload.is_work_package = initialData.isWorkPackage

  const { data, error } = await supabase
    .from('wbs_elements')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  // If a work package was directly created, we might need to recalculate schedule
  if (initialData?.isWorkPackage) {
    await recalculateSchedule(projectId)
  }

  await logProjectActivity(projectId, 'wbs_element', data.id, 'created', { name: name.trim() })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true, id: data.id }
}

export async function updateWbsElement(
  id: string,
  projectId: string,
  payload: {
    name?: string
    description?: string | null
    deliverables?: string | null
    deliverablesData?: DeliverableItem[]
    acceptanceCriteria?: string | null
    acceptanceCriteriaData?: AcceptanceCriteriaItem[]
    status?: WbsStatus
    isWorkPackage?: boolean
  }
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Extract fields to update
  const updateData: any = {}
  if (payload.name !== undefined) {
    if (!payload.name.trim()) return { ok: false, error: 'Name is required' }
    updateData.name = payload.name.trim()
  }
  if (payload.description !== undefined) updateData.description = payload.description || null
  if (payload.deliverables !== undefined) updateData.deliverables = payload.deliverables || null
  if (payload.deliverablesData !== undefined) updateData.deliverables_data = payload.deliverablesData || []
  if (payload.acceptanceCriteria !== undefined) {
    updateData.acceptance_criteria = payload.acceptanceCriteria || null
  }
  if (payload.acceptanceCriteriaData !== undefined) {
    updateData.acceptance_criteria_data = payload.acceptanceCriteriaData || []
  }
  if (payload.status !== undefined) updateData.status = payload.status
  if (payload.isWorkPackage !== undefined) updateData.is_work_package = payload.isWorkPackage

  const { error } = await supabase
    .from('wbs_elements')
    .update(updateData)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  // Sync completion status to activities table if status was provided
  if (payload.status !== undefined) {
    let percentComplete = 0
    if (payload.status === 'Complete') percentComplete = 100
    else if (payload.status === 'In Progress') percentComplete = 50 // Safe default for in-progress
    
    // We update actual_finish as well for better tracking if complete
    const updateAct: any = { percent_complete: percentComplete }
    if (percentComplete === 100) {
      updateAct.actual_finish = new Date().toISOString().split('T')[0]
    } else {
      updateAct.actual_finish = null
    }

    // Try to update corresponding activity (if it exists)
    // Note: Since activities table schema doesn't have actual_finish we just update percent_complete
    await supabase
      .from('activities')
      .update({ percent_complete: percentComplete })
      .eq('wbs_element_id', id)
  }

  // Recalculate schedule if name or work package status changes
  if (payload.isWorkPackage !== undefined || payload.name !== undefined) {
    await recalculateSchedule(projectId)
  }

  await logProjectActivity(projectId, 'wbs_element', id, 'updated', { name: payload.name || 'WBS Element Updated' })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function deleteWbsElement(id: string, projectId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('wbs_elements')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  // Recalculate schedule to update timelines after deletion
  await recalculateSchedule(projectId)

  await logProjectActivity(projectId, 'wbs_element', id, 'deleted', { id })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function moveWbsElement(
  id: string,
  projectId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('wbs_elements')
    .update({
      parent_id: newParentId,
      sort_order: newSortOrder,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function updateWbsSortOrders(
  projectId: string,
  updates: { id: string; parentId: string | null; sortOrder: number }[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Perform updates sequentially
  for (const item of updates) {
    const { error } = await supabase
      .from('wbs_elements')
      .update({
        parent_id: item.parentId,
        sort_order: item.sortOrder,
      })
      .eq('id', item.id)

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function bulkImportWbsElements(
  projectId: string,
  elements: any[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  if (!elements || elements.length === 0) return { ok: true }

  const { error } = await supabase
    .from('wbs_elements')
    .insert(elements)

  if (error) return { ok: false, error: error.message }

  await recalculateSchedule(projectId)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function bulkDeleteWbsElements(
  ids: string[],
  projectId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }
  if (!ids || ids.length === 0) return { ok: true }

  const { error } = await supabase
    .from('wbs_elements')
    .delete()
    .in('id', ids)

  if (error) return { ok: false, error: error.message }

  await recalculateSchedule(projectId)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

import { dispatchNotification } from '@/lib/notifications/actions'

export async function assignRaciRole(
  projectId: string,
  wbsElementId: string,
  stakeholderId: string,
  roleType: RaciRoleType
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('raci_assignments')
    .insert({
      project_id: projectId,
      wbs_element_id: wbsElementId,
      stakeholder_id: stakeholderId,
      role_type: roleType
    })

  if (error) return { ok: false, error: error.message }

  // Dispatch Notification for assignment
  const { data: stakeholderData } = await supabase
    .from('stakeholders')
    .select('linked_user_id, name')
    .eq('id', stakeholderId)
    .single()

  const { data: wbsData } = await supabase
    .from('wbs_elements')
    .select('name')
    .eq('id', wbsElementId)
    .single()

  if (stakeholderData?.linked_user_id && stakeholderData.linked_user_id !== user.id) {
    const wbsName = wbsData?.name || 'a task'
    await dispatchNotification({
      userId: stakeholderData.linked_user_id,
      triggerType: 'assignment',
      referenceEntityType: 'wbs',
      referenceEntityId: wbsElementId,
      projectId,
      contentSummary: `You were assigned as ${roleType} for "${wbsName}"`,
      emailContext: {
        subject: `New Project Assignment: ${wbsName}`,
        title: `Task Assignment`,
        message: `You have been assigned the role of <strong>${roleType}</strong> for the task <strong>${wbsName}</strong>.`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}?tab=wbs&elementId=${wbsElementId}`
      }
    })
  }

  await logProjectActivity(projectId, 'raci', stakeholderId, 'created', { 
    role_type: roleType, 
    wbs_element_id: wbsElementId,
    wbs_name: wbsData?.name,
    stakeholder_name: stakeholderData?.name
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function removeRaciRole(
  projectId: string,
  wbsElementId: string,
  stakeholderId: string,
  roleType: RaciRoleType
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('raci_assignments')
    .delete()
    .eq('wbs_element_id', wbsElementId)
    .eq('stakeholder_id', stakeholderId)
    .eq('role_type', roleType)

  if (error) return { ok: false, error: error.message }
  
  await logProjectActivity(projectId, 'raci', stakeholderId, 'deleted', { role_type: roleType, wbs_element_id: wbsElementId })
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function replaceAccountableRole(
  projectId: string,
  wbsElementId: string,
  newStakeholderId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  // 1. Delete current accountable
  await supabase
    .from('raci_assignments')
    .delete()
    .eq('wbs_element_id', wbsElementId)
    .eq('role_type', 'Accountable')

  // 2. Insert new
  const { error } = await supabase
    .from('raci_assignments')
    .insert({
      project_id: projectId,
      wbs_element_id: wbsElementId,
      stakeholder_id: newStakeholderId,
      role_type: 'Accountable'
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
