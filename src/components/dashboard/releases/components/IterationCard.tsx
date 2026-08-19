'use client'

import React from 'react'
import { Calendar, Edit, Trash2, CheckCircle2, ListTodo, Layers, Zap } from 'lucide-react'
import { IterationBadge } from './IterationBadge'
import { EpicCoverageWidget } from './EpicCoverageWidget'
import type { Iteration } from '@/lib/releases/types'

interface IterationCardProps {
  iteration: Iteration
  methodology?: string | null
  hasEditAccess: boolean
  onEdit: (iteration: Iteration) => void
  onDelete: (id: string) => void
}

export function IterationCard({
  iteration,
  methodology,
  hasEditAccess,
  onEdit,
  onDelete,
}: IterationCardProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate approximate working duration
  const start = new Date(iteration.startDate)
  const end = new Date(iteration.endDate)
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
  const weeksDiff = (daysDiff / 7).toFixed(1)

  const totalItems = (iteration.taggedWbsCount || 0) + (iteration.taggedActivityCount || 0)
  const completedCount = iteration.completedCount || 0
  const completionPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
  const isSprintDone = iteration.status === 'completed' || (totalItems > 0 && completedCount === totalItems)

  return (
    <div className="group relative bg-app-card border border-app-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <IterationBadge
              methodology={methodology}
              labelOverride={iteration.labelOverride}
              sequenceNumber={iteration.sequenceNumber}
            />

            {/* Sprint Status Badge */}
            {isSprintDone ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Completed
              </span>
            ) : iteration.status === 'active' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <Zap className="w-3 h-3 text-amber-500" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Planned
              </span>
            )}
          </div>

          {hasEditAccess && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => onEdit(iteration)}
                className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
                title="Edit Iteration"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(iteration.id)}
                className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete Iteration"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-app-fg tracking-tight mb-2 truncate" title={iteration.name}>
          {iteration.name}
        </h3>

        <div className="flex items-center gap-2 text-xs font-semibold text-app-muted mb-3">
          <Calendar className="h-3.5 w-3.5 text-violet-500 shrink-0" />
          <span>
            {formatDate(iteration.startDate)} &rarr; {formatDate(iteration.endDate)}
          </span>
          <span className="text-app-muted-text/60">({daysDiff}d / ~{weeksDiff}w)</span>
        </div>

        {/* Deliverables Completion Progress Bar */}
        {totalItems > 0 && (
          <div className="mb-3 space-y-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600 dark:text-slate-400">Deliverables Progress</span>
              <span className={isSprintDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}>
                {completedCount}/{totalItems} Done ({completionPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full transition-all duration-500 ${isSprintDone ? 'bg-emerald-500' : 'bg-purple-600'}`}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-app-border/60 flex items-center justify-between text-xs text-app-muted">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Tagged WBS Elements">
            <Layers className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-semibold text-app-fg">{iteration.taggedWbsCount || 0}</span> WBS
          </div>
          <div className="flex items-center gap-1" title="Tagged Schedule Activities">
            <ListTodo className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-app-fg">{iteration.taggedActivityCount || 0}</span> Activities
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-app-muted bg-app-surface px-2 py-0.5 rounded">
          Seq #{iteration.sequenceNumber}
        </span>
      </div>

      <EpicCoverageWidget
        epicNames={iteration.epicNames || []}
        taggedWbsCount={iteration.taggedWbsCount || 0}
        taggedActivityCount={iteration.taggedActivityCount || 0}
        methodology={methodology}
      />
    </div>
  )
}
