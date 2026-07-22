'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ACTIVE_ORG_COOKIE } from './constants'

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

  // 3. Delete the organization (dependent tables will cascade delete)
  const { error: deleteError } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  // 4. Update the active workspace cookie
  const cookieStore = await cookies()
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


