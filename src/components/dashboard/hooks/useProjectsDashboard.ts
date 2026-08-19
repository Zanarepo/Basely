import { useState, useTransition } from 'react'
import { archiveProject, restoreProject, deleteProject } from '@/lib/projects/actions'

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
  assignedMembers: string[]
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

type ToastMessage = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

let toastCounter = 0

export function useProjectsDashboard(
  projects: ProjectType[],
  callerUserId: string,
  isOwner: boolean,
  effectiveRole: string
) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null)
  
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [viewMode, setViewMode] = useState<'list' | 'portfolio' | 'initiation'>('list')
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  
  const [openMemberPickerProjectId, setOpenMemberPickerProjectId] = useState<string | null>(null)
  
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isPending, startTransition] = useTransition()

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    toastCounter++
    const id = String(toastCounter)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const isAdmin = isOwner || effectiveRole === 'Admin'
  const isPM = effectiveRole === 'PM'
  const isViewer = effectiveRole === 'Viewer'
  const isAdminOrPM = isAdmin || isPM

  const canDeleteProject = (project: ProjectType) => {
    return project.createdBy === callerUserId || project.memberPermissions.some(
      (member) => member.userId === callerUserId && member.canDelete
    )
  }

  const canManageProject = (project: ProjectType) => project.createdBy === callerUserId

  const canEditProject = (project: ProjectType) => {
    if (isViewer) return false
    return isOwner || isAdmin || project.createdBy === callerUserId || isPM
  }

  const filteredProjects = projects.filter((p) => {
    const matchesTab = activeTab === 'active' ? !p.isArchived : p.isArchived
    const canSee = p.createdBy === callerUserId || p.assignedMembers.includes(callerUserId)
    const matchesSearch = 
      projectSearchQuery === '' || 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(projectSearchQuery.toLowerCase()))

    return matchesTab && canSee && matchesSearch
  })

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return {
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
    isAdmin, isPM, isViewer, isAdminOrPM,
    canDeleteProject, canManageProject, canEditProject,
    filteredProjects,
    handleArchive, handleRestore, handleDelete, formatDate
  }
}
