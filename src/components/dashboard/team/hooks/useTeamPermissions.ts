import { useState } from 'react'
import { updateProjectMemberPermissions, bulkUpdateProjectMemberPermissions, UpdatePermissionsPayload } from '@/lib/projects/permissions-actions'

export type ToastMessage = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type ProjectMemberData = {
  user_id: string
  can_edit_schedule: boolean
  can_edit_cost: boolean
  can_edit_risks: boolean
  can_edit_documents: boolean
  project_role_title: string | null
}

export function useTeamPermissions(
  projectId: string,
  workspaceMembers: WorkspaceMember[],
  projectMembersData: ProjectMemberData[],
  hasEditAccess: boolean
) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editState, setEditState] = useState<UpdatePermissionsPayload | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const membersWithPermissions = workspaceMembers.map(wm => {
    const pm = (projectMembersData || []).find(p => p.user_id === wm.userId)
    const isAssigned = !!pm
    return {
      ...wm,
      isAssigned,
      permissions: {
        can_edit_schedule: pm?.can_edit_schedule || false,
        can_edit_cost: pm?.can_edit_cost || false,
        can_edit_risks: pm?.can_edit_risks || false,
        can_edit_documents: pm?.can_edit_documents || false,
        project_role_title: pm?.project_role_title || ''
      }
    }
  }).sort((a, b) => Number(b.isAssigned) - Number(a.isAssigned))

  const filteredMembers = membersWithPermissions.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectUser = (userId: string) => {
    const next = new Set(selectedUserIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedUserIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredMembers.map(m => m.userId)))
    }
  }

  const handleEditClick = (userId: string, currentPerms: UpdatePermissionsPayload) => {
    if (!hasEditAccess) return
    setEditingUserId(userId)
    setEditState({ ...currentPerms })
  }

  const handleCancel = () => {
    setEditingUserId(null)
    setEditState(null)
  }

  const handleSave = async (userId: string) => {
    if (!editState || !hasEditAccess) return
    setIsSaving(true)
    try {
      const res = await updateProjectMemberPermissions(projectId, userId, editState)
      if (res.ok) {
        showToast('success', 'Permissions updated successfully')
        setEditingUserId(null)
        setEditState(null)
      } else {
        showToast('error', res.error || 'Failed to update permissions')
      }
    } catch (err) {
      showToast('error', 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const startBulkEdit = () => {
    if (!hasEditAccess || selectedUserIds.size === 0) return
    setEditingUserId('bulk')
    setEditState({
      can_edit_schedule: false,
      can_edit_cost: false,
      can_edit_risks: false,
      can_edit_documents: false,
      project_role_title: ''
    })
  }

  const handleBulkSave = async () => {
    if (!editState || !hasEditAccess || selectedUserIds.size === 0) return
    setIsSaving(true)
    try {
      const res = await bulkUpdateProjectMemberPermissions(projectId, Array.from(selectedUserIds), editState)
      if (res.ok) {
        showToast('success', `Permissions updated for ${selectedUserIds.size} members`)
        setEditingUserId(null)
        setEditState(null)
        setSelectedUserIds(new Set())
      } else {
        showToast('error', res.error || 'Failed to bulk update permissions')
      }
    } catch (err) {
      showToast('error', 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    editingUserId,
    editState, setEditState,
    isSaving,
    toasts,
    dismissToast,
    searchQuery, setSearchQuery,
    selectedUserIds,
    filteredMembers,
    toggleSelectUser,
    toggleSelectAll,
    handleEditClick,
    handleCancel,
    handleSave,
    startBulkEdit,
    handleBulkSave
  }
}
