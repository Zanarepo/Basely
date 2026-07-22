'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Loader2, Eye, Calendar, DollarSign, Database, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ApprovalRequest } from './ApprovalsWorkspace'
import { approveRequest, rejectRequest, getLatestBaselineComparison } from '@/lib/approvals/actions'

function PreviewModal({ request, onClose }: { request: ApprovalRequest, onClose: () => void }) {
  const { action_type, payload } = request

  const [loadingComparison, setLoadingComparison] = useState(false)
  const [previousBaseline, setPreviousBaseline] = useState<any>(null)
  const [previousSnapshots, setPreviousSnapshots] = useState<any[]>([])

  useEffect(() => {
    if ((action_type === 'budget_baseline' || action_type === 'schedule_baseline') && payload?.baseline?.project_id) {
      setLoadingComparison(true)
      getLatestBaselineComparison(payload.baseline.project_id, action_type, request.created_at).then(res => {
        setPreviousBaseline(res.previousBaseline)
        setPreviousSnapshots(res.snapshots)
      }).catch(err => {
        console.error(err)
      }).finally(() => {
        setLoadingComparison(false)
      })
    }
  }, [action_type, payload])

  let summary = null
  let table = null

  if (action_type === 'budget_baseline' && payload) {
    const totalCost = payload.snapshots?.reduce((acc: number, snap: any) => acc + (Number(snap.baseline_total) || 0), 0)
    summary = (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-app-muted-surface border border-app-border rounded-xl">
          <p className="text-xs text-app-muted uppercase font-semibold mb-1 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Total Budget</p>
          <p className="text-lg font-bold text-app-fg">${totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</p>
        </div>
        <div className="p-4 bg-app-muted-surface border border-app-border rounded-xl">
          <p className="text-xs text-app-muted uppercase font-semibold mb-1 flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Elements Snapshotted</p>
          <p className="text-lg font-bold text-app-fg">{payload.snapshots?.length || 0}</p>
        </div>
      </div>
    )

    if (loadingComparison) {
      table = <div className="p-8 text-center text-app-muted flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading comparison...</div>
    } else {
      table = (
        <div className="mt-6 border border-app-border rounded-xl overflow-hidden bg-app-surface-solid">
          <div className="p-3 bg-app-muted-surface border-b border-app-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-app-fg">Detailed Breakdown</h3>
            {previousBaseline && (
              <span className="text-xs text-app-muted">Comparing vs: <span className="font-medium text-app-fg">{previousBaseline.name}</span></span>
            )}
            {!previousBaseline && (
              <span className="text-xs text-app-muted italic">No previous baseline found</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-muted-surface border-b border-app-border text-xs uppercase text-app-muted">
                <tr>
                  <th className="p-3 font-semibold">WBS Element</th>
                  <th className="p-3 font-semibold text-right">Previous</th>
                  <th className="p-3 font-semibold text-right">Proposed</th>
                  <th className="p-3 font-semibold text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {payload.snapshots?.map((snap: any) => {
                  const prevSnap = previousSnapshots.find(p => p.wbs_element_id === snap.wbs_element_id)
                  const prevVal = prevSnap ? Number(prevSnap.baseline_total) : 0
                  const propVal = Number(snap.baseline_total) || 0
                  const delta = propVal - prevVal

                  let DeltaIcon = Minus
                  let deltaColor = "text-app-muted"
                  if (delta > 0) {
                    DeltaIcon = TrendingUp
                    deltaColor = "text-rose-500" // Cost increase is bad/red
                  } else if (delta < 0) {
                    DeltaIcon = TrendingDown
                    deltaColor = "text-emerald-500" // Cost decrease is good/green
                  }

                  return (
                    <tr key={snap.wbs_element_id} className="hover:bg-app-hover transition-colors">
                      <td className="p-3 text-app-fg font-medium">{snap.snapshotted_wbs_name || 'Unnamed Element'}</td>
                      <td className="p-3 text-right text-app-muted">${prevVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right text-app-fg font-medium">${propVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`p-3 text-right font-medium flex items-center justify-end gap-1 ${deltaColor}`}>
                        {delta !== 0 && <DeltaIcon className="w-3.5 h-3.5" />}
                        {delta > 0 ? '+' : ''}{delta === 0 ? '-' : `$${Math.abs(delta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  } else if (action_type === 'schedule_baseline' && payload) {
    let minDate: Date | null = null
    let maxDate: Date | null = null

    payload.snapshots?.forEach((snap: any) => {
      if (snap.baseline_start) {
        const d = new Date(snap.baseline_start)
        if (!minDate || d < minDate) minDate = d
      }
      if (snap.baseline_finish) {
        const d = new Date(snap.baseline_finish)
        if (!maxDate || d > maxDate) maxDate = d
      }
    })

    summary = (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-app-muted-surface border border-app-border rounded-xl">
          <p className="text-xs text-app-muted uppercase font-semibold mb-1 flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Activities Snapshotted</p>
          <p className="text-lg font-bold text-app-fg">{payload.snapshots?.length || 0}</p>
        </div>
        <div className="p-4 bg-app-muted-surface border border-app-border rounded-xl">
          <p className="text-xs text-app-muted uppercase font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Project Start</p>
          <p className="text-sm font-bold text-app-fg">{minDate ? (minDate as Date).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="p-4 bg-app-muted-surface border border-app-border rounded-xl">
          <p className="text-xs text-app-muted uppercase font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Project Finish</p>
          <p className="text-sm font-bold text-app-fg">{maxDate ? (maxDate as Date).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    )

    if (loadingComparison) {
      table = <div className="p-8 text-center text-app-muted flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading comparison...</div>
    } else {
      table = (
        <div className="mt-6 border border-app-border rounded-xl overflow-hidden bg-app-surface-solid">
          <div className="p-3 bg-app-muted-surface border-b border-app-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-app-fg">Activity Breakdown</h3>
            {previousBaseline && (
              <span className="text-xs text-app-muted">Comparing vs: <span className="font-medium text-app-fg">{previousBaseline.name}</span></span>
            )}
            {!previousBaseline && (
              <span className="text-xs text-app-muted italic">No previous baseline found</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-muted-surface border-b border-app-border text-xs uppercase text-app-muted">
                <tr>
                  <th className="p-3 font-semibold">Activity</th>
                  <th className="p-3 font-semibold text-right">Prev Start</th>
                  <th className="p-3 font-semibold text-right">Proposed Start</th>
                  <th className="p-3 font-semibold text-right">Prev Finish</th>
                  <th className="p-3 font-semibold text-right">Proposed Finish</th>
                  <th className="p-3 font-semibold text-right">Δ Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {payload.snapshots?.map((snap: any) => {
                  const prevSnap = previousSnapshots.find((p: any) => p.activity_id === snap.activity_id)
                  const prevDur = prevSnap ? Number(prevSnap.baseline_duration) : 0
                  const propDur = Number(snap.baseline_duration) || 0
                  const deltaDur = propDur - prevDur

                  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : 'N/A'

                  let deltaColor = "text-app-muted"
                  let DeltaIcon = Minus
                  if (deltaDur > 0) {
                    DeltaIcon = TrendingUp
                    deltaColor = "text-rose-500"
                  } else if (deltaDur < 0) {
                    DeltaIcon = TrendingDown
                    deltaColor = "text-emerald-500"
                  }

                  return (
                    <tr key={snap.activity_id} className="hover:bg-app-hover transition-colors">
                      <td className="p-3 text-app-fg font-medium">{snap.activity_name || (prevSnap as any)?.activities?.name || snap.activity_id?.slice(0, 8)}</td>
                      <td className="p-3 text-right text-app-muted">{fmtDate(prevSnap?.baseline_start)}</td>
                      <td className="p-3 text-right text-app-fg font-medium">{fmtDate(snap.baseline_start)}</td>
                      <td className="p-3 text-right text-app-muted">{fmtDate(prevSnap?.baseline_finish)}</td>
                      <td className="p-3 text-right text-app-fg font-medium">{fmtDate(snap.baseline_finish)}</td>
                      <td className={`p-3 text-right font-medium flex items-center justify-end gap-1 ${deltaColor}`}>
                        {deltaDur !== 0 && <DeltaIcon className="w-3.5 h-3.5" />}
                        {deltaDur === 0 ? '-' : `${deltaDur > 0 ? '+' : ''}${deltaDur}d`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app-surface w-full max-w-4xl rounded-2xl shadow-xl border border-app-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="font-semibold text-app-fg">Baseline Preview</h2>
          <button onClick={onClose} className="p-1 hover:bg-app-hover rounded text-app-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm text-app-muted font-medium">Name</h3>
            <p className="text-base text-app-fg font-semibold mt-1">{payload?.baseline?.name || 'Unnamed Baseline'}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm text-app-muted font-medium border-b border-app-border pb-2 mb-2">Snapshot Summary</h3>
            {summary || <p className="text-sm text-app-muted">No summary available for this action type.</p>}
          </div>

          {table}
        </div>

        <div className="p-4 border-t border-app-border bg-app-muted-surface flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-app-border rounded-lg hover:bg-app-hover text-app-fg transition-colors">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}

export function ApproverQueue({ requests }: { requests: ApprovalRequest[] }) {
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const historyRequests = requests.filter(r => r.status !== 'pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [previewRequest, setPreviewRequest] = useState<ApprovalRequest | null>(null)

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    setErrorMsg(null)
    const { ok, error } = await approveRequest(id)
    if (!ok) {
      setErrorMsg(error || 'Failed to approve request')
    }
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    const comment = window.prompt("Reason for rejection:")
    if (comment === null) return // user cancelled
    if (!comment.trim()) {
      alert("A reason is required to reject a request.")
      return
    }
    setProcessingId(id)
    setErrorMsg(null)
    const { ok, error } = await rejectRequest(id, comment)
    if (!ok) {
      setErrorMsg(error || 'Failed to reject request')
    }
    setProcessingId(null)
  }

  const renderRequestCard = (r: ApprovalRequest, isHistory: boolean = false) => (
    <div key={r.id} className="group bg-app-surface-solid border border-app-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors hover:border-app-border-hover">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-app-fg capitalize">
            {r.action_type.replace('_', ' ')}
          </h3>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${r.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
              r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                'bg-rose-500/10 text-rose-500'
            }`}>
            {r.status}
          </span>
        </div>
        <p className="text-sm text-app-muted">
          Requested by <span className="font-medium text-app-fg">{r.requester_name}</span> ({r.requester_email})
        </p>
        <div className="mt-3 text-xs text-app-muted flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {new Date(r.created_at).toLocaleString()}
        </div>

        {r.decision_comment && (
          <div className="mt-3 text-sm bg-rose-500/10 text-rose-500 px-3 py-2 rounded border border-rose-500/20">
            <strong>Reason:</strong> {r.decision_comment}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 shrink-0 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => setPreviewRequest(r)}
          className="flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-app-border text-app-fg hover:bg-app-hover transition-colors"
        >
          <Eye className="w-4 h-4" /> Preview
        </button>

        {!isHistory && (
          <>
            <button
              onClick={() => handleReject(r.id)}
              disabled={processingId === r.id}
              className="flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-app-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => handleApprove(r.id)}
              disabled={processingId === r.id}
              className="flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
          {errorMsg}
        </div>
      )}

      {previewRequest && (
        <PreviewModal request={previewRequest} onClose={() => setPreviewRequest(null)} />
      )}

      <div>
        <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wider mb-4">Awaiting Review ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-app-border rounded-xl text-app-muted text-sm">
            You're all caught up! No pending requests.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(r => renderRequestCard(r, false))}
          </div>
        )}
      </div>

      {historyRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wider mb-4 mt-8">Recent Decisions</h2>
          <div className="space-y-4">
            {historyRequests.slice(0, 20).map(r => renderRequestCard(r, true))}
          </div>
        </div>
      )}
    </div>
  )
}
