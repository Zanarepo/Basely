'use client'

import { useState } from 'react'
import { Clock, ShieldAlert, CheckCircle2, XCircle, Trash2, Loader2 } from 'lucide-react'
import type { ApprovalRequest } from './ApprovalsWorkspace'
import { deleteRequest } from '@/lib/approvals/actions'

export function RequesterQueue({ requests }: { requests: ApprovalRequest[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setProcessingId(id)
    setErrorMsg(null)
    const { ok, error } = await deleteRequest(id)
    if (!ok) {
      setErrorMsg(error || 'Failed to delete request')
    }
    setProcessingId(null)
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-10 border border-dashed border-app-border rounded-xl text-app-muted text-sm">
        You haven't submitted any approval requests yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm mb-4">
          {errorMsg}
        </div>
      )}
      <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wider mb-4">Your Submissions</h2>
      {requests.map(r => (
        <div key={r.id} className="bg-app-surface-solid border border-app-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors hover:border-app-border-hover">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-app-fg capitalize">
                {r.action_type.replace('_', ' ')}
              </h3>
              
              {r.status === 'pending' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-500">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              )}
              {r.status === 'approved' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              )}
              {r.status === 'rejected' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-500/10 text-rose-500">
                  <XCircle className="w-3 h-3" /> Rejected
                </span>
              )}
            </div>

            <div className="mt-3 text-xs text-app-muted flex flex-col gap-1.5">
              <span>Submitted: {new Date(r.created_at).toLocaleString()}</span>
              {r.decided_at && (
                <span>Reviewed: {new Date(r.decided_at).toLocaleString()} {r.decider_name ? `by ${r.decider_name}` : ''}</span>
              )}
            </div>

            {r.payload?.baseline?.name && (
              <div className="mt-3 text-sm bg-app-muted-surface px-3 py-2 rounded border border-app-border inline-block">
                <span className="text-app-muted">Baseline Name:</span> <span className="font-medium text-app-fg">{r.payload.baseline.name}</span>
              </div>
            )}
            
            {r.status === 'rejected' && r.decision_comment && (
              <div className="mt-3 text-sm bg-rose-500/10 text-rose-500 px-3 py-2 rounded border border-rose-500/20 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Rejection Reason:</strong>
                  <p className="mt-0.5">{r.decision_comment}</p>
                </div>
              </div>
            )}
          </div>
          
          {r.status !== 'pending' && (
            <div className="flex items-center mt-4 sm:mt-0 shrink-0">
              <button
                onClick={() => handleDelete(r.id)}
                disabled={processingId === r.id}
                title="Dismiss"
                className="p-2 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
