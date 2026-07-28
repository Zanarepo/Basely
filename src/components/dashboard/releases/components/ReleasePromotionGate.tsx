'use client'

import React, { useState } from 'react'
import { Rocket, X, AlertTriangle, CheckCircle2, FileText, ExternalLink, Loader2, Info } from 'lucide-react'
import { promoteRelease } from '@/lib/releases/gate-actions'

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
  onSuccess
}: ReleasePromotionGateProps) {
  const [rationale, setRationale] = useState('')
  const [targetStatus, setTargetStatus] = useState<'in_progress' | 'released'>('in_progress')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvalRequested, setApprovalRequested] = useState(false)

  if (!isOpen) return null

  const isBlocked = targetStatus === 'released' && unmetCriteriaCount > 0

  const handlePromote = async () => {
    if (isBlocked) return
    if (!rationale.trim()) {
      setError('A rationale is required for release promotion.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await promoteRelease(releaseId, projectId, targetStatus, rationale)
    if (!res.ok) {
      setError(res.error || 'Failed to promote release.')
      setLoading(false)
    } else {
      setApprovalRequested(res.approvalRequested || false)
      setLoading(false)
      if (!res.approvalRequested) {
        onSuccess()
      }
    }
  }

  if (approvalRequested) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-app-fg">Approval Request Submitted</h3>
            <p className="text-sm text-app-muted leading-relaxed">
              Your organization has Release Approval Workflows enabled. An approval request has been generated for this promotion and routed to the required sign-offs.
            </p>
            <div className="pt-6">
              <button
                onClick={() => {
                  setApprovalRequested(false)
                  onSuccess()
                  onClose()
                }}
                className="w-full py-3 bg-app-surface hover:bg-app-surface/80 border border-app-border rounded-xl text-sm font-bold text-app-fg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Rocket className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-app-fg">Promote Release</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-app-muted hover:text-app-fg transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Target Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetStatus('in_progress')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    targetStatus === 'in_progress'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-app-surface border-app-border text-app-fg hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-sm font-bold">In Progress</div>
                  <div className={`text-xs mt-1 ${targetStatus === 'in_progress' ? 'text-amber-500/80' : 'text-app-muted'}`}>Active deployment</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStatus('released')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    targetStatus === 'released'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : 'bg-app-surface border-app-border text-app-fg hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-sm font-bold">Released</div>
                  <div className={`text-xs mt-1 ${targetStatus === 'released' ? 'text-emerald-500/80' : 'text-app-muted'}`}>Deployment completed</div>
                </button>
              </div>
            </div>

            {isBlocked && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-500">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Promotion Blocked</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    You cannot promote this release to "Released" because there are {unmetCriteriaCount} unmet exit criteria. All quality gates must be signed off before final release.
                  </p>
                </div>
              </div>
            )}

            {!isBlocked && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-blue-500">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Tier-Aware Routing</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    If your organization has Approval Workflows enabled, this will generate a formal request. Otherwise, it will be automatically recorded in the Change Request Log.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Rationale / Release Notes</label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Briefly describe what is being promoted, any known issues, or notes for approvers..."
                className="w-full bg-app-surface border border-app-border rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 min-h-[100px] resize-y"
              />
            </div>
            
            {error && (
              <div className="text-xs text-rose-500 font-medium p-3 bg-rose-500/10 rounded-xl">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-app-border bg-app-surface/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-app-card text-app-fg text-sm font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePromote}
            disabled={loading || isBlocked || !rationale.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Promote to {targetStatus === 'released' ? 'Released' : 'In Progress'}
          </button>
        </div>
      </div>
    </div>
  )
}
