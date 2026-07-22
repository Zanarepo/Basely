'use client'

import { AlertOctagon } from 'lucide-react'
import type { DashboardRisk } from '../hooks/useProjectDashboardData'

export default function RisksWidget({
  risks
}: {
  risks: DashboardRisk[]
}) {
  const getScoreBadge = (score: number) => {
    let style = 'bg-emerald-50 text-emerald-600 border-emerald-500/25 dark:bg-emerald-500/10'
    let text = 'Low'

    if (score >= 15) {
      style = 'bg-rose-50 text-rose-600 border-rose-500/25 dark:bg-rose-500/10'
      text = 'High'
    } else if (score >= 8) {
      style = 'bg-amber-50 text-amber-600 border-amber-500/25 dark:bg-amber-500/10'
      text = 'Medium'
    }

    return (
      <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${style}`}>
        {text} ({score})
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-app-fg">Top Project Risks</h3>
        <AlertOctagon className="h-5 w-5 text-rose-500" />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-3">
        {risks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-app-muted py-8">
            No risks registered for this project.
          </div>
        ) : (
          risks.map(r => (
            <div
              key={r.id}
              className="p-3 bg-gray-50 dark:bg-app-hover border border-app-border rounded-2xl flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="text-sm font-bold text-app-fg leading-tight">
                  {r.title}
                </div>
                {getScoreBadge(r.risk_score)}
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-app-muted border-t border-app-border/40 pt-2 mt-1 gap-2">
                <div>
                  Prob: <span className="font-semibold text-app-fg">{r.probability}</span> | Impact: <span className="font-semibold text-app-fg">{r.impact}</span>
                </div>
                {r.response_strategy && (
                  <span className="bg-gray-100 dark:bg-app-surface px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    {r.response_strategy}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
