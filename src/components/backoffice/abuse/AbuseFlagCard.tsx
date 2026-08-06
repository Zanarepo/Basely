'use client'

import { useState } from 'react'
import { resolveAbuseFlagAction } from '@/lib/abuse/actions'
import { AlertTriangle, CheckCircle, ShieldBan, Eye } from 'lucide-react'

export function AbuseFlagCard({ flag }: { flag: any }) {
  const [loading, setLoading] = useState(false)

  const handleResolve = async (outcome: string) => {
    setLoading(true)
    try {
      await resolveAbuseFlagAction(flag.id, outcome)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const isResolved = !!flag.reviewed_at

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isResolved 
        ? 'bg-app-surface/50 border-app-border opacity-75' 
        : 'bg-app-card border-red-500/30 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            isResolved ? 'bg-app-surface border border-app-border text-app-muted' : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-app-fg mb-1">
              {flag.flag_type.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="text-xs text-app-muted font-semibold mb-2">
              Organization: <span className="font-bold text-app-fg">{flag.organizations?.name || flag.organization_id}</span>
            </p>
            <div className="bg-app-surface border border-app-border rounded-lg p-2.5 text-xs text-app-fg font-mono mb-3 inline-block">
              {JSON.stringify(flag.detail)}
            </div>
            
            {isResolved ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-app-muted uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Reviewed on {new Date(flag.reviewed_at).toLocaleDateString()} 
                &bull; Outcome: {flag.review_outcome}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/80 uppercase tracking-wider">
                Flagged {new Date(flag.flagged_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {!isResolved && (
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => handleResolve('dismissed')}
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-app-border bg-app-surface hover:bg-app-hover text-app-fg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              Dismiss
            </button>
            <button
              onClick={() => handleResolve('monitored')}
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors disabled:opacity-50"
            >
              <Eye className="w-3 h-3" />
              Monitor
            </button>
            <button
              onClick={() => handleResolve('banned')}
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors disabled:opacity-50"
            >
              <ShieldBan className="w-3 h-3" />
              Ban Org
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
