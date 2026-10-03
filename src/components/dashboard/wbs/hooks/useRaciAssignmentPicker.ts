import { useState, useEffect, useMemo, useRef } from 'react'
import { assignRaciRole, removeRaciRole, replaceAccountableRole, getProjectRaciStakeholders } from '@/lib/wbs/raci-actions'
import type { RaciRoleType, RaciAssignment } from '@/lib/wbs/constants'
import type { ActionResponse } from '@/lib/wbs/core-actions'

export type Stakeholder = {
  id: string
  name: string
  organization_type: 'internal' | 'external'
  linked_user_id?: string | null
  role_title?: string | null
  sub_category?: string | null
  influence?: number
  interest?: number
  profiles?: { full_name: string | null; email: string | null } | any
}

interface UseRaciAssignmentPickerProps {
  projectId: string
  wbsElementId: string
  assignments: RaciAssignment[]
  hasEditAccess: boolean
  onAssignmentChanged?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
  callerRole?: string
  callerUserId?: string
}

export function useRaciAssignmentPicker({
  projectId,
  wbsElementId,
  assignments,
  hasEditAccess,
  onAssignmentChanged,
  onShowToast,
  callerRole,
  callerUserId,
}: UseRaciAssignmentPickerProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [openRole, setOpenRole] = useState<RaciRoleType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [localAssignments, setLocalAssignments] = useState<RaciAssignment[]>(assignments)

  useEffect(() => {
    setLocalAssignments(assignments)
  }, [assignments])

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadStakeholders() {
      try {
        const data = await getProjectRaciStakeholders(projectId)
        if (data) setStakeholders(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStakeholders()
  }, [projectId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenRole(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredStakeholders = useMemo(() => {
    if (!searchQuery) return stakeholders
    const query = searchQuery.toLowerCase()
    return stakeholders.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.profiles?.full_name?.toLowerCase().includes(query)) ||
      (s.profiles?.email?.toLowerCase().includes(query))
    )
  }, [stakeholders, searchQuery])

  const availableStakeholders = useMemo(() => {
    return filteredStakeholders
  }, [filteredStakeholders])

  const canEditRole = (role: RaciRoleType, stakeholderId: string) => {
    if (callerRole === 'Team Member') {
      const stakeholder = stakeholders.find(s => s.id === stakeholderId)
      return stakeholder?.linked_user_id === callerUserId
    }
    if (hasEditAccess) return true
    return false
  }

  const handleToggleAssignment = async (stakeholderId: string, roleType: RaciRoleType) => {
    if (!canEditRole(roleType, stakeholderId) || isUpdating) return
    setIsUpdating(true)

    // Optimistic UI Update
    const existing = localAssignments.find(a => a.stakeholderId === stakeholderId && a.roleType === roleType)
    const stakeholder = stakeholders.find(s => s.id === stakeholderId)

    let newAssignments = [...localAssignments]
    if (existing) {
      newAssignments = newAssignments.filter(a => !(a.stakeholderId === stakeholderId && a.roleType === roleType))
    } else {
      if (roleType === 'Accountable') {
        const currentA = localAssignments.find(a => a.roleType === 'Accountable')
        if (currentA && currentA.stakeholderId !== stakeholderId) {
          if (!window.confirm('This will replace the currently Accountable stakeholder. Proceed?')) {
            setIsUpdating(false)
            return
          }
        }
        newAssignments = newAssignments.filter(a => a.roleType !== 'Accountable')
      }
      newAssignments.push({
        id: `temp-${Date.now()}`,
        wbsElementId,
        stakeholderId,
        roleType,
        stakeholder: stakeholder as any
      })
    }
    setLocalAssignments(newAssignments)

    try {
      let res: ActionResponse

      if (existing) {
        res = await removeRaciRole(projectId, wbsElementId, stakeholderId, roleType)
      } else {
        if (roleType === 'Accountable') {
          res = await replaceAccountableRole(projectId, wbsElementId, stakeholderId)
        } else {
          res = await assignRaciRole(projectId, wbsElementId, stakeholderId, roleType)
        }
      }

      if (!res.ok) {
        setLocalAssignments(assignments) // Revert on failure
        const errorStr = String(res.error)
        if (errorStr.includes('violates row-level security policy') || errorStr.includes('42501')) {
           onShowToast('error', 'You can only assign yourself as Responsible for this task.')
        } else {
           onShowToast('error', res.error || 'Failed to update RACI assignment')
        }
      } else {
        onAssignmentChanged?.()
      }
    } catch (err) {
      setLocalAssignments(assignments) // Revert on failure
      onShowToast('error', 'An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    loading,
    openRole,
    setOpenRole,
    searchQuery,
    setSearchQuery,
    isUpdating,
    localAssignments,
    dropdownRef,
    availableStakeholders,
    canEditRole,
    handleToggleAssignment
  }
}
