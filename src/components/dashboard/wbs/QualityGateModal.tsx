'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { submitQualitySignoff, raiseQualityException } from '@/lib/wbs/quality-actions'

interface QualityStandard {
  id: string
  title: string
  description?: string
  category?: string
}

interface QualityGateModalProps {
  projectId: string
  elementId: string
  standards: QualityStandard[]
  category: string
  onClose: () => void
  onSuccess: () => void
  onExceptionRaised?: () => void
}

export function QualityGateModal({
  projectId,
  elementId,
  standards,
  category,
  onClose,
  onSuccess,
  onExceptionRaised
}: QualityGateModalProps) {
  const [statuses, setStatuses] = useState<Record<string, { status: 'met' | 'na'; reason?: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [exceptionMode, setExceptionMode] = useState(false)
  const [exceptionReason, setExceptionReason] = useState('')

  const allSelected = standards.every(s => statuses[s.id]?.status)

  const handleStatusChange = (id: string, status: 'met' | 'na', reason?: string) => {
    setStatuses(prev => ({
      ...prev,
      [id]: { status, reason }
    }))
  }

  const handleSubmit = async () => {
    if (!allSelected) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const payload = Object.entries(statuses).map(([key, val]) => ({
        key,
        status: val.status,
        reason: val.reason
      }))
      const res = await submitQualitySignoff(projectId, elementId, payload)

      if (res.ok) {
        onSuccess()
      } else {
        setErrorMsg(res.error || 'Failed to submit quality signoff')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRaiseException = async () => {
    if (!exceptionReason.trim()) {
      setErrorMsg('Please provide a reason for the exception')
      return
    }
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await raiseQualityException(projectId, elementId, exceptionReason)

      if (res.ok) {
        if (onExceptionRaised) onExceptionRaised()
        else onClose()
      } else {
        setErrorMsg(res.error || 'Failed to raise exception')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col crud-panel overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-5 border-b border-app-border shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg tracking-tight">Quality Gate Sign-off</h2>
              <p className="text-sm text-app-muted mt-0.5">Global standards required before completion</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 px-1 no-scrollbar">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {!exceptionMode ? (
            <div className="space-y-3">
              {standards.map((standard) => (
                <div key={standard.id} className="p-4 rounded-2xl border border-app-border bg-app-surface-solid/50 hover:bg-app-hover transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-app-fg">{standard.title}</h4>
                      {standard.description && <p className="text-sm text-app-muted mt-1 leading-relaxed">{standard.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 bg-app-surface-solid p-1 rounded-xl border border-app-border">
                      <button
                        onClick={() => handleStatusChange(standard.id, 'met')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                          statuses[standard.id]?.status === 'met' 
                            ? 'bg-emerald-500/15 text-emerald-500 shadow-sm' 
                            : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                        }`}
                      >
                        Met
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Reason why this is Not Applicable:')
                          if (reason !== null) {
                            handleStatusChange(standard.id, 'na', reason)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                          statuses[standard.id]?.status === 'na' 
                            ? 'bg-amber-500/15 text-amber-500 shadow-sm' 
                            : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>
                  {statuses[standard.id]?.status === 'na' && (
                    <div className="mt-4 text-sm text-amber-500/90 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 flex gap-2">
                      <span className="font-bold shrink-0">Reason:</span> 
                      <p>{statuses[standard.id].reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5 pb-2">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-amber-500 font-bold mb-1">Raise Quality Exception</h4>
                <p className="text-sm text-amber-500/80 leading-relaxed">
                  This will log a high-priority issue in the RAID log and notify the Project Manager. The task will be moved to &quot;In Review&quot; instead of Complete.
                </p>
              </div>
              
              <div>
                <label className="auth-label block mb-2">Exception Details</label>
                <textarea
                  value={exceptionReason}
                  onChange={e => setExceptionReason(e.target.value)}
                  placeholder="Explain why the quality standards cannot be met at this time..."
                  className="w-full h-32 px-4 py-3 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-app-border shrink-0 bg-app-surface/50">
          {!exceptionMode ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExceptionMode(true)}
                className="text-sm font-bold text-rose-500 hover:text-rose-400 hover:underline transition-all cursor-pointer"
              >
                Raise Quality Exception
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!allSelected || isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Submitting...
                    </>
                  ) : 'Sign-off & Complete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setExceptionMode(false)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleRaiseException}
                disabled={!exceptionReason.trim() || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Logging...
                  </>
                ) : 'Log Exception'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
