'use client'

import React from 'react'
import { Rocket, X, AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react'
import { useReleasePromotionGate } from '../hooks/useReleasePromotionGate'

interface ReleasePromotionGateProps {
  isOpen: boolean
  onClose: () => void
  releaseId: string
  projectId: string
  releaseName: string
  currentStatus: string
  unmetCriteriaCount: number
  onSuccess: () => void
}

export function ReleasePromotionGate({
  isOpen,
  onClose,
  releaseId,
  projectId,
  releaseName,
  currentStatus,
  unmetCriteriaCount,
  onSuccess,
}: ReleasePromotionGateProps) {
  const {
    rationale,
    setRationale,
    targetStatus,
    setTargetStatus,
    loading,
    error,
    approvalRequested,
    setApprovalRequested,
    isBlocked,
    handlePromote
  } = useReleasePromotionGate({
    releaseId,
    projectId,
    unmetCriteriaCount,
    onSuccess
  })

  if (!isOpen) return null

  if (approvalRequested) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div
          className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-app-fg">Approval Request Submitted</h3>
            <p className="text-xs text-app-muted leading-relaxed">
              Your organization has Release Approval Workflows enabled. An approval request has been generated for this promotion and routed to the required sign-offs.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setApprovalRequested(false)
                  onSuccess()
                  onClose()
                }}
                className="w-full py-2.5 bg-app-surface hover:bg-app-card border border-app-border rounded-xl text-xs font-bold text-app-fg transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-app-border bg-app-surface/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Rocket className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-app-fg">Promote Release</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Target Status Selection */}
          <div>
            <label className="block text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2">
              Target Status
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetStatus('in_progress')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  targetStatus === 'in_progress'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                    : 'bg-app-surface border-app-border text-app-fg hover:border-amber-500/50'
                }`}
              >
                <div className="text-xs font-bold">In Progress</div>
                <div className={`text-[10px] mt-0.5 ${targetStatus === 'in_progress' ? 'text-amber-500/90 font-medium' : 'text-app-muted'}`}>
                  Active deployment
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('released')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  targetStatus === 'released'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                    : 'bg-app-surface border-app-border text-app-fg hover:border-emerald-500/50'
                }`}
              >
                <div className="text-xs font-bold">Released</div>
                <div className={`text-[10px] mt-0.5 ${targetStatus === 'released' ? 'text-emerald-500/90 font-medium' : 'text-app-muted'}`}>
                  Deployment completed
                </div>
              </button>
            </div>
          </div>

          {/* Blocked or Info Banner */}
          {isBlocked ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-500 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs">Promotion Blocked</h4>
                <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                  {unmetCriteriaCount} unmet exit criteria remaining. All quality gates must be signed off.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-blue-500 text-xs">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs">Tier-Aware Routing</h4>
                <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                  Generates formal approval request if workflows enabled, or logs to Change Log.
                </p>
              </div>
            </div>
          )}

          {/* Rationale / Release Notes */}
          <div>
            <label className="block text-[11px] font-bold text-app-muted uppercase tracking-wider mb-1.5">
              Rationale / Release Notes
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              placeholder="Briefly describe what is being promoted, any known issues, or notes for approvers..."
              className="w-full bg-app-surface border border-app-border rounded-xl p-2.5 text-xs text-app-fg focus:outline-none focus:border-violet-500 resize-none min-h-[70px]"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-500 font-semibold p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-app-border bg-app-surface/40 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-app-border bg-app-surface hover:bg-app-card text-app-fg text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePromote}
            disabled={loading || isBlocked || !rationale.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            <span>Promote to {targetStatus === 'released' ? 'Released' : 'In Progress'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
