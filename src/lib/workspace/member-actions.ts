'use server'

import { createClient } from '@/utils/supabase/server'
import { logGovernanceEvent } from '@/lib/governance/actions'

const WORKSPACE_ROLES = ['Admin', 'PM', 'Team Member', 'Viewer'] as const
type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]
export type UpdateWorkspaceRoleResult = { ok: true } | { ok: false; error: string }

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function updateWorkspaceMemberRole(
  organizationId: string, memberUserId: string, role: WorkspaceRole
): Promise<UpdateWorkspaceRoleResult> {
  if (!WORKSPACE_ROLES.includes(role)) return { ok: false, error: 'Invalid workspace role' }
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase.rpc('set_workspace_member_role', {
    p_organization_id: organizationId, p_member_user_id: memberUserId, p_role: role,
  })
  if (error) return { ok: false, error: error.message }
  
  await logGovernanceEvent(organizationId, 'permission_change', {
    action: 'update_role',
    target_user_id: memberUserId,
    new_role: role
  })
  
  return { ok: true }
}

export async function transferWorkspaceOwnership(
  organizationId: string, newOwnerUserId: string
): Promise<UpdateWorkspaceRoleResult> {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase.rpc('transfer_workspace_ownership', {
    p_organization_id: organizationId, p_new_owner_user_id: newOwnerUserId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateWorkspaceMemberActiveStatus(
  organizationId: string, memberUserId: string, isActive: boolean
): Promise<UpdateWorkspaceRoleResult> {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase.rpc('set_member_active_status', {
    p_organization_id: organizationId,
    p_member_user_id: memberUserId,
    p_is_active: isActive,
  })
  if (error) return { ok: false, error: error.message }

  await logGovernanceEvent(organizationId, 'permission_change', {
    action: 'update_active_status',
    target_user_id: memberUserId,
    is_active: isActive
  })

  return { ok: true }
}

export async function removeWorkspaceMember(
  organizationId: string, memberUserId: string
): Promise<UpdateWorkspaceRoleResult> {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase.rpc('remove_workspace_member', {
    p_organization_id: organizationId,
    p_member_user_id: memberUserId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateWorkspaceMemberAdminPrivilege(
  organizationId: string, memberUserId: string, canManageAllMembers: boolean
): Promise<UpdateWorkspaceRoleResult> {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase.rpc('set_admin_privilege', {
    p_organization_id: organizationId,
    p_member_user_id: memberUserId,
    p_can_manage: canManageAllMembers,
  })
  if (error) return { ok: false, error: error.message }

  await logGovernanceEvent(organizationId, 'permission_change', {
    action: 'update_admin_privilege',
    target_user_id: memberUserId,
    can_manage_all_members: canManageAllMembers
  })

  return { ok: true }
}

export async function updateProfileName(
  newName: string
): Promise<UpdateWorkspaceRoleResult> {
  const { supabase, user } = await getAuthenticatedClient()
  if (!user) return { ok: false, error: 'You must be signed in' }
  if (!newName.trim()) return { ok: false, error: 'Profile name cannot be empty' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: newName.trim() })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}