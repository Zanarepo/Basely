'use client'

import React from 'react'
import { Calendar, Edit, Trash2, CheckCircle2, ListTodo, Layers, Zap } from 'lucide-react'
import { IterationBadge } from './IterationBadge'
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

  return (
    <div className="group relative bg-app-card border border-app-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <IterationBadge
            methodology={methodology}
            labelOverride={iteration.labelOverride}
            sequenceNumber={iteration.sequenceNumber}
          />
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

        <div className="flex items-center gap-2 text-xs font-semibold text-app-muted mb-4">
          <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>
            {formatDate(iteration.startDate)} &rarr; {formatDate(iteration.endDate)}
          </span>
          <span className="text-app-muted-text/60">({daysDiff}d / ~{weeksDiff}w)</span>
        </div>
      </div>

      <div className="pt-3 border-t border-app-border/60 flex items-center justify-between text-xs text-app-muted">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Tagged WBS Elements">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
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
    </div>
  )
}
