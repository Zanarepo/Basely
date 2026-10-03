'use client'

import React from 'react'
import { CheckCircle2, Clock, AlertCircle, Trash2, ChevronDown, Check, Lock, UserCheck } from 'lucide-react'
import { ReviewerApproval, OrgMember } from '../../hooks/useDocumentApprovals'

interface ReviewerBadgeItemProps {
  rev: ReviewerApproval
  isEditing: boolean
  hasEditAccess: boolean
  isSnapshot?: boolean
  canReview: boolean
  members: OrgMember[]
  onToggleEdit: () => void
  onStatusChange: (status: 'pending' | 'approved' | 'changes_requested') => void
  onAssignMember: (member: OrgMember) => void
  onDeleteRole: () => void
}

export function ReviewerBadgeItem({
  rev,
  isEditing,
  hasEditAccess,
  isSnapshot = false,
  canReview,
  members,
  onToggleEdit,
  onStatusChange,
  onAssignMember,
  onDeleteRole,
}: ReviewerBadgeItemProps) {
  return (
    <div className="relative z-30">
      <button
        type="button"
        style={{ cursor: 'pointer' }}
        onClick={onToggleEdit}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
          rev.status === 'approved'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            : rev.status === 'changes_requested'
            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            : 'bg-app-surface text-app-fg border-app-border hover:border-violet-500/50 hover:bg-app-hover'
        }`}
        title={canReview ? "Click to manage sign-off" : `Only ${rev.name} can update this status`}
      >
        {rev.status === 'approved' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : rev.status === 'changes_requested' ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}

        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">{rev.role}</span>
          <span className="font-semibold text-xs leading-tight flex items-center gap-1">
            {rev.name} {rev.date ? `(${rev.date})` : ''}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-app-muted ml-0.5" />
      </button>

      {/* Status & Member Selector Popover */}
      {isEditing && !isSnapshot && (
        <div className="absolute left-0 top-full mt-2 w-72 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-app-fg">{rev.role} Sign-Off</span>
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={onDeleteRole}
              className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Remove reviewer slot"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reviewer Profile Header */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {rev.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-app-fg truncate leading-tight">{rev.name}</span>
              <span className="text-[10px] text-app-muted truncate leading-tight">{rev.role}</span>
            </div>
          </div>

          {/* Review Status Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-app-muted uppercase">Set Status</label>
              {!canReview && (
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              )}
            </div>

            {!canReview ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                🔒 Only assigned reviewer <strong>{rev.name}</strong> or Workspace Admin can update this status.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStatusChange('approved')}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    rev.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500 shadow-xs'
                      : 'bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/15 border border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Approve Document</span>
                  </div>
                  {rev.status === 'approved' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0" />}
                </button>

                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStatusChange('pending')}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    rev.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-500 shadow-xs'
                      : 'bg-amber-500/5 text-amber-600 hover:bg-amber-500/15 border border-amber-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Set Pending Review</span>
                  </div>
                  {rev.status === 'pending' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 font-bold shrink-0" />}
                </button>

                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStatusChange('changes_requested')}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    rev.status === 'changes_requested'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-2 border-rose-500 shadow-xs'
                      : 'bg-rose-500/5 text-rose-600 hover:bg-rose-500/15 border border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Request Changes</span>
                  </div>
                  {rev.status === 'changes_requested' && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 font-bold shrink-0" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
