'use client'

import React, { useState } from 'react'
import { ScheduleActivityItem } from '../hooks/useScheduleDocumentData'
import { Calendar, Flag, Zap, Copy, Check, Clock } from 'lucide-react'

interface ScheduleMilestoneListProps {
  activities: ScheduleActivityItem[]
  milestones: ScheduleActivityItem[]
  criticalPath: ScheduleActivityItem[]
  totalActivities: number
  criticalCount: number
}

export function ScheduleMilestoneList({
  activities,
  milestones,
  criticalPath,
  totalActivities,
  criticalCount
}: ScheduleMilestoneListProps) {
  const [filter, setFilter] = useState<'all' | 'milestones' | 'critical'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const displayedItems = filter === 'milestones' ? milestones : filter === 'critical' ? criticalPath : activities

  const handleCopy = (item: ScheduleActivityItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `Task/Milestone: ${item.name} (${item.wbs_code}) | Start: ${item.start_date || 'N/A'} | Finish: ${item.end_date || 'N/A'} | Status: ${item.status}`
    navigator.clipboard.writeText(text)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Narrative Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Tracked Activities</p>
            <p className="text-xl font-bold text-app-fg mt-1">{totalActivities} Items</p>
          </div>
        </div>

        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Key Milestones</p>
            <p className="text-xl font-bold text-app-fg mt-1">{milestones.length} Milestones</p>
          </div>
        </div>

        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Critical Path Items</p>
            <p className="text-xl font-bold text-app-fg mt-1">{criticalCount} Zero-Float Tasks</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Interactive Pointer Styling */}
      <div className="flex flex-wrap gap-2 border-b border-app-border pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === 'all' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-app-surface text-app-muted hover:text-app-fg hover:bg-app-hover border border-app-border'
          }`}
          style={{ cursor: 'pointer' }}
        >
          <Clock className="w-3.5 h-3.5" /> All Activities ({activities.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('milestones')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === 'milestones' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-app-surface text-app-muted hover:text-app-fg hover:bg-app-hover border border-app-border'
          }`}
          style={{ cursor: 'pointer' }}
        >
          <Flag className="w-3.5 h-3.5" /> Milestones ({milestones.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('critical')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === 'critical' 
              ? 'bg-rose-600 text-white shadow-sm' 
              : 'bg-app-surface text-app-muted hover:text-app-fg hover:bg-app-hover border border-app-border'
          }`}
          style={{ cursor: 'pointer' }}
        >
          <Zap className="w-3.5 h-3.5" /> Critical Path ({criticalCount})
        </button>
      </div>

      {displayedItems.length === 0 ? (
        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted shadow-sm">
          No activities match the selected view filter.
        </div>
      ) : (
        <>
          {/* Desktop Structured Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app-border text-xs uppercase tracking-wider text-app-muted bg-slate-50 dark:bg-app-surface">
                  <th className="py-3 px-4 font-semibold">WBS Code</th>
                  <th className="py-3 px-4 font-semibold">Activity & Deliverable Name</th>
                  <th className="py-3 px-4 font-semibold">Type / Float</th>
                  <th className="py-3 px-4 font-semibold">Planned Dates</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-sm text-app-fg">
                {displayedItems.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-app-hover/50 transition-colors duration-150">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {item.wbs_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-app-fg max-w-sm truncate">
                      <div className="flex items-center gap-2">
                        {item.is_milestone && <span title="Key Milestone"><Flag className="w-4 h-4 text-emerald-500 flex-shrink-0" /></span>}
                        <span className="truncate">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.is_critical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <Zap className="w-3 h-3" /> Critical (0 Float)
                        </span>
                      ) : item.is_milestone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          Milestone
                        </span>
                      ) : (
                        <span className="text-xs text-app-muted">Standard Activity</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-app-muted font-mono whitespace-nowrap">
                      {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'} —{' '}
                      {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {/* Action buttons visible strictly on hover */}
                      <div className="inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={(e) => handleCopy(item, e)}
                          title="Copy activity dates"
                          className="p-1.5 text-app-muted hover:text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card Layout (< md) */}
          <div className="md:hidden space-y-3">
            {displayedItems.map(item => (
              <div key={item.id} className="group bg-white dark:bg-app-card border border-app-border rounded-xl p-4 hover:border-indigo-500/50 shadow-sm transition-all relative">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {item.is_milestone && <Flag className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded">
                      WBS {item.wbs_code}
                    </span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.status}
                  </span>
                </div>

                <h4 className="font-semibold text-app-fg text-base truncate">{item.name}</h4>

                <div className="mt-2 text-xs flex items-center justify-between text-app-muted font-mono">
                  <span>Start: {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</span>
                  <span>End: {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</span>
                </div>

                {item.is_critical && (
                  <div className="mt-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded p-1.5 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span>Critical Path Activity (Zero Float)</span>
                  </div>
                )}

                {/* Hover-activated actions on mobile card */}
                <div className="mt-3 pt-2 border-t border-app-border flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer shadow-2xs"
                    style={{ cursor: 'pointer' }}
                  >
                    {copiedId === item.id ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Dates</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
