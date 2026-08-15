import React from 'react'
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { CompetitorStatus } from '../constants/types'

interface CompetitorStatusBadgeProps {
  status: CompetitorStatus
}

export function CompetitorStatusBadge({ status }: CompetitorStatusBadgeProps) {
  if (status === 'moat') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs">
        <Sparkles className="w-3 h-3 text-amber-300" />
        Moat
      </span>
    )
  }
  if (status === 'leading') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        Leading
      </span>
    )
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      <XCircle className="w-3 h-3 text-rose-500" />
      Gap
    </span>
  )
}
