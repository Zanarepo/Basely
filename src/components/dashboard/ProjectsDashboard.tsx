'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  FolderOpen,
  Users,
  CheckCircle,
  X,
  UserPlus,
  Search,
} from 'lucide-react'
import { ProjectWizardModal } from './ProjectWizardModal'
import { ProjectEditModal } from './ProjectEditModal'
import { ProjectCard } from './ProjectCard'
import { ToastContainer, type ToastMessage } from './Toast'
import { useWorkspace } from './WorkspaceContext'
import {
  archiveProject,
  restoreProject,
  deleteProject,
  updateProjectMembers,
} from '@/lib/projects/actions'

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
  createdBy: string | null
  assignedMembers: string[] // List of userIds
  memberPermissions: { userId: string; canDelete: boolean }[]
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
}

export function ProjectsDashboard({
  organizationId,
  projects,
  workspaceMembers,
  callerUserId,
  isOwner,
  callerRole,
  callerCanManageAll,
}: ProjectsDashboardProps) {
  const { activeWorkspace } = useWorkspace()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null)
  
  // Show active vs archived projects tab
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  
  // Member assignment dropdown state: project ID that currently has its member picker open
  const [openMemberPickerProjectId, setOpenMemberPickerProjectId] = useState<string | null>(null)
  // Local state for checking/unchecking members in picker before applying
  const [selectedPickerUserIds, setSelectedPickerUserIds] = useState<string[]>([])
  const [deletePermissionUserIds, setDeletePermissionUserIds] = useState<string[]>([])
  // Search query for member picker modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // Notification Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isPending, startTransition] = useTransition()

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Permissions helpers — use workspace context role as source of truth for UI gating
  const effectiveRole = activeWorkspace.role ?? callerRole
  const isAdmin = isOwner || effectiveRole === 'Admin'
  const isPM = effectiveRole === 'PM'
  const isViewer = effectiveRole === 'Viewer'
  const isAdminOrPM = isAdmin || isPM

  // Deletion is never inherited from a workspace role. It is creator-only
  // unless that creator explicitly grants an assigned member this permission.
  const canDeleteProject = (project: ProjectType) => {
    return project.createdBy === callerUserId || project.memberPermissions.some(
      (member) => member.userId === callerUserId && member.canDelete
    )
  }

  // Only the creator controls this project's membership and delete grants.
  const canManageProject = (project: ProjectType) => project.createdBy === callerUserId

  // Who can EDIT a project:
  // - NOT Viewers (ever)
  // - Creator, Owner, Admins, or PMs
  const canEditProject = (project: ProjectType) => {
    if (isViewer) return false
    return isOwner || isAdmin || project.createdBy === callerUserId || isPM
  }

  // Search query for projects
  const [projectSearchQuery, setProjectSearchQuery] = useState('')

  // Filter projects by active tab and read permissions
  const filteredProjects = projects.filter((p) => {
    const matchesTab = activeTab === 'active' ? !p.isArchived : p.isArchived
    
    // Strict isolation rule: only creators or assigned members can see the project card
    const canSee = p.createdBy === callerUserId || p.assignedMembers.includes(callerUserId)
    
    // Name or Description search filter
    const matchesSearch = 
      projectSearchQuery === '' || 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(projectSearchQuery.toLowerCase()))

    return matchesTab && canSee && matchesSearch
  })

  // Action handlers
  const handleArchive = (project: ProjectType) => {
    if (!window.confirm(`Are you sure you want to archive "${project.name}"? Only Admins can restore it.`)) return
    startTransition(async () => {
      const result = await archiveProject(project.id)
      if (result.ok) {
        showToast('success', `Project "${project.name}" archived successfully`)
      } else {
        showToast('error', result.error)
      }
    })
  }

  const handleRestore = (project: ProjectType) => {
    startTransition(async () => {
      const result = await restoreProject(project.id)
      if (result.ok) {
        showToast('success', `Project "${project.name}" restored successfully`)
      } else {
        showToast('error', result.error)
      }
    })
  }

  const handleDelete = (project: ProjectType) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${project.name}"? This action is irreversible.`)) return
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.ok) {
        showToast('success', `Project "${project.name}" deleted successfully`)
      } else {
        showToast('error', result.error)
      }
    })
  }

  const openMemberPicker = (project: ProjectType) => {
    setOpenMemberPickerProjectId(project.id)
    setSelectedPickerUserIds(project.assignedMembers)
    setDeletePermissionUserIds(project.memberPermissions.filter((member) => member.canDelete).map((member) => member.userId))
    setMemberSearchQuery('')
  }

  const handleTogglePickerMember = (memberUserId: string) => {
    setSelectedPickerUserIds((prev) =>
      prev.includes(memberUserId)
        ? prev.filter((id) => id !== memberUserId)
        : [...prev, memberUserId]
    )
  }

  const toggleDeletePermission = (userId: string) => {
    setDeletePermissionUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId])
  }

  const handleSaveAssignments = (project: ProjectType) => {
    startTransition(async () => {
      const result = await updateProjectMembers(project.id, selectedPickerUserIds.map((userId) => ({
        userId,
        canDelete: deletePermissionUserIds.includes(userId),
      })))
      if (result.ok) {
        showToast('success', `Project team assignments updated for "${project.name}"`)
        setOpenMemberPickerProjectId(null)
      } else {
        showToast('error', result.error)
      }
    })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

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
          {isAdmin && (
            <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1 text-xs font-semibold mr-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-app-surface-solid text-app-fg border border-app-border shadow-sm'
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
                    ? 'bg-app-surface-solid text-app-fg border border-app-border shadow-sm'
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

      {/* Search Filter Row */}
      <div className="flex w-full sm:w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={projectSearchQuery}
            onChange={(e) => setProjectSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-app-fg"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        /* Empty State Card */
        <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
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
                onManageTeam={() => openMemberPicker(project)}
                formatDate={formatDate}
              />
            )
          })}
          </div>
        </section>
      )}

      {/* Assign Members Modal — centered overlay */}
      {openMemberPickerProjectId && (() => {
        const targetProject = projects.find((p) => p.id === openMemberPickerProjectId)
        if (!targetProject) return null
        const filteredMembers = workspaceMembers.filter((m) => {
          if (!memberSearchQuery.trim()) return true
          const q = memberSearchQuery.toLowerCase()
          return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        })
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setOpenMemberPickerProjectId(null) }}
              />

              <div className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden auth-card !p-0 shadow-2xl animate-fade-in">
                <div className="shrink-0 px-6 pt-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-500">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-app-fg">Assign Project Team</h2>
                        <p className="text-sm text-app-muted truncate">{targetProject.name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenMemberPickerProjectId(null)}
                      className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="auth-input pl-10"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {filteredMembers.length === 0 ? (
                      <p className="text-sm text-app-subtle italic text-center py-6">No members match your search</p>
                    ) : (
                      filteredMembers.map((m) => {
                        const isChecked = selectedPickerUserIds.includes(m.userId)
                        const initials = m.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleTogglePickerMember(m.userId)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-app-muted hover:text-app-fg hover:bg-app-hover rounded-xl text-left cursor-pointer transition-all disabled:opacity-50"
                          >
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20 shrink-0">
                              {initials}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-app-fg truncate">{m.name}</p>
                              <p className="text-xs text-app-subtle truncate">{m.email} · {m.role}</p>
                            </div>
                            {isChecked ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <span className="h-4 w-4 border-2 border-app-border rounded-full shrink-0" />
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>

                  {selectedPickerUserIds.length > 0 && (
                    <div className="border-t border-app-border pt-4 space-y-2">
                      <p className="auth-label">Project delete permission</p>
                      <p className="text-xs text-app-muted">Only members explicitly enabled here can delete this project. Their workspace role does not grant this access.</p>
                      <div className="space-y-2">
                        {selectedPickerUserIds.map((userId) => {
                          const member = workspaceMembers.find((item) => item.userId === userId)
                          if (!member) return null
                          return (
                            <label key={userId} className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-muted-surface px-3 py-2.5 cursor-pointer">
                              <span className="min-w-0 text-sm font-medium text-app-fg truncate">{member.name}</span>
                              <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-app-muted">
                                <input type="checkbox" checked={deletePermissionUserIds.includes(userId)} onChange={() => toggleDeletePermission(userId)} disabled={isPending} className="h-4 w-4 accent-indigo-600" />
                                Can delete
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-between border-t border-app-border px-6 py-4 mt-2 bg-app-surface-solid/80">
                  <span className="text-xs text-app-subtle">{selectedPickerUserIds.length} selected</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenMemberPickerProjectId(null)}
                      disabled={isPending}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAssignments(targetProject)}
                      disabled={isPending}
                      className="btn-primary"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
    </div>
  )
}
