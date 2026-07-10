import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { LayoutDashboard } from 'lucide-react'
import {
  WorkspaceMembersPanel,
  type WorkspaceMember,
} from '@/components/dashboard/WorkspaceMembersPanel'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --------------------------------------------------------------------
  // 1️⃣  Find the organization the current user belongs to
  // --------------------------------------------------------------------
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id, can_manage_all_members, organizations(name, owner_id)')
    .eq('user_id', user!.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  const rawOrg = active?.organizations
  const orgObj = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg
  const organization =
    orgObj && typeof orgObj === 'object' && 'name' in orgObj
      ? (orgObj as { name: string; owner_id: string })
      : null
  const orgName = organization?.name ?? 'Your workspace'
  const isOwner = organization?.owner_id === user?.id
  const isAdmin = active?.role === 'Admin' || isOwner

  // --------------------------------------------------------------------
  // 2️⃣  Load all members (simple query – no new RBAC columns)
  // --------------------------------------------------------------------
  let memberList: WorkspaceMember[] = []
  if (isAdmin && active) {
    const { data } = await supabase
      .from('organization_members')
      .select('user_id, role, is_active, added_by, can_manage_all_members, profiles!organization_members_user_id_fkey(full_name, email)')
      .eq('organization_id', active.organization_id)
      .order('created_at')

    memberList = (data ?? []).map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      const email = profile?.email ?? 'unknown'
      return {
        userId: m.user_id as string,
        name: (profile?.full_name?.trim() || email) as string,
        email,
        role: m.role as WorkspaceMember['role'],
        isOwner: m.user_id === organization?.owner_id,
        isActive: m.is_active !== false,
        addedBy: m.added_by,
        canManageAllMembers: m.can_manage_all_members === true,
      }
    })
  }

  // --------------------------------------------------------------------
  // 3️⃣  Render the page
  // --------------------------------------------------------------------
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-app-fg">Dashboard</h1>
          <p className="text-sm text-app-muted">{orgName}</p>
        </div>
      </div>

      {/* Simple info block */}
      <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-8">
        <p className="text-app-muted mb-2">
          Signed in as{' '}
          <span className="text-app-fg font-medium">{user?.email}</span>
        </p>
        <p className="text-sm text-app-subtle">
          Role:{' '}
          <span className="text-indigo-500 dark:text-indigo-400">
            {isOwner ? 'Owner' : active?.role ?? '—'}
          </span>
        </p>
      </div>

      {/* Member panel – only shown to owners / admins */}
      {isAdmin && active && (
        <WorkspaceMembersPanel
          organizationId={active.organization_id}
          members={memberList}
          isOwner={isOwner}
          callerUserId={user!.id}
          callerCanManageAllMembers={(active as any)?.can_manage_all_members === true}
        />
      )}
    </div>
  )
}
