'use client'

import React from 'react'
import { Rocket, Edit, Trash2, CheckCircle2, AlertCircle, Clock, RotateCcw, XCircle, ChevronRight, Layers } from 'lucide-react'
import { IterationBadge } from './IterationBadge'
import type { Release, ReleaseStatus } from '@/lib/releases/types'

interface ReleaseCardProps {
  release: Release
  methodology?: string | null
  hasEditAccess: boolean
  onSelect: (release: Release) => void
  onEdit: (release: Release, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

const STATUS_CONFIG: Record<ReleaseStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  planned: {
    label: 'Planned',
    bg: 'bg-blue-500/10 border-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    icon: <Clock className="h-3.5 w-3.5" />
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-500/10 border-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    icon: <AlertCircle className="h-3.5 w-3.5" />
  },
  released: {
    label: 'Released',
    bg: 'bg-emerald-500/10 border-emerald-500/25',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />
  },
  rolled_back: {
    label: 'Rolled Back',
    bg: 'bg-purple-500/10 border-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    icon: <RotateCcw className="h-3.5 w-3.5" />
  },
  canceled: {
    label: 'Canceled',
    bg: 'bg-rose-500/10 border-rose-500/25',
    text: 'text-rose-600 dark:text-rose-400',
    icon: <XCircle className="h-3.5 w-3.5" />
  }
}

export function ReleaseCard({
  release,
  methodology,
  hasEditAccess,
  onSelect,
  onEdit,
  onDelete,
}: ReleaseCardProps) {
  const status = STATUS_CONFIG[release.status] || STATUS_CONFIG.planned

  const criteria = release.exitCriteria || []
  const metCount = criteria.filter(c => c.isMet).length
  const totalCriteria = criteria.length
  const completionPercentage = totalCriteria > 0 ? Math.round((metCount / totalCriteria) * 100) : 0

  const handleCardClick = () => {
    onSelect(release)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-app-card border border-app-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.bg} ${status.text}`}>
            {status.icon}
            <span>{status.label}</span>
          </span>

          {hasEditAccess && (
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={e => onEdit(release, e)}
                className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
                title="Edit Release Properties"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={e => onDelete(release.id, e)}
                className="p-1.5 rounded-lg text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete Release"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 truncate">
            <Rocket className="h-5 w-5 text-indigo-500 shrink-0" />
            <h3 className="text-lg font-extrabold text-app-fg tracking-tight truncate" title={release.name}>
              {release.name}
            </h3>
          </div>
          <span className="text-xs font-semibold text-app-muted-text/60 bg-app-surface px-2 py-0.5 rounded shrink-0">
            Rel #{release.sequenceNumber}
          </span>
        </div>

        {release.objective ? (
          <p className="text-xs text-app-muted line-clamp-2 mb-4 font-normal">
            {release.objective}
          </p>
        ) : (
          <p className="text-xs text-app-muted/50 italic mb-4">
            No specific objectives documented.
          </p>
        )}

        {/* Linked Iterations */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Layers className="h-3 w-3 text-teal-400" />
            Linked Iterations ({(release.iterations || []).length})
          </div>
          {(release.iterations || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {(release.iterations || []).slice(0, 3).map(iter => (
                <IterationBadge
                  key={iter.id}
                  methodology={methodology}
                  labelOverride={iter.labelOverride}
                  sequenceNumber={iter.sequenceNumber}
                  name={iter.name}
                  size="sm"
                />
              ))}
              {(release.iterations || []).length > 3 && (
                <span className="text-xs font-semibold text-app-muted px-2 py-0.5 bg-app-surface rounded-full border border-app-border">
                  +{(release.iterations || []).length - 3} more
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-app-muted-text/60 italic">
              No iterations mapped yet.
            </div>
          )}
        </div>
      </div>

      {/* Exit Criteria Progress Footer */}
      <div className="pt-4 border-t border-app-border/60">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-app-muted">Exit Criteria</span>
          <span className={metCount === totalCriteria && totalCriteria > 0 ? 'text-emerald-500 font-extrabold' : 'text-app-fg'}>
            {metCount} of {totalCriteria} met ({completionPercentage}%)
          </span>
        </div>
        <div className="h-2 w-full bg-app-surface rounded-full overflow-hidden border border-app-border/50">
          <div
            className={`h-full transition-all duration-300 ${
              completionPercentage === 100
                ? 'bg-emerald-500'
                : completionPercentage > 50
                ? 'bg-indigo-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-end text-xs font-semibold text-indigo-500 group-hover:text-indigo-600 transition-colors gap-1">
          <span>Inspect Release Architecture</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  )
}
