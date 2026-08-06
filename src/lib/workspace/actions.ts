'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ACTIVE_ORG_COOKIE } from './constants'
import { createAdminClient } from '@/utils/supabase/admin'

export async function setActiveWorkspace(organizationId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/dashboard', 'layout')
}

export async function getOwnedWorkspaceCount(): Promise<number> {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  return count ?? 0
}

export async function deleteWorkspace(organizationId: string): Promise<{ ok: boolean; error?: string }> {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const cookieStore = await cookies()
  if (cookieStore.has('zn_impersonation')) {
    return { ok: false, error: 'Destructive actions are blocked during impersonation sessions.' }
  }

  // 1. Verify that the user is the Owner of this organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { ok: false, error: 'Workspace not found' }
  }

  if (org.owner_id !== user.id) {
    return { ok: false, error: 'Only the workspace owner can delete it' }
  }

  // 2. Query remaining memberships to determine what workspace to switch to
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .neq('organization_id', organizationId)

  const adminClient = createAdminClient()
  const gracePeriodEnd = new Date()
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)

  // 3. Schedule the deletion (NDPA/GDPR 30-day grace period)
  const { error: deletionReqError } = await adminClient
    .from('deletion_requests')
    .insert({
      organization_id: organizationId,
      requested_by: user.id,
      grace_period_ends_at: gracePeriodEnd.toISOString(),
      status: 'pending'
    })

  if (deletionReqError) {
    return { ok: false, error: deletionReqError.message }
  }

  // 4. Soft-delete by removing all members so the workspace is immediately inaccessible
  const { error: memberDeleteError } = await adminClient
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)

  if (memberDeleteError) {
    return { ok: false, error: memberDeleteError.message }
  }

  // 5. Update the active workspace cookie
  if (memberships && memberships.length > 0) {
    cookieStore.set(ACTIVE_ORG_COOKIE, memberships[0].organization_id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } else {
    cookieStore.delete(ACTIVE_ORG_COOKIE)
  }

  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function checkWorkspaceCreationLimitAction(): Promise<{ allowed: boolean, reason?: string }> {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, reason: 'Not authenticated' }

  const { checkWorkspaceCreationLimit } = await import('@/lib/organizations/tier-logic')
  const limitResult = await checkWorkspaceCreationLimit(user.id)
  
  return {
    allowed: limitResult.allowed,
    reason: limitResult.reason
  }
}


