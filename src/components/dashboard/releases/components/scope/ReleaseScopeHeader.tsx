'use client'

import { Sparkles, Plus, FolderKanban } from 'lucide-react'

interface ReleaseScopeHeaderProps {
  labels: { releaseTerm: string; sprintsTerm: string; epicsTerm: string; releaseNotesTerm: string; epicTerm: string }
  hasEditAccess: boolean
  showAddForm: boolean
  setShowAddForm: (val: boolean) => void
  setShowAiModal: (val: boolean) => void
  viewMode: 'all' | 'by_epic'
  setViewMode: (val: 'all' | 'by_epic') => void
  totalScopeCount: number
  totalEpicsCount: number
}

export function ReleaseScopeHeader({
  labels,
  hasEditAccess,
  showAddForm,
  setShowAddForm,
  setShowAiModal,
  viewMode,
  setViewMode,
  totalScopeCount,
  totalEpicsCount
}: ReleaseScopeHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-app-fg">Unified {labels.releaseTerm} Scope & GTM Automation</h4>
            <p className="text-xs text-app-muted font-normal">
              Items tagged to mapped {labels.sprintsTerm} are automatically rolled in under their parent {labels.epicsTerm}. Generate {labels.releaseNotesTerm} with Praz-AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>AI {labels.releaseNotesTerm}</span>
          </button>

          {hasEditAccess && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Scope Override</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Filter Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 bg-app-surface p-1 rounded-xl border border-app-border">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-app-muted hover:text-app-fg'
            }`}
          >
            All Scope Items ({totalScopeCount})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('by_epic')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'by_epic' ? 'bg-purple-600 text-white shadow-sm' : 'text-app-muted hover:text-app-fg'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Group by {labels.epicTerm} ({totalEpicsCount})
          </button>
        </div>
      </div>
    </>
  )
}
