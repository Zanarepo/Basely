'use client'

import { Milestone, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import type { DashboardMilestone } from '../hooks/useProjectDashboardData'

export default function MilestonesWidget({
  milestones
}: {
  milestones: DashboardMilestone[]
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No Date'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-app-fg">Upcoming Milestones</h3>
        <Milestone className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-3">
        {milestones.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-app-muted py-8">
            No milestones configured for this project.
          </div>
        ) : (
          milestones.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-app-hover border border-app-border rounded-2xl"
            >
              <div className="flex items-start gap-3">
                {m.status === 'Hit' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {m.status === 'Missed' && (
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                {m.status === 'Upcoming' && (
                  <Clock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-bold text-app-fg leading-tight mb-0.5">{m.name}</div>
                  <div className="text-xs text-app-muted">{formatDate(m.finishDate)}</div>
                </div>
              </div>

              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                m.status === 'Hit'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-500/25 dark:bg-emerald-500/10'
                  : m.status === 'Missed'
                    ? 'bg-rose-50 text-rose-600 border-rose-500/25 dark:bg-rose-500/10'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-500/25 dark:bg-indigo-500/10'
              }`}>
                {m.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
