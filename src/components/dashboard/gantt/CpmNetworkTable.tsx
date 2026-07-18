'use client'

import { AlertCircle } from 'lucide-react'
import type { Activity, Dependency } from '@/lib/schedule/cpm'

type CpmNetworkTableProps = {
  activities: Activity[]
  dependencies: Dependency[]
  elLookup: Map<string, string>
}

export function CpmNetworkTable({ activities, dependencies, elLookup }: CpmNetworkTableProps) {
  // Format date helper
  const fmt = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full overflow-x-auto border border-app-border rounded-xl">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-app-muted-surface border-b border-app-border text-app-subtle uppercase tracking-wider text-[11px] font-bold">
          <tr>
            <th className="p-3">Task Name</th>
            <th className="p-3 text-center">Duration</th>
            <th className="p-3">Predecessors</th>
            <th className="p-3 text-center" title="Early Start">ES</th>
            <th className="p-3 text-center" title="Early Finish">EF</th>
            <th className="p-3 text-center" title="Late Start">LS</th>
            <th className="p-3 text-center" title="Late Finish">LF</th>
            <th className="p-3 text-center" title="Total Float">Float</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border">
          {activities.map((act) => {
            const wbsName = elLookup.get(act.wbsElementId) || act.name
            
            // Find predecessors
            const preds = dependencies
              .filter(d => d.successorId === act.id)
              .map(d => {
                const predAct = activities.find(a => a.id === d.predecessorId)
                return predAct ? `${elLookup.get(predAct.wbsElementId) || predAct.name} (${d.type})` : null
              })
              .filter(Boolean) as string[]

            return (
              <tr 
                key={act.id} 
                className={`transition-colors hover:bg-app-hover ${act.isCritical ? 'bg-rose-500/5' : 'bg-app-surface'}`}
              >
                <td className="p-3 font-medium text-app-fg max-w-[200px] truncate" title={wbsName}>
                  {wbsName}
                </td>
                <td className="p-3 text-center text-app-subtle">
                  {act.duration}d
                </td>
                <td className="p-3 text-app-subtle max-w-[200px] truncate" title={preds.join(', ')}>
                  {preds.length > 0 ? preds.join(', ') : '—'}
                </td>
                <td className="p-3 text-center font-medium">{fmt(act.es)}</td>
                <td className="p-3 text-center font-medium">{fmt(act.ef)}</td>
                <td className="p-3 text-center font-medium">{fmt(act.ls)}</td>
                <td className="p-3 text-center font-medium">{fmt(act.lf)}</td>
                <td className={`p-3 text-center font-bold ${act.isCritical ? 'text-rose-500' : 'text-indigo-500'}`}>
                  {act.totalFloat !== null ? `${act.totalFloat}d` : '—'}
                </td>
                <td className="p-3 text-center">
                  {act.isCritical ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/25 text-xs font-bold">
                      <AlertCircle className="w-3 h-3" />
                      Critical
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/25 text-xs font-bold dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/25">
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
