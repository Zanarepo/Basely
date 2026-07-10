import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(name)')
    .eq('user_id', user!.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  const orgName =
    active?.organizations &&
    typeof active.organizations === 'object' &&
    'name' in active.organizations
      ? (active.organizations as { name: string }).name
      : 'Your workspace'

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

      <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-8 transition-colors duration-200">
        <p className="text-app-muted mb-2">
          Signed in as{' '}
          <span className="text-app-fg font-medium">{user?.email}</span>
        </p>
        <p className="text-sm text-app-subtle">
          Role:{' '}
          <span className="text-indigo-500 dark:text-indigo-400">
            {active?.role ?? '—'}
          </span>
        </p>
        <p className="mt-6 text-sm text-app-muted">
          Use the workspace switcher in the sidebar to change context. Project
          cards and the creation wizard arrive in Phase 4.
        </p>
      </div>
    </div>
  )
}
