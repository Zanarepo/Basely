'use client'

import React from 'react'
import { Layers, CheckCircle2 } from 'lucide-react'
import { getDualLabels } from '@/lib/releases/epic-link-constants'

export interface EpicCoverageWidgetProps {
  epicNames: string[]
  taggedWbsCount: number
  taggedActivityCount: number
  methodology?: string | null
}

export function EpicCoverageWidget({
  epicNames,
  taggedWbsCount,
  taggedActivityCount,
  methodology = 'Agile',
}: EpicCoverageWidgetProps) {
  const labels = getDualLabels(methodology)
  const totalItems = taggedWbsCount + taggedActivityCount

  return (
    <div className="mt-3 pt-3 border-t border-app-border/60 space-y-2 text-xs">
      <div className="flex items-center justify-between text-app-muted">
        <span className="flex items-center gap-1.5 font-medium">
          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          {labels.epicsTerm} Coverage
        </span>
        <span className="text-app-fg font-semibold">
          {totalItems} {totalItems === 1 ? labels.storyTerm : labels.storiesTerm}
        </span>
      </div>

      {epicNames.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {epicNames.slice(0, 3).map((epic, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 shadow-2xs"
            >
              <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              {epic}
            </span>
          ))}
          {epicNames.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-app-surface text-app-muted border border-app-border">
              +{epicNames.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-app-muted italic text-[11px]">No {labels.epicsTerm.toLowerCase()} assigned to this {labels.sprintTerm.toLowerCase()}</p>
      )}
    </div>
  )
}
