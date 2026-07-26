'use client'

import React, { useState } from 'react'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { X, ShieldAlert, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export interface LifecycleTransitionModalProps {
  isOpen: boolean
  onClose: () => void
  currentStatus: ProjectLifecycleStatus
  targetStatus: ProjectLifecycleStatus | null
  onConfirm: (target: ProjectLifecycleStatus, reason: string, isOverride: boolean) => Promise<boolean>
  requiresReason: boolean
  isTransitioning: boolean
  error?: string | null
}

const STAGE_DESCRIPTIONS: Record<ProjectLifecycleStatus, string> = {
  'Initiating': 'Project authorization, Business Case validation, and initial Stakeholder identification.',
  'Planning': 'Developing master schedules, WBS dictionary, cost estimation baselines, and initial risk registers.',
  'Executing': 'Active deliverable work, weekly status reports, team collaboration, and RACI tracking.',
  'Monitoring & Controlling': 'Earned Value Management (EVM), critical path variance analysis, and change request audits.',
  'Closing': 'Finalizing WBS deliverables, triggering formal Closure Reports, Lessons Learned, and preparing handover.',
  'Closed': 'Project formally terminated. Locks archival historical records and enables delayed Post-Implementation Reviews.'
}

export function LifecycleTransitionModal({
  isOpen,
  onClose,
  currentStatus,
  targetStatus,
  onConfirm,
  requiresReason,
  isTransitioning,
  error
}: LifecycleTransitionModalProps) {
  const [reason, setReason] = useState('')
  const [isOverride, setIsOverride] = useState(false)

  if (!isOpen || !targetStatus) return null

  const isTerminal = targetStatus === 'Closing' || targetStatus === 'Closed'
  const isSkipOrReopen = !requiresReason && !isTerminal && currentStatus !== targetStatus // Custom check if needed

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (requiresReason && (!reason || !reason.trim())) return
    const success = await onConfirm(targetStatus, reason, requiresReason || isOverride)
    if (success) {
      setReason('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[95%] sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-app-surface border border-app-border rounded-xl shadow-2xl overflow-hidden transition-all duration-200 flex flex-col max-h-[90vh]">
        {/* Header - Responsive Flex */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-app-surface-solid border-b border-app-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-lg border shrink-0 ${
              isTerminal 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
            }`}>
              {isTerminal ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-app-fg truncate">
                Confirm Lifecycle Stage Transition
              </h3>
              <p className="text-xs text-app-muted truncate hidden sm:block">
                Formally advance project phase and audit transition records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isTransitioning}
            className="p-1.5 text-app-muted hover:text-app-fg rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Responsive Spacing & Scrolling */}
        <form onSubmit={handleApply} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Phase progression display card */}
          <div className="p-3 sm:p-4 md:p-5 bg-app-bg border border-app-border rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 p-2 sm:p-3 bg-app-surface border border-app-border/60 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase font-bold text-app-muted tracking-wider mb-1">Current Phase</div>
              <div className="text-xs sm:text-sm md:text-base font-bold text-app-fg truncate">{currentStatus}</div>
            </div>
            <div className="flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-app-muted sm:rotate-0 rotate-90" />
            </div>
            <div className="flex-1 min-w-0 p-2 sm:p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="text-[10px] sm:text-xs uppercase font-bold text-indigo-500 tracking-wider mb-1">Target Phase</div>
              <div className="text-xs sm:text-sm md:text-base font-bold text-indigo-400 truncate">{targetStatus}</div>
            </div>
          </div>

          {/* Description of target stage */}
          <div className="p-3.5 sm:p-4 bg-app-surface/50 border border-app-border rounded-xl text-xs sm:text-sm text-app-muted leading-relaxed">
            <span className="font-bold text-app-fg">What this stage enables: </span>
            {STAGE_DESCRIPTIONS[targetStatus]}
          </div>

          {/* Special Terminal State Notice */}
          {isTerminal && (
            <div className="p-3.5 sm:p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="font-bold text-amber-700 dark:text-amber-400">Project Closure Gate Notice</div>
                <p className="text-app-muted leading-relaxed">
                  Transitioning to <strong className="text-app-fg font-bold">{targetStatus}</strong> unlocks the Project Closure Suite (Closure Report, Lessons Learned, Final Handover, and Client Sign-offs). A documented transition reason is mandatory for PMO compliance.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 sm:p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Justification Text Area */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-app-fg">
              <span>Transition Justification & Notes {requiresReason && <span className="text-rose-500">*</span>}</span>
              {requiresReason && <span className="text-[11px] font-normal text-app-muted">Mandatory for this transition</span>}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this project phase is advancing or changing (e.g., deliverables completed, sponsor approved)..."
              required={requiresReason}
              className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Responsive Modal Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row-reverse sm:items-center justify-start sm:justify-between gap-3 border-t border-app-border/60">
            <button
              type="submit"
              disabled={isTransitioning || (requiresReason && !reason.trim())}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 text-white transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Transitioning...</span>
                </>
              ) : (
                <>
                  <span>Confirm Transition</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isTransitioning}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-app-border bg-app-surface hover:bg-app-hover text-app-fg transition-all duration-150 text-center cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
