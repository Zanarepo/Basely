'use client'

import React, { useState } from 'react'
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useDocumentApprovals } from '../hooks/useDocumentApprovals'
import { ReviewerBadgeItem } from './approval/ReviewerBadgeItem'
import { AddReviewerModal } from './approval/AddReviewerModal'

interface DocumentApprovalBannerProps {
  projectId: string
  documentType: string
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  hasEditAccess: boolean
  isSnapshot?: boolean
}

export default function DocumentApprovalBanner({
  projectId,
  documentType,
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  hasEditAccess,
  isSnapshot = false,
}: DocumentApprovalBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    bannerRef,
    reviewers,
    visibleReviewers,
    members,
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
  } = useDocumentApprovals({
    projectId,
    documentType,
    freeText,
    setFreeText,
    setIsDirty,
    onShowToast,
    hasEditAccess,
    isSnapshot,
  })

  return (
    <div ref={bannerRef} className="mb-6 p-4 bg-app-surface/90 backdrop-blur-xs border border-app-border rounded-2xl shadow-2xs transition-all relative z-20 overflow-visible">
      {/* Header Bar - Clickable Accordion Trigger */}
      <div 
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex flex-wrap items-center justify-between gap-3 select-none transition-all cursor-pointer ${
          isExpanded ? 'pb-3 border-b border-app-border/60' : ''
        }`}
      >
        {/* Banner Header Title & Readiness Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <ShieldCheck className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-app-fg uppercase tracking-wider">Document Sign-Off & Governance</h4>
            <p className="text-[11px] text-app-muted">Track cross-functional approval before release into sprint development</p>
          </div>
        </div>

        {/* Global Status Indicator & Accordion Arrow */}
        <div className="flex items-center gap-2">
          {reviewers.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20 shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
              <span>No Reviewers Assigned</span>
            </span>
          ) : isFullyApproved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Approved for Development ({approvedCount}/{reviewers.length})</span>
            </span>
          ) : hasChangesRequested ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Changes Requested ({approvedCount}/{reviewers.length} Approved)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>In Review ({approvedCount}/{reviewers.length} Approved)</span>
            </span>
          )}

          <div className="p-1 text-app-muted hover:text-app-fg rounded-lg transition-colors ml-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Reviewers Badge Grid (Accordion Content) */}
      {isExpanded && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 animate-in fade-in zoom-in-95">
          {visibleReviewers.map((rev) => (
            <ReviewerBadgeItem
              key={rev.id}
              rev={rev}
              isEditing={activeEditingId === rev.id}
              hasEditAccess={hasEditAccess}
              isSnapshot={isSnapshot}
              canReview={canUserReview(rev)}
              members={members}
              onToggleEdit={() => setActiveEditingId(activeEditingId === rev.id ? null : rev.id)}
              onStatusChange={(status) => handleStatusChange(rev.id, status)}
              onAssignMember={(member) => handleAssignReviewer(rev.id, member)}
              onDeleteRole={() => handleDeleteReviewer(rev.id)}
            />
          ))}

          {/* Add Team Member Reviewer Button (Admins / PMs only) */}
          {isAdmin && !isSnapshot && (
            <AddReviewerModal
              showModal={showAddRoleModal}
              newRoleTitle={newRoleTitle}
              selectedMemberId={selectedMemberId}
              members={members}
              onOpenModal={() => setShowAddRoleModal(true)}
              onCloseModal={() => setShowAddRoleModal(false)}
              onChangeTitle={setNewRoleTitle}
              onSelectMember={setSelectedMemberId}
              onAddReviewerMember={handleAddReviewerMember}
            />
          )}
        </div>
      )}
    </div>
  )
}
