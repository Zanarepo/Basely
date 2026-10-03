'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import type { RaciRoleType } from './constants'
import type { ActionResponse } from './core-actions'

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

  if (stakeholderData?.linked_user_id) {
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

export async function replaceResponsibleRole(
  projectId: string,
  wbsElementId: string,
  newStakeholderId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  // 1. Delete current responsible
  await supabase
    .from('raci_assignments')
    .delete()
    .eq('wbs_element_id', wbsElementId)
    .eq('role_type', 'Responsible')

  // 2. Insert new
  const { error } = await supabase
    .from('raci_assignments')
    .insert({
      project_id: projectId,
      wbs_element_id: wbsElementId,
      stakeholder_id: newStakeholderId,
      role_type: 'Responsible'
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function getProjectRaciStakeholders(projectId: string): Promise<any[]> {
  const supabase = await createClient()

  // 1. Fetch existing stakeholders
  const { data: existingStakeholders } = await supabase
    .from('stakeholders')
    .select('id, name, organization_type, linked_user_id, role_title, influence, interest, sub_category, profiles(full_name, email)')
    .eq('project_id', projectId)
    .order('name', { ascending: true })

  let stakeholdersList = existingStakeholders ? [...existingStakeholders] : []

  // 2. Fetch project members
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, project_role_title')
    .eq('project_id', projectId)

  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id).filter(Boolean)
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [] }

    let addedNew = false
    for (const m of members) {
      if (!m.user_id) continue
      const alreadyExists = stakeholdersList.some(s => s.linked_user_id === m.user_id)
      if (!alreadyExists) {
        const prof = (profiles || []).find(p => p.id === m.user_id)
        const name = prof?.full_name?.trim() || prof?.email || 'Project Member'
        const email = prof?.email || null

        await supabase
          .from('stakeholders')
          .insert({
            project_id: projectId,
            name: name,
            email: email,
            organization_type: 'internal',
            role_title: m.project_role_title || 'Project Member',
            linked_user_id: m.user_id,
            influence: 3,
            interest: 3,
          })
        addedNew = true
      }
    }

    if (addedNew) {
      const { data: updated } = await supabase
        .from('stakeholders')
        .select('id, name, organization_type, linked_user_id, role_title, influence, interest, sub_category, profiles(full_name, email)')
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      if (updated) stakeholdersList = updated
    }
  }

  return stakeholdersList
}
