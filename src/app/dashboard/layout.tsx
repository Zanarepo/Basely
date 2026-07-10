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

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name)')
    .eq('user_id', user.id)

  if (!memberships?.length) {
    redirect('/onboarding')
  }

  const workspaces: Workspace[] = memberships.map((m) => ({
    id: m.organization_id,
    name:
      m.organizations &&
      typeof m.organizations === 'object' &&
      'name' in m.organizations
        ? (m.organizations as { name: string }).name
        : 'Workspace',
    role: m.role,
  }))

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const activeWorkspace =
    workspaces.find((w) => w.id === cookieOrgId) ?? workspaces[0]

  return (
    <DashboardShell
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      userEmail={user.email ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
