'use client'

import {
  Plus,
  FolderOpen,
  Search,
} from 'lucide-react'
import { ProjectWizardModal } from './ProjectWizardModal'
import { ProjectEditModal } from './ProjectEditModal'
import { ProjectCard } from './ProjectCard'
import { ToastContainer } from './Toast'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import PortfolioWorkspace from './projects/PortfolioWorkspace'
import InitiationWorkspace from './initiation/InitiationWorkspace'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { ManualPlanSwitcher, UsageProgressMeter, UpgradePromptModal, FeatureGateScreen } from './billing'
import { BusinessCase, FeasibilityStudy } from '@/lib/initiation/actions'
import { useProjectsDashboard } from './hooks/useProjectsDashboard'
import { ProjectMemberPickerModal } from './ProjectMemberPickerModal'

type ProjectType = {
  id: string
  name: string
  clientName: string | null
  description: string | null
  methodology: 'Waterfall' | 'Agile' | 'Hybrid'
  currency: string
  startDate: string | null
  endDate: string | null
  isArchived: boolean
  isLocked?: boolean
  createdBy: string | null
  assignedMembers: string[] // List of userIds
  memberPermissions: { userId: string; canDelete: boolean }[]
  pendingStakeholders?: { email: string; name: string; role_title: string }[]
  calendarConfig: {
    working_days: number[]
    daily_hours: number
  }
  allow_team_schedule_edits: boolean
}

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
  isOwner: boolean
}

type ProjectsDashboardProps = {
  organizationId: string
  projects: ProjectType[]
  workspaceMembers: WorkspaceMember[]
  callerUserId: string
  isOwner: boolean
  callerRole: string
  callerCanManageAll: boolean
  businessCases: BusinessCase[]
  feasibilityStudies: FeasibilityStudy[]
  orgFeatures: Record<string, boolean>
}

export function ProjectsDashboard({
  organizationId,
  projects,
  workspaceMembers,
  callerUserId,
  isOwner,
  callerRole,
  businessCases,
  feasibilityStudies,
  orgFeatures,
}: ProjectsDashboardProps) {
  const { activeWorkspace } = useWorkspace()
  const { tier, switchPlan } = useWorkspaceTier(organizationId)
  
  const effectiveRole = activeWorkspace.role ?? callerRole

  const {
    upgradeModalOpen, setUpgradeModalOpen,
    wizardOpen, setWizardOpen,
    editOpen, setEditOpen,
    selectedProject, setSelectedProject,
    activeTab, setActiveTab,
    viewMode, setViewMode,
    projectSearchQuery, setProjectSearchQuery,
    openMemberPickerProjectId, setOpenMemberPickerProjectId,
    toasts, showToast, dismissToast,
    isPending,
    isAdmin, isViewer, isAdminOrPM,
    canDeleteProject, canManageProject, canEditProject,
    filteredProjects,
    handleArchive, handleRestore, handleDelete, formatDate
  } = useProjectsDashboard(projects, callerUserId, isOwner, effectiveRole)

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification HUD */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-app-fg">Projects</h2>
          <p className="text-sm text-app-muted">
            {isViewer
              ? 'View project details and team assignments.'
              : 'Manage your project containers and baseline schedules.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active / Archived Tab Toggles (Only visible to Admins/Owners since they manage retrieval) */}
          {isAdmin && viewMode === 'list' && (
            <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1 text-xs font-semibold mr-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-violet-500/15 text-violet-500 dark:text-violet-300 border border-violet-500/25 shadow-sm'
                    : 'text-slate-600 dark:text-app-muted hover:text-app-fg'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('archived')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'archived'
                    ? 'bg-violet-500/15 text-violet-500 dark:text-violet-300 border border-violet-500/25 shadow-sm'
                    : 'text-slate-600 dark:text-app-muted hover:text-app-fg'
                }`}
              >
                Archived
              </button>
            </div>
          )}

          {isAdminOrPM && (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-primary px-4"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Subscription Tier Engine & Live Testing Overrides (Sprint 29) */}
      {isAdmin && (
        <div>
          <ManualPlanSwitcher organizationId={organizationId}>
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <UsageProgressMeter
                  label="Active Projects Quota"
                  current={projects.filter((p) => !p.isArchived).length}
                  max={tier === 'free' ? 3 : -1}
                  onUpgrade={() => setUpgradeModalOpen(true)}
                />
                <UsageProgressMeter
                  label="Assigned Edit-level Seats"
                  current={workspaceMembers.filter((m) => m.role === 'PM' || m.role === 'Admin' || m.isOwner).length}
                  max={tier === 'free' ? 3 : -1}
                  onUpgrade={() => setUpgradeModalOpen(true)}
                />
              </div>
            )}
          </ManualPlanSwitcher>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="border-b border-app-border flex space-x-6">
        <button
          onClick={() => setViewMode('list')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            viewMode === 'list'
              ? 'border-violet-500 text-violet-500 font-bold'
              : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
          }`}
        >
          Projects List
        </button>
        <button
          onClick={() => setViewMode('portfolio')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            viewMode === 'portfolio'
              ? 'border-violet-500 text-violet-500 font-bold'
              : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
          }`}
        >
          Portfolio Health
        </button>
        <button
          onClick={() => setViewMode('initiation')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            viewMode === 'initiation'
              ? 'border-violet-500 text-violet-500 font-bold'
              : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
          }`}
        >
          Initiation / Ideas
        </button>
      </div>

      {viewMode === 'initiation' ? (
        !orgFeatures['foundation.workspace'] ? (
          <FeatureGateScreen
            featureName="Initiation & Business Cases"
            description="Manage business cases, feasibility studies and project ideation before full project kick-off. Available on the Premium plan."
            canUpgrade={isAdmin}
          />
        ) : (
          <InitiationWorkspace 
            organizationId={organizationId}
            businessCases={businessCases}
            feasibilityStudies={feasibilityStudies}
            callerUserId={callerUserId}
            isOwner={isOwner}
            callerRole={callerRole}
            projects={projects}
          />
        )
      ) : viewMode === 'portfolio' ? (
        !orgFeatures['reporting.analytics'] ? (
          <FeatureGateScreen
            featureName="Portfolio Health"
            description="Aggregate EVM metrics, budget burn, schedule variance and risk heatmaps across all your projects. Available on the Premium plan."
            canUpgrade={isAdmin}
          />
        ) : (
          <PortfolioWorkspace projects={projects} />
        )
      ) : (
        <>
          {/* Search Filter Row */}
          <div className="flex w-full sm:w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
              <input
                type="text"
                placeholder="Search projects by name or description..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-app-fg"
              />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            /* Empty State Card */
            <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-500 mb-4">
                <FolderOpen className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-app-fg mb-1">
                {activeTab === 'active' ? 'No projects initialized' : 'No archived projects'}
              </h3>
              <p className="text-sm text-app-muted max-w-sm mb-6 leading-relaxed">
                {activeTab === 'active'
                  ? 'Create a project container to establish your cost estimation baseline and methodology tracking.'
                  : 'Archived projects can be restored or permanently deleted from here.'}
              </p>
              {activeTab === 'active' && isAdminOrPM && (
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="btn-primary px-5"
                >
                  <Plus className="h-4 w-4" />
                  Create First Project
                </button>
              )}
            </div>
          ) : (
            <section className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6">
              <div className="space-y-3">
              {filteredProjects.map((project) => {
                const hasManageAccess = canManageProject(project)
                const hasEditAccess = canEditProject(project)
                const hasDeleteAccess = canDeleteProject(project)

                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    workspaceMembers={workspaceMembers}
                    isViewer={isViewer}
                    hasEditAccess={hasEditAccess}
                    hasManageAccess={hasManageAccess}
                    hasDeleteAccess={hasDeleteAccess}
                    isPending={isPending}
                    onEdit={() => {
                      setSelectedProject(project)
                      setEditOpen(true)
                    }}
                    onArchive={() => handleArchive(project)}
                    onRestore={() => handleRestore(project)}
                    onDelete={() => handleDelete(project)}
                    onManageTeam={() => setOpenMemberPickerProjectId(project.id)}
                    onUnlockRequest={() => setUpgradeModalOpen(true)}
                    canUpgrade={isAdmin}
                    formatDate={formatDate}
                  />
                )
              })}
              </div>
            </section>
          )}
        </>
      )}

      {openMemberPickerProjectId && (
        <ProjectMemberPickerModal
          project={projects.find((p) => p.id === openMemberPickerProjectId) || null}
          workspaceMembers={workspaceMembers}
          onClose={() => setOpenMemberPickerProjectId(null)}
          onSuccess={() => setOpenMemberPickerProjectId(null)}
          onShowToast={showToast}
        />
      )}

      {/* Initiation Wizard Modal */}
      <ProjectWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        organizationId={organizationId}
      />

      {/* Edit Modal */}
      <ProjectEditModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
      />

      <UpgradePromptModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentTier={tier}
        organizationId={organizationId}
        onSelectTier={(t) => switchPlan(t)}
      />
    </div>
  )
}
