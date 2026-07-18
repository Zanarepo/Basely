import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Briefcase, Workflow, CalendarRange, Clock, Lock } from 'lucide-react'
import { WbsPlanningWorkspace } from '../../../../components/dashboard/wbs/WbsPlanningWorkspace'
import GanttWorkspace from '../../../../components/dashboard/gantt/GanttWorkspace'

// Planning components type definition
type ProjectPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'wbs'

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
    .select('id, name, client_name, description, methodology, currency, start_date, end_date, calendar_config, is_archived, organization_id, created_by')
    .eq('id', id)
    .maybeSingle()

  if (projectError || !project) {
    if (projectError) {
      console.error('Database project fetch error:', projectError)
    } else {
      console.warn(`Project ID ${id} was not found or blocked by RLS for user ${user.id}`)
    }
    // If not found or RLS blocks it, return 404
    notFound()
  }

  // 2. Fetch project workspace members for owner assignment
  const { data: membersData } = await supabase
    .from('organization_members')
    .select('user_id, role, is_active, profiles!organization_members_user_id_fkey(full_name, email)')
    .eq('organization_id', project.organization_id)
    .eq('is_active', true)

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

  // 3. Fetch caller role in the organization
  const { data: callerMembership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', project.organization_id)
    .eq('user_id', user.id)
    .maybeSingle()

  // 4. Fetch workspace owner to check owner privileges
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', project.organization_id)
    .maybeSingle()

  const isOrgOwner = org?.owner_id === user.id
  const callerRole = callerMembership?.role ?? 'Viewer'
  const isCreator = project.created_by === user.id
  const hasEditAccess =
    isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    (callerRole === 'PM' && !project.is_archived)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
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

      {/* Project Header card */}
      <header className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Briefcase className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-app-fg">{project.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25">
                <Workflow className="h-3 w-3" />
                {project.methodology}
              </span>
              {project.is_archived && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/25">
                  <Lock className="h-3 w-3" />
                  Archived
                </span>
              )}
            </div>
            {project.client_name && (
              <p className="text-sm font-semibold text-app-muted">
                Client: <span className="text-app-fg">{project.client_name}</span>
              </p>
            )}
            {project.description && (
              <p className="text-sm text-app-muted leading-relaxed max-w-3xl">
                {project.description}
              </p>
            )}
          </div>

          {/* Schedule Summary details */}
          <div className="flex flex-col gap-2 p-4 bg-app-muted-surface rounded-2xl border border-app-border md:min-w-[280px]">
            <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">
              Project Schedule
            </p>
            <div className="flex items-center gap-2 text-sm text-app-fg">
              <CalendarRange className="h-4 w-4 text-app-subtle shrink-0" />
              <span>
                {formatDate(project.start_date)} – {formatDate(project.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-app-fg">
              <Clock className="h-4 w-4 text-app-subtle shrink-0" />
              <span>
                {(project.calendar_config as any)?.working_days?.length ?? 5} working days/wk ·{' '}
                {(project.calendar_config as any)?.daily_hours ?? 8}h/day
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs list (WBS is primary in this sprint) */}
      <div className="border-b border-app-border mb-6">
        <nav className="flex space-x-6">
          <Link
            href={`/dashboard/projects/${project.id}?tab=wbs`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'wbs'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Work Breakdown Structure (WBS)
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}?tab=gantt`}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'gantt'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            Gantt & Scheduling
          </Link>
          <span
            className="pb-3 text-sm font-semibold text-app-muted cursor-not-allowed opacity-50"
            title="Coming in Sprint 5"
          >
            Budgeting & EVM
          </span>
        </nav>
      </div>

      {/* Conditional tab workspaces */}
      {activeTab === 'wbs' && (
        <WbsPlanningWorkspace
          projectId={project.id}
          workspaceMembers={workspaceMembers}
          callerUserId={user.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
        />
      )}

      {activeTab === 'gantt' && (
        <GanttWorkspace
          projectId={project.id}
          hasEditAccess={hasEditAccess && !project.is_archived}
          workspaceMembers={workspaceMembers}
        />
      )}
    </div>
  )
}
