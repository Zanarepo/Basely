'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { projectSchema } from '@/lib/validations/projects'
import { logProjectActivity } from './activity-actions'

export type ActionResponse = { ok: true } | { ok: false; error: string }
export type CreateProjectResult = { ok: true; id: string } | { ok: false; error: string }

// Helper function to check if the user is authorized to manage/edit/delete/archive
async function getProjectAuthorization(projectId: string, userId: string) {
  const supabase = await createClient()

  // Get project information
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id, created_by, is_archived')
    .eq('id', projectId)
    .single()

  if (!project) return { isAuthorized: false, orgId: '', createdBy: '', isArchived: false }

  // Get workspace owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', project.organization_id)
    .single()

  // Get user role in org
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, is_active')
    .eq('organization_id', project.organization_id)
    .eq('user_id', userId)
    .single()

  const isOwner = org?.owner_id === userId
  const isAdmin = isOwner || (member?.is_active && member.role === 'Admin')
  const isPM = member?.is_active && member.role === 'PM'
  const isCreator = project.created_by === userId

  // Check if assigned project member
  const { data: projMember } = await supabase
    .from('project_members')
    .select('id, can_delete')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()
  const isAssignedMember = !!projMember

  const isViewer = member?.is_active && member.role === 'Viewer'
  const isTeamMember = member?.is_active && member.role === 'Team Member'

  return {
    isOwner,
    isAdmin,
    isPM,
    isViewer,
    isTeamMember,
    isCreator,
    isAssignedMember,
    canDelete: projMember?.can_delete === true,
    orgId: project.organization_id,
    isArchived: project.is_archived
  }
}

export async function createProject(
  organizationId: string,
  payload: z.infer<typeof projectSchema>
): Promise<CreateProjectResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  const parseResult = projectSchema.safeParse(payload)
  if (!parseResult.success) {
    return { ok: false, error: parseResult.error.issues[0]?.message || 'Invalid input data' }
  }

  const data = parseResult.data

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, is_active')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .single()

  const isOwner = org?.owner_id === user.id
  const isAdminOrPM = isOwner || (member?.is_active && (member.role === 'Admin' || member.role === 'PM'))

  if (!isAdminOrPM) {
    return { ok: false, error: 'Unauthorized: Only Owners, Admins, and PMs can initiate projects.' }
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: data.name,
      client_name: data.clientName || null,
      description: data.description || null,
      methodology: data.methodology,
      currency: data.currency,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      calendar_config: data.calendarConfig,
      allow_team_schedule_edits: data.allowTeamScheduleEdits,
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await logProjectActivity(project.id, 'project', project.id, 'created', { name: data.name })

  revalidatePath('/dashboard')
  return { ok: true, id: project.id }
}

export async function updateProject(
  projectId: string,
  payload: z.infer<typeof projectSchema>
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const parseResult = projectSchema.safeParse(payload)
  if (!parseResult.success) {
    return { ok: false, error: parseResult.error.issues[0]?.message || 'Invalid input data' }
  }

  const authState = await getProjectAuthorization(projectId, user.id)
  
  // Viewers are read-only. PMs, Team Members (when assigned), Admins, and creators may update.
  const canUpdate =
    !authState.isViewer &&
    (authState.isAdmin ||
      authState.isCreator ||
      (!authState.isArchived &&
        (authState.isPM ||
          (authState.isAssignedMember && authState.isTeamMember))))

  if (!canUpdate) {
    return { ok: false, error: 'Unauthorized: You do not have permissions to edit this project.' }
  }

  const data = parseResult.data
  const { error } = await supabase
    .from('projects')
    .update({
      name: data.name,
      client_name: data.clientName || null,
      description: data.description || null,
      methodology: data.methodology,
      currency: data.currency,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      calendar_config: data.calendarConfig,
      allow_team_schedule_edits: data.allowTeamScheduleEdits
    })
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }

  await logProjectActivity(projectId, 'project', projectId, 'updated', { name: data.name })

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteProject(projectId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)

  // Deletion is intentionally project-scoped: roles alone never grant it.
  const canDelete = authState.isCreator || authState.canDelete

  if (!canDelete) {
    return { ok: false, error: 'Unauthorized: The project creator has not granted you permission to delete this project.' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function archiveProject(projectId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)
  const canArchive = authState.isAdmin || authState.isCreator

  if (!canArchive) {
    return { ok: false, error: 'Unauthorized: Only Owners, Admins, or the Project Creator can archive this project.' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_archived: true })
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }

  await logProjectActivity(projectId, 'project', projectId, 'updated', { is_archived: true })

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function restoreProject(projectId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)
  const canRestore = authState.isAdmin || authState.isCreator

  if (!canRestore) {
    return { ok: false, error: 'Unauthorized: Only Owners, Admins, or the Project Creator can restore this project.' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_archived: false })
    .eq('id', projectId)

  if (error) return { ok: false, error: error.message }

  await logProjectActivity(projectId, 'project', projectId, 'updated', { is_archived: false })

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function assignProjectMember(projectId: string, memberUserId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)
  const canManage = authState.isCreator

  if (!canManage) {
    return { ok: false, error: 'Unauthorized: You do not have permission to manage members for this project.' }
  }

  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: memberUserId })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function removeProjectMember(projectId: string, memberUserId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)
  const canManage = authState.isAdmin || authState.isPM || authState.isCreator

  if (!canManage) {
    return { ok: false, error: 'Unauthorized: You do not have permission to manage members for this project.' }
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', memberUserId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export type ProjectMemberAssignment = { userId: string; canDelete: boolean }

export async function updateProjectMembers(projectId: string, members: ProjectMemberAssignment[]): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const authState = await getProjectAuthorization(projectId, user.id)
  const canManage = authState.isCreator

  if (!canManage) {
    return { ok: false, error: 'Unauthorized: Only the project creator can manage project member permissions.' }
  }

  // Replace assignments and their project-level delete grants together.
  // Delete all members
  const { error: deleteError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)

  if (deleteError) return { ok: false, error: deleteError.message }

  // Insert selected members with their explicit delete grant.
  if (members.length > 0) {
    const { error: insertError } = await supabase
      .from('project_members')
      .insert(members.map((member) => ({ project_id: projectId, user_id: member.userId, can_delete: member.canDelete })))

    if (insertError) return { ok: false, error: insertError.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
