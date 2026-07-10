import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import type { Workspace } from '@/components/dashboard/WorkspaceContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Phase 1: base membership query — always works (no new columns)
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, owner_id)')
    .eq('user_id', user.id)

  if (!memberships?.length) {
    redirect('/onboarding')
  }

  // Phase 2: Try to read is_active for each membership (available after RBAC migration).
  // If the column doesn't exist yet, we treat all as active so the switcher still works.
  const { data: activeFlags } = await supabase
    .from('organization_members')
    .select('organization_id, is_active')
    .eq('user_id', user.id)
  // Build a lookup: orgId → isActive (defaults to true if column is missing)
  const activeFlagMap: Record<string, boolean> = {}
  for (const row of (activeFlags ?? [])) {
    activeFlagMap[row.organization_id] = (row as Record<string, unknown>).is_active !== false
  }

  const workspaces: Workspace[] = memberships.map((m) => {
    // Supabase may infer the joined relation as an array union — unwrap safely
    const raw = m.organizations
    const orgObj = Array.isArray(raw) ? raw[0] : raw
    const org =
      orgObj && typeof orgObj === 'object' && 'name' in orgObj
        ? (orgObj as unknown as { id: string; name: string; owner_id: string })
        : null
    return {
      id: m.organization_id,
      name: org?.name ?? 'Workspace',
      role: m.role,
      isOwner: org?.owner_id === user.id,
      isActive: activeFlagMap[m.organization_id] ?? true,
    }
  })

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const activeWorkspace =
    workspaces.find((w) => w.id === cookieOrgId) ??
    workspaces.find((w) => w.isActive) ??
    workspaces[0]

  // Filter workspaces passed to the switcher to only show active ones
  const activeWorkspaces = workspaces.filter((w) => w.isActive)

  return (
    <DashboardShell
      workspaces={activeWorkspaces}
      activeWorkspace={activeWorkspace}
      userEmail={user.email ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
