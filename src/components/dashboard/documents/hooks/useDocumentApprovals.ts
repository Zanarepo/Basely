'use client'

import { useState, useEffect, useRef } from 'react'
import {
  getProjectOrOrgMembers,
  saveGeneratedDocument,
  dispatchReviewerAssignmentNotification,
  dispatchStatusChangeNotificationToPM,
} from '@/lib/documents/actions'

export interface ReviewerApproval {
  id: string
  role: string
  name: string
  userId?: string
  status: 'pending' | 'approved' | 'changes_requested'
  date?: string
}

export interface OrgMember {
  userId: string
  name: string
  role: string
  email?: string
}

const DEFAULT_REVIEWERS: ReviewerApproval[] = []

interface UseDocumentApprovalsProps {
  projectId: string
  documentType: string
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  hasEditAccess: boolean
  isSnapshot?: boolean
}

export function useDocumentApprovals({
  projectId,
  documentType,
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  hasEditAccess,
  isSnapshot = false,
}: UseDocumentApprovalsProps) {
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [newRoleTitle, setNewRoleTitle] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [members, setMembers] = useState<OrgMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [isAdmin, setIsAdmin] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  // Fetch real org/project members on load
  useEffect(() => {
    let isMounted = true
    async function loadMembers() {
      if (!projectId) return
      const res = await getProjectOrOrgMembers(projectId)
      if (isMounted) {
        setMembers(res.members || [])
        setCurrentUserId(res.currentUserId)
        setIsAdmin(!!res.isAdmin)
      }
    }
    loadMembers()
    return () => {
      isMounted = false
    }
  }, [projectId])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bannerRef.current && !bannerRef.current.contains(event.target as Node)) {
        setActiveEditingId(null)
      }
    }
    if (activeEditingId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeEditingId])

  // Parse approvals state from freeText and filter out legacy dummy cards
  const DUMMY_IDS = new Set(['pm', 'eng', 'design', 'qa', 'stakeholder'])

  const reviewers: ReviewerApproval[] = (() => {
    try {
      if (freeText['__document_approvals']) {
        const parsed = JSON.parse(freeText['__document_approvals'])
        if (Array.isArray(parsed)) {
          return parsed.filter((r: ReviewerApproval) => !DUMMY_IDS.has(r.id))
        }
      }
    } catch (e) {
      console.error('Failed to parse document approvals:', e)
    }
    return DEFAULT_REVIEWERS
  })()

  const saveReviewers = (updated: ReviewerApproval[]) => {
    const jsonStr = JSON.stringify(updated)
    
    setFreeText((prev) => {
      const nextFreeText = { ...prev, '__document_approvals': jsonStr }
      
      if (projectId && documentType && !isSnapshot) {
        setTimeout(() => {
          saveGeneratedDocument(projectId, documentType, nextFreeText, false).then((res) => {
            if (!res.ok) {
              console.error('[Instant Approvals Save Failed]:', res.error)
              onShowToast('error', `Failed to save status to database: ${res.error}`)
            }
          }).catch((err) => {
            console.error('[Instant Approvals Save Error]:', err)
          })
        }, 0)
      }

      return nextFreeText
    })

    setIsDirty(true)
  }

  // Filter visible reviewers based on role:
  // Admins & PMs see ALL cards. Regular reviewers ONLY see their own assigned card.
  const visibleReviewers = isAdmin
    ? reviewers
    : reviewers.filter((r) => {
        if (r.userId && currentUserId && r.userId === currentUserId) return true
        if (!r.userId) return true
        return false
      })

  // Check if current logged in user is allowed to review this slot
  const canUserReview = (rev: ReviewerApproval): boolean => {
    if (isSnapshot) return false
    return true
  }

  const handleStatusChange = (id: string, newStatus: 'pending' | 'approved' | 'changes_requested') => {
    const rev = reviewers.find((r) => r.id === id)
    if (!rev) return

    if (!canUserReview(rev)) {
      onShowToast('error', `Only assigned reviewer (${rev.name}) can update this sign-off status`)
      return
    }

    const updated = reviewers.map((r) => {
      if (r.id === id) {
        const dateStr = newStatus === 'approved' ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined
        return { ...r, status: newStatus, date: dateStr }
      }
      return r
    })

    saveReviewers(updated)
    setActiveEditingId(null)
    onShowToast('success', 'Updated sign-off status')

    // Notify PM / Document Creator of status change (In-App + Priority Email + Slack)
    if (projectId && documentType) {
      dispatchStatusChangeNotificationToPM(projectId, documentType, rev.name, rev.role, newStatus).catch((err) => {
        console.error('Failed to dispatch PM status change notification:', err)
      })
    }
  }

  const handleAssignReviewer = (id: string, member: OrgMember) => {
    const roleTitle = reviewers.find((r) => r.id === id)?.role || 'Reviewer'
    const updated = reviewers.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          userId: member.userId,
          name: member.name,
        }
      }
      return r
    })

    saveReviewers(updated)
    onShowToast('success', `Assigned ${member.name} as ${roleTitle}`)

    // Dispatch assignment notification (In-App + Priority Email + Slack)
    if (projectId && documentType && member.userId) {
      dispatchReviewerAssignmentNotification(projectId, documentType, member.userId, member.name, roleTitle).catch((err) => {
        console.error('Failed to dispatch reviewer assignment notification:', err)
      })
    }
  }

  const handleAddReviewerMember = (member: OrgMember, customRoleTitle?: string) => {
    if (reviewers.some((r) => r.userId === member.userId)) {
      onShowToast('error', `${member.name} is already added as a reviewer`)
      return
    }

    const roleTitle = customRoleTitle?.trim() || member.role || 'Reviewer'
    const newId = `rev_${member.userId}_${Date.now()}`

    const updated: ReviewerApproval[] = [
      ...reviewers,
      {
        id: newId,
        role: roleTitle,
        name: member.name,
        userId: member.userId,
        status: 'pending' as const,
      },
    ]

    saveReviewers(updated)
    setSelectedMemberId('')
    setNewRoleTitle('')
    setShowAddRoleModal(false)
    onShowToast('success', `Added ${member.name} as ${roleTitle}`)

    // Dispatch assignment notification (In-App + Priority Email + Slack)
    if (projectId && documentType && member.userId) {
      dispatchReviewerAssignmentNotification(projectId, documentType, member.userId, member.name, roleTitle).catch((err) => {
        console.error('Failed to dispatch reviewer assignment notification:', err)
      })
    }
  }

  const handleDeleteReviewer = (id: string) => {
    const updated = reviewers.filter((r) => r.id !== id)
    saveReviewers(updated)
    setActiveEditingId(null)
    onShowToast('success', 'Removed reviewer')
  }

  const approvedCount = reviewers.filter((r) => r.status === 'approved').length
  const isFullyApproved = reviewers.length > 0 && approvedCount === reviewers.length
  const hasChangesRequested = reviewers.some((r) => r.status === 'changes_requested')

  return {
    bannerRef,
    reviewers,
    visibleReviewers,
    members,
    currentUserId,
    isAdmin,
    activeEditingId,
    setActiveEditingId,
    showAddRoleModal,
    setShowAddRoleModal,
    newRoleTitle,
    setNewRoleTitle,
    selectedMemberId,
    setSelectedMemberId,
    approvedCount,
    isFullyApproved,
    hasChangesRequested,
    canUserReview,
    handleStatusChange,
    handleAssignReviewer,
    handleAddReviewerMember,
    handleDeleteReviewer,
  }
}
