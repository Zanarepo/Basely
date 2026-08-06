import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ArrowLeft, Briefcase, Workflow, CalendarRange, Clock, Lock } from 'lucide-react'
import { WbsPlanningWorkspace } from '@/components/dashboard/wbs/WbsPlanningWorkspace'
import GanttWorkspace from '@/components/dashboard/gantt/GanttWorkspace'
import { ReleasesWorkspace } from '@/components/dashboard/releases/ReleasesWorkspace'
import CostWorkspace from '@/components/dashboard/cost/CostWorkspace'
import StakeholderWorkspace from '@/components/dashboard/stakeholders/StakeholderWorkspace'
import RiskRegisterWorkspace from '@/components/dashboard/risks/RiskRegisterWorkspace'
import DocumentsWorkspace from '@/components/dashboard/documents/DocumentsWorkspace'
import TeamPermissionsWorkspace from '@/components/dashboard/team/TeamPermissionsWorkspace'
import { ActionItemsTracker } from '@/components/dashboard/action-items/ActionItemsTracker'
import { ProjectTeamRoster } from '@/components/dashboard/ProjectTeamRoster'
import { ProjectWizardModal } from '@/components/dashboard/ProjectWizardModal'
import { ProjectIntegrationsMenu } from '@/components/dashboard/projects/ProjectIntegrationsMenu'
import { LivePresenceWrapper } from '@/components/dashboard/presence/LivePresenceWrapper'
import ProjectDashboardWorkspace from '@/components/dashboard/projects/ProjectDashboardWorkspace'
import ProjectNavigationTabs from '@/components/dashboard/projects/ProjectNavigationTabs'
import { LifecycleStatusBadge } from '@/components/dashboard/projects/lifecycle/components/LifecycleStatusBadge'
import RaidWorkspace from '@/components/dashboard/risks/raid/RaidWorkspace'
import AdrWorkspace from '@/components/dashboard/projects/adr/AdrWorkspace'
import SkillsMatrixTable from '@/components/dashboard/team/capacity/SkillsMatrixTable'
import { FeatureGateScreen } from '@/components/dashboard/billing'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { getOrganizationFeatures } from '@/lib/organizations/tier-access'

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

  // 1. Fetch project with RLS enforcement (with fallback if is_locked migration hasn't run yet)
  let { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, client_name, description, methodology, currency, start_date, end_date, calendar_config, is_archived, organization_id, created_by, allow_team_schedule_edits, lifecycle_status, is_locked')
    .eq('id', id)
    .maybeSingle()

  if (projectError && !project) {
    const fallback = await supabase
      .from('projects')
      .select('id, name, client_name, description, methodology, currency, start_date, end_date, calendar_config, is_archived, organization_id, created_by, allow_team_schedule_edits, lifecycle_status')
      .eq('id', id)
      .maybeSingle()
    if (fallback.data) {
      project = { ...fallback.data, is_locked: false }
      projectError = null
    }
  }

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
      .select('user_id, can_edit_schedule, can_edit_cost, can_edit_risks, can_edit_documents, project_role_title')
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
  
  const isLockedOrArchived = project.is_archived || project.is_locked

  // Base edit access (Admins, PMs, Creators, Owners have global access)
  const baseEditAccess =
    (isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    callerRole === 'PM') && !isLockedOrArchived

  // Specific granular access overrides
  const callerProjectMember = projectMembersData?.find(pm => pm.user_id === user.id)
  const hasScheduleEditAccess = (baseEditAccess || !!callerProjectMember?.can_edit_schedule) && !isLockedOrArchived
  const hasCostEditAccess = (baseEditAccess || !!callerProjectMember?.can_edit_cost) && !isLockedOrArchived
  const hasRisksEditAccess = (baseEditAccess || !!callerProjectMember?.can_edit_risks) && !isLockedOrArchived
  const hasDocumentsEditAccess = (baseEditAccess || !!callerProjectMember?.can_edit_documents) && !isLockedOrArchived

  const isManager = baseEditAccess || 
    (callerProjectMember?.project_role_title?.toLowerCase().includes('manager') ?? false) || 
    (callerProjectMember?.project_role_title?.toLowerCase().includes('pm') ?? false)

  const canAssignMembers =
    (isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    callerRole === 'PM') && !isLockedOrArchived

  const canViewCost =
    isOrgOwner ||
    callerRole === 'Admin' ||
    isCreator ||
    callerRole === 'PM' ||
    !!callerProjectMember?.can_edit_cost

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Fetch workspace subscription tier for feature gating
  const subscription = await getOrganizationSubscription(project.organization_id)
  const tier = subscription.tierId
  const orgFeatures = await getOrganizationFeatures(project.organization_id)
  const canUpgrade = isOrgOwner || callerRole === 'Admin'

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

      {project.is_locked && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/80 via-rose-900/70 to-red-900/80 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🔒</span>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-rose-200">PROJECT LOCKED IN READ-ONLY MODE</h4>
              <p className="text-xs sm:text-sm text-red-100/90 font-medium">
                This project exceeds your workspace&apos;s Free plan limit of 2 active projects. All task, team, and WBS editing controls are temporarily disabled in read-only mode.
              </p>
            </div>
          </div>
          {isOrgOwner || callerRole === 'Admin' ? (
            <Link
              href="/dashboard"
              style={{ cursor: 'pointer' }}
              className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs rounded-lg shadow whitespace-nowrap transition-transform hover:scale-105 active:scale-95"
            >
              Upgrade on Dashboard ↗
            </Link>
          ) : (
            <span className="px-3.5 py-2 bg-red-900/80 text-rose-200 border border-rose-400/40 font-bold text-xs rounded-lg whitespace-nowrap shadow-inner">
              Contact Admin to Upgrade
            </span>
          )}
        </div>
      )}

      {/* Project Header */}
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-app-fg tracking-tight">{project.name}</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25">
            <Workflow className="h-3.5 w-3.5" />
            {project.methodology}
          </span>
          <LifecycleStatusBadge 
            projectId={project.id} 
            initialStatus={project.lifecycle_status || 'Executing'} 
            canEdit={baseEditAccess && !isLockedOrArchived} 
            showFullStepper={true} 
          />
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
      <ProjectNavigationTabs projectId={project.id} activeTab={activeTab} canViewCost={canViewCost} canViewTeamAccess={canAssignMembers} tier={tier} />

      {/* Conditional tab workspaces */}
      {activeTab === 'dashboard' && (
        <ProjectDashboardWorkspace projectId={project.id} />
      )}

      {activeTab === 'wbs' && (
        <WbsPlanningWorkspace
          projectId={project.id}
          workspaceMembers={workspaceMembers}
          callerUserId={user.id}
          hasEditAccess={hasScheduleEditAccess}
          canAssignMembers={canAssignMembers && !project.is_archived}
          callerRole={callerRole}
          allowTeamScheduleEdits={project.allow_team_schedule_edits}
          currency={project.currency}
        />
      )}

      {activeTab === 'gantt' && (
        <GanttWorkspace
          projectId={project.id}
          hasEditAccess={hasScheduleEditAccess}
          workspaceMembers={workspaceMembers}
          currentUserId={user.id}
          currentUserName={user.user_metadata?.full_name || user.email || 'Unknown'}
        />
      )}

      {activeTab === 'releases' && (!orgFeatures['releases.management'] ? (
        <FeatureGateScreen featureName="Releases & Iterations" description="Plan and track software iterations, release gates, and version milestones. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <ReleasesWorkspace
          projectId={project.id}
          hasEditAccess={hasScheduleEditAccess}
          methodology={project.methodology}
        />
      ))}

      {activeTab === 'cost' && canViewCost && (!orgFeatures['cost.actuals_tracking'] ? (
        <FeatureGateScreen featureName="Budget & Cost" description="Earned Value Management, resource rate configuration, and actual cost tracking. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <CostWorkspace
          projectId={project.id}
          hasEditAccess={hasCostEditAccess}
        />
      ))}

      {activeTab === 'stakeholders' && (!orgFeatures['accountability.raci'] ? (
        <FeatureGateScreen featureName="Stakeholders" description="Map stakeholders, their influence, interest and communication plans. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <StakeholderWorkspace
          projectId={project.id}
          hasEditAccess={canAssignMembers}
          workspaceMembers={workspaceMembers}
        />
      ))}

      {activeTab === 'risks' && (!orgFeatures['accountability.risks'] ? (
        <FeatureGateScreen featureName="Risks & Issues" description="Identify, assess and mitigate project risks and issues with a full risk register. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <RiskRegisterWorkspace
          projectId={project.id}
          hasEditAccess={hasRisksEditAccess}
          workspaceMembers={workspaceMembers}
        />
      ))}

      {activeTab === 'documents' && (!orgFeatures['documentation.engine'] ? (
        <FeatureGateScreen featureName="Documents" description="Live document engine, project charters, status reports, and custom templates. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <DocumentsWorkspace
          projectId={project.id}
          projectContext={project}
          hasEditAccess={hasDocumentsEditAccess}
          isManager={isManager}
        />
      ))}

      {activeTab === 'action_items' && (!orgFeatures['accountability.raci'] ? (
        <FeatureGateScreen featureName="Action Items" description="Track cross-cutting action items, owners and due dates across your project team. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <div className="bg-app-bg border border-app-border rounded-xl shadow-sm h-[calc(100vh-14rem)] min-h-[600px] overflow-hidden mt-6">
          <ActionItemsTracker
            projectId={project.id}
            hasEditAccess={hasDocumentsEditAccess}
          />
        </div>
      ))}

      {activeTab === 'team' && (
        <TeamPermissionsWorkspace
          projectId={project.id}
          workspaceMembers={workspaceMembers}
          projectMembersData={projectMembersData ?? []}
          hasEditAccess={canAssignMembers}
        />
      )}

      {activeTab === 'raid' && (!orgFeatures['pm.adr_skills_raid'] ? (
        <FeatureGateScreen featureName="RAID Command Center" description="Manage Risks, Assumptions, Issues, and Dependencies in a unified command center. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <RaidWorkspace
          projectId={project.id}
          organizationId={project.organization_id || 'default_org'}
          methodology={project.methodology}
        />
      ))}

      {activeTab === 'adr' && (!orgFeatures['pm.adr_skills_raid'] ? (
        <FeatureGateScreen featureName="Architecture Decisions (ADR)" description="Document and track Architecture Decision Records to preserve your team's decision-making history. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <AdrWorkspace
          projectId={project.id}
          organizationId={project.organization_id || 'default_org'}
          methodology={project.methodology}
        />
      ))}

      {activeTab === 'capacity' && (!orgFeatures['pm.adr_skills_raid'] ? (
        <FeatureGateScreen featureName="Skills & Capacity Matrix" description="Visualise your team's skills and available capacity across the project lifecycle. Available on the Premium plan." canUpgrade={canUpgrade} />
      ) : (
        <SkillsMatrixTable
          projectId={project.id}
          organizationId={project.organization_id || 'default_org'}
          methodology={project.methodology}
          workspaceMembers={workspaceMembers}
        />
      ))}
    </div>
  )
}
