import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  transferWorkspaceOwnership,
  updateWorkspaceMemberRole,
  updateWorkspaceMemberActiveStatus,
  removeWorkspaceMember,
  updateWorkspaceMemberAdminPrivilege,
  updateProfileName,
} from '@/lib/workspace/member-actions'
import { deleteWorkspace } from '@/lib/workspace/actions'

export type WorkspaceRole = 'Admin' | 'PM' | 'Team Member' | 'Sponsor' | 'Viewer'

export function useWorkspaceMembers(organizationId: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  
  const [newOwnerId, setNewOwnerId] = useState('')
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null)
  const [ownerNameInput, setOwnerNameInput] = useState('')
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  const handleDeleteWorkspace = () => {
    if (deleteConfirmText !== 'DELETE') return
    setMessage(null)
    startTransition(async () => {
      const result = await deleteWorkspace(organizationId)
      if (result.ok) {
        router.push('/dashboard')
      } else {
        setMessage(result.error ?? 'Failed to delete workspace.')
      }
    })
  }

  const changeRole = (memberUserId: string, role: WorkspaceRole) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberRole(organizationId, memberUserId, role)
      if (result.ok) {
        setMessage('Role updated.')
        router.refresh()
      } else {
        setMessage(result.error)
        router.refresh()
      }
    })
  }

  const transfer = () => {
    if (!newOwnerId || !window.confirm('Transfer ownership? You will remain an Admin.')) return
    setMessage(null)
    startTransition(async () => {
      const result = await transferWorkspaceOwnership(organizationId, newOwnerId)
      setMessage(result.ok ? 'Ownership transferred.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const togglePrivilege = (memberUserId: string, checked: boolean) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberAdminPrivilege(organizationId, memberUserId, checked)
      setMessage(result.ok ? 'Privileges updated.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const toggleStatus = (memberUserId: string, isActive: boolean) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberActiveStatus(organizationId, memberUserId, isActive)
      setMessage(result.ok ? (isActive ? 'Access activated.' : 'Access revoked.') : result.error)
      if (result.ok) router.refresh()
    })
  }

  const removeMember = (memberUserId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return
    setMessage(null)
    startTransition(async () => {
      const result = await removeWorkspaceMember(organizationId, memberUserId)
      setMessage(result.ok ? 'Member removed.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const saveOwnerName = () => {
    if (!ownerNameInput.trim()) return
    setMessage(null)
    startTransition(async () => {
      const result = await updateProfileName(ownerNameInput)
      if (result.ok) {
        setMessage('Profile name updated.')
        setEditingOwnerId(null)
        router.refresh()
      } else {
        setMessage(result.error)
      }
    })
  }

  return {
    isPending,
    message,
    newOwnerId, setNewOwnerId,
    editingOwnerId, setEditingOwnerId,
    ownerNameInput, setOwnerNameInput,
    showDeleteConfirm, setShowDeleteConfirm,
    deleteConfirmText, setDeleteConfirmText,
    isOpen, setIsOpen,
    handleDeleteWorkspace,
    changeRole,
    transfer,
    togglePrivilege,
    toggleStatus,
    removeMember,
    saveOwnerName,
  }
}
