'use client'

import { useState } from 'react'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'

interface PendingCRsBannerProps {
  count: number
  projectId: string
}

export function PendingCRsBanner({ count, projectId }: PendingCRsBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || count === 0) return null

  const crUrl = `/dashboard/projects/${projectId}?tab=documents&doc=change_requests`

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 animate-in fade-in duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-xs font-semibold truncate">
          <span className="font-bold">{count}</span> pending Change Request{count !== 1 ? 's' : ''} require{count === 1 ? 's' : ''} review before the schedule baseline is finalised.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={crUrl}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Review CRs <ArrowRight className="w-3 h-3" />
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
