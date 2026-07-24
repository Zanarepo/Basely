import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ArrowLeft, Briefcase, Workflow, CalendarRange, Clock, Lock } from 'lucide-react'
import { WbsPlanningWorkspace } from '@/components/dashboard/wbs/WbsPlanningWorkspace'
import GanttWorkspace from '@/components/dashboard/gantt/GanttWorkspace'
import CostWorkspace from '@/components/dashboard/cost/CostWorkspace'
import StakeholderWorkspace from '@/components/dashboard/stakeholders/StakeholderWorkspace'
import RiskRegisterWorkspace from '@/components/dashboard/risks/RiskRegisterWorkspace'
import DocumentsWorkspace from '@/components/dashboard/documents/DocumentsWorkspace'
import { ProjectTeamRoster } from '@/components/dashboard/ProjectTeamRoster'
import { ProjectWizardModal } from '@/components/dashboard/ProjectWizardModal'
import { ProjectIntegrationsMenu } from '@/components/dashboard/projects/ProjectIntegrationsMenu'
import { LivePresenceWrapper } from '@/components/dashboard/presence/LivePresenceWrapper'
import ProjectDashboardWorkspace from '@/components/dashboard/projects/ProjectDashboardWorkspace'

// Planning components type definition
type ProjectPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'dashboard'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Fetch project with RLS enforcement
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, client_name, description, methodology, currency, start_date, end_date, calendar_config, is_archived, organization_id, created_by, allow_team_schedule_edits')
    .eq('id', id)
    .maybeSingle()

  if (projectError || !project) {
    if (projectError) {
      console.error('Database project fetch error:', projectError)
    } else {
      console.warn(`Project ID ${id} was not found or blocked by RLS for user ${user.id}`)
      console.warn('DEBUG: Searching for project ID without RLS to see if it exists...');
      const adminClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
      const { data: debugProj } = await adminClient.from('projects').select('id, name').eq('id', id).single();
      console.warn('DEBUG: admin project result:', debugProj);
    }
    // If not found or RLS blocks it, return 404
    notFound()
  }

  // 2. Fetch project workspace members for owner assignment (bypass RLS so PMs/Team Members can see everyone)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  // 2. Fetch all dependent data in parallel to prevent await waterfalls
  const [
    { data: membersData },
    { data: org },
    { data: callerMembership },
    { data: projectMembersData }
  ] = await Promise.all([
    supabaseAdmin
      .from('organization_members')
      .select('user_id, role, is_active, profiles!organization_members_user_id_fkey(full_name, email)')
      .eq('organization_id', project.organization_id)
      .eq('is_active', true),
    supabase
      .from('organizations')
      .select('owner_id, profiles!organizations_owner_id_fkey(full_name, email)')
      .eq('id', project.organization_id)
      .maybeSingle(),
    supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', project.id)
  ])

  const workspaceMembers = (membersData ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const email = profile?.email ?? 'unknown'
    return {
      userId: m.user_id as string,
      name: (profile?.full_name?.trim() || email) as string,
      email,
      role: m.role as string,
    }
  })

  // 3. Ensure the workspace owner is in the members list
  if (org && org.owner_id) {
    const isOwnerInMembers = workspaceMembers.some(m => m.userId === org.owner_id)
    if (!isOwnerInMembers) {
      const ownerProfile = Array.isArray(org.profiles) ? org.profiles[0] : org.profiles
      workspaceMembers.push({
        userId: org.owner_id,
        name: ownerProfile?.full_name?.trim() || ownerProfile?.email || 'Admin',
        email: ownerProfile?.email || 'unknown',
        role: 'Admin'
      })
    }
  }

  // 4. Map assigned project members
  const assignedUserIds = (projectMembersData ?? []).map(pm => pm.user_id)

  const isOrgOwner = org?.owner_id === user.id
  const callerRole = callerMembership?.role ?? 'Viewer'
  const isCreator = project.created_by === user.id
  const hasEditAccess =
    isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    (callerRole === 'PM' && !project.is_archived)

  const canAssignMembers =
    isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    (callerRole === 'PM' && !project.is_archived)

  const canViewCost =
    isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    callerRole === 'PM'

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-8">
      {/* Back to dashboard button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted hover:text-app-fg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Project Header */}
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-app-fg tracking-tight">{project.name}</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25">
            <Workflow className="h-3.5 w-3.5" />
            {project.methodology}
          </span>
          {project.is_archived && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/25">
              <Lock className="h-3.5 w-3.5" />
              Archived
            </span>
          )}
        </div>
        {project.client_name && (
          <p className="text-sm font-semibold text-app-muted">
            Client: <span className="text-app-fg">{project.client_name}</span>
          </p>
        )}
      </div>

      {(() => {
        const callerMember = workspaceMembers.find(m => m.userId === user.id)
        const callerUserName = callerMember?.name || callerMember?.email || 'Unknown User'
        return (
          <div className="absolute top-0 right-0 z-50 flex items-center gap-3">
            <ProjectIntegrationsMenu projectId={project.id} />
            <LivePresenceWrapper
              projectId={project.id}
              activeTab={activeTab}
              callerUserId={user.id}
              callerUserName={callerUserName}
            />
          </div>
        )
      })()}

      {/* Tabs list */}
      <div className="border-b border-app-border mb-6 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-6 min-w-max pb-1">
          <Link
            href={`/dashboard/projects/${project.id}?tab=dashboard`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}?tab=wbs`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'wbs'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Work Breakdown Structure (WBS)
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}?tab=gantt`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'gantt'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Gantt & Scheduling
          </Link>
          {canViewCost && (
            <Link
              href={`/dashboard/projects/${project.id}?tab=cost`}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'cost'
                  ? 'border-indigo-500 text-indigo-500 font-bold'
                  : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
              }`}
            >
              Budget & Cost
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${project.id}?tab=stakeholders`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'stakeholders'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Stakeholders
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}?tab=risks`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'risks'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Risks & Issues
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}?tab=documents`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Documents
            <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">New</span>
          </Link>
        </nav>
      </div>

      {/* Conditional tab workspaces */}
      {activeTab === 'dashboard' && (
        <ProjectDashboardWorkspace projectId={project.id} />
      )}

      {activeTab === 'wbs' && (
        <WbsPlanningWorkspace
          projectId={project.id}
          workspaceMembers={workspaceMembers}
          callerUserId={user.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
          canAssignMembers={canAssignMembers && !project.is_archived}
          callerRole={callerRole}
          allowTeamScheduleEdits={project.allow_team_schedule_edits}
        />
      )}

      {activeTab === 'gantt' && (
        <GanttWorkspace
          projectId={project.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
          workspaceMembers={workspaceMembers}
        />
      )}

      {activeTab === 'cost' && canViewCost && (
        <CostWorkspace
          projectId={project.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
        />
      )}

      {activeTab === 'stakeholders' && (
        <StakeholderWorkspace
          projectId={project.id}
          hasEditAccess={canAssignMembers}
          workspaceMembers={workspaceMembers}
        />
      )}

      {activeTab === 'risks' && (
        <RiskRegisterWorkspace
          projectId={project.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
          workspaceMembers={workspaceMembers}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsWorkspace
          projectId={project.id}
          projectContext={project}
          hasEditAccess={hasEditAccess && !project.is_archived}
        />
      )}
    </div>
  )
}
