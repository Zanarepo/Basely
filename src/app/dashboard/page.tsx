import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { LayoutDashboard } from 'lucide-react'
import { ProjectsDashboard } from '@/components/dashboard/ProjectsDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // 1️⃣ Find the organization the current user belongs to
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id, can_manage_all_members, organizations(name, owner_id)')
    .eq('user_id', user.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  if (!active) return null

  const rawOrg = active?.organizations
  const orgObj = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg
  const organization =
    orgObj && typeof orgObj === 'object' && 'name' in orgObj
      ? (orgObj as { name: string; owner_id: string })
      : null
  const orgName = organization?.name ?? 'Your workspace'
  const isOwner = organization?.owner_id === user.id
  const isAdminOrPM = isOwner || active?.role === 'Admin' || active?.role === 'PM'

  // 2️⃣ Fetch all workspace projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, name, client_name, description, methodology, currency, start_date, end_date, calendar_config, is_archived, created_by')
    .eq('organization_id', active.organization_id)
    .order('created_at', { ascending: false })

  // 3️⃣ Fetch project membership assignments
  const projectIds = (projectsData ?? []).map((p) => p.id)
  let assignments: Record<string, string[]> = {}
  
  if (projectIds.length > 0) {
    const { data: pmData } = await supabase
      .from('project_members')
      .select('project_id, user_id')
      .in('project_id', projectIds)

    pmData?.forEach((row) => {
      if (!assignments[row.project_id]) assignments[row.project_id] = []
      assignments[row.project_id].push(row.user_id)
    })
  }

  const projects = (projectsData ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client_name,
    description: p.description,
    methodology: p.methodology as 'Waterfall' | 'Agile' | 'Hybrid',
    currency: p.currency,
    startDate: p.start_date,
    endDate: p.end_date,
    isArchived: p.is_archived === true,
    createdBy: p.created_by,
    assignedMembers: assignments[p.id] || [],
    calendarConfig: typeof p.calendar_config === 'string'
      ? JSON.parse(p.calendar_config)
      : p.calendar_config ?? { working_days: [1, 2, 3, 4, 5], daily_hours: 8 },
  }))

  // 4️⃣ Fetch all workspace members for assignment selector
  const { data: orgMembersData } = await supabase
    .from('organization_members')
    .select('user_id, role, is_active, profiles!organization_members_user_id_fkey(full_name, email)')
    .eq('organization_id', active.organization_id)
    .eq('is_active', true)

  const workspaceMembers = (orgMembersData ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const email = profile?.email ?? 'unknown'
    return {
      userId: m.user_id as string,
      name: (profile?.full_name?.trim() || email) as string,
      email,
      role: m.role as string,
      isOwner: m.user_id === organization?.owner_id,
    }
  })

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

      {/* Projects Dashboard */}
      <ProjectsDashboard
        organizationId={active.organization_id}
        projects={projects}
        workspaceMembers={workspaceMembers}
        callerUserId={user.id}
        isOwner={isOwner}
        callerRole={active.role}
        callerCanManageAll={active.can_manage_all_members === true}
      />
    </div>
  )
}
