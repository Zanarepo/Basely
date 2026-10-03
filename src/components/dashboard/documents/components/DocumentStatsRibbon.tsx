import React from 'react'
import { BookOpen, Clock, Layers, CheckCircle2, RefreshCw, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'

interface DocumentStatsRibbonProps {
  freeText: Record<string, string>
  allSectionsCount: number
  isDirty: boolean
  isPending: boolean
  isSnapshot?: boolean
  onToggleExpandAll?: () => void
  isAllCollapsed?: boolean
  onResetLayout?: () => void
}

export default function DocumentStatsRibbon({
  freeText,
  allSectionsCount,
  isDirty,
  isPending,
  isSnapshot = false,
  onToggleExpandAll,
  isAllCollapsed = false,
  onResetLayout
}: DocumentStatsRibbonProps) {
  // Calculate total word count from all freeText entries (excluding internal keys)
  const totalWords = Object.entries(freeText)
    .filter(([key]) => !key.startsWith('__'))
    .map(([, val]) => (typeof val === 'string' ? val.replace(/[#*`_|[\]()-]/g, ' ') : ''))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  // Estimated reading time (average 200 words per minute)
  const readingTimeMin = Math.max(1, Math.ceil(totalWords / 200))

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 mb-6 bg-app-surface/80 backdrop-blur-xs border border-app-border rounded-xl shadow-2xs text-xs font-medium text-app-fg transition-all">
      {/* Left Metadata Metrics */}
      <div className="flex items-center flex-wrap gap-4 text-app-muted">
        {/* Word Count */}
        <div className="flex items-center gap-1.5" title="Total word count in document">
          <BookOpen className="w-3.5 h-3.5 text-violet-500" />
          <span className="font-bold text-app-fg">{totalWords.toLocaleString()}</span>
          <span className="text-[11px]">words</span>
        </div>

        <div className="w-px h-3.5 bg-app-border" />

        {/* Estimated Reading Time */}
        <div className="flex items-center gap-1.5" title="Estimated reading time at 200 WPM">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold text-app-fg">{readingTimeMin}</span>
          <span className="text-[11px]">{readingTimeMin === 1 ? 'min read' : 'mins read'}</span>
        </div>

        <div className="w-px h-3.5 bg-app-border" />

        {/* Section Count */}
        <div className="flex items-center gap-1.5" title="Active section blocks in document">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-bold text-app-fg">{allSectionsCount}</span>
          <span className="text-[11px]">{allSectionsCount === 1 ? 'section' : 'sections'}</span>
        </div>
      </div>

      {/* Right Controls: Reset Layout, Save Status & Collapse All Toggle */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Reset Layout Button */}
        {onResetLayout && !isSnapshot && (
          <button
            type="button"
            onClick={onResetLayout}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer shadow-2xs"
            title="Reset document section order to master template defaults"
          >
            <RotateCcw className="w-3 h-3 text-amber-500" />
            <span>Reset Layout</span>
          </button>
        )}

        {/* Master Collapse/Expand All Sections Button */}
        {onToggleExpandAll && (
          <button
            type="button"
            onClick={onToggleExpandAll}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-app-muted-surface hover:bg-app-hover border border-app-border text-app-fg transition-all cursor-pointer shadow-2xs"
            title={isAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
          >
            {isAllCollapsed ? (
              <>
                <ChevronDown className="w-3 h-3 text-violet-500" />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3 text-app-muted" />
                <span>Collapse All</span>
              </>
            )}
          </button>
        )}

        {/* Live Auto-Save Status Badge */}
        {!isSnapshot && (
          <div className="flex items-center text-[11px]">
            {isPending ? (
              <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin text-violet-500" />
                <span>Saving...</span>
              </span>
            ) : isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Unsaved Edits</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Saved</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
