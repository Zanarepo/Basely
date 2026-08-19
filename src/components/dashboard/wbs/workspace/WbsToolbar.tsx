import { useState } from 'react'
import { Undo2, Redo2, Maximize2, Minimize2, Plus, Search, ListTree, Kanban, Table2, Upload, Trash2, DollarSign, ChevronDown, Layers, Archive } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Iteration } from '@/lib/releases/types'
import { useUserPersona } from '@/hooks/use-user-persona'

export type WbsViewType = 'tree' | 'board' | 'grid' | 'raci' | 'unassigned'

type WbsToolbarProps = {
  hasEditAccess: boolean
  isPending: boolean
  undoStack: WbsElement[][]
  redoStack: WbsElement[][]
  searchQuery: string
  setSearchQuery: (q: string) => void
  currentView: WbsViewType
  onViewChange: (view: WbsViewType) => void
  handleUndo: () => void
  handleRedo: () => void
  handleExpandAll: () => void
  handleCollapseAll: () => void
  handleCreateElement: (parentId: string | null) => void
  onImport?: () => void
  selectedIds?: string[]
  handleBulkDelete?: () => void
  showFinancials?: boolean
  onToggleFinancials?: () => void
  onCreateIteration?: () => void
  iterationButtonLabel?: string
  iterations?: Iteration[]
  handleBulkAssignIteration?: (iterationId: string | null) => void
  hideCompleted?: boolean
  onToggleHideCompleted?: () => void
  completedCount?: number
}

export function WbsToolbar({
  hasEditAccess,
  isPending,
  undoStack,
  redoStack,
  searchQuery,
  setSearchQuery,
  currentView,
  onViewChange,
  handleUndo,
  handleRedo,
  handleExpandAll,
  handleCollapseAll,
  handleCreateElement,
  onImport,
  selectedIds = [],
  handleBulkDelete,
  showFinancials = false,
  onToggleFinancials,
  onCreateIteration,
  iterationButtonLabel,
  iterations = [],
  handleBulkAssignIteration,
  hideCompleted = false,
  onToggleHideCompleted,
  completedCount = 0,
}: WbsToolbarProps) {
  const { isProductMode, addButtonText, showBudgetControls } = useUserPersona()
  const [isAllExpanded, setIsAllExpanded] = useState(true)
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)

  const viewTabLabel = isProductMode ? 'List' : 'Hierarchy'

  const toggleExpandCollapse = () => {
    if (isAllExpanded) {
      handleCollapseAll()
      setIsAllExpanded(false)
    } else {
      handleExpandAll()
      setIsAllExpanded(true)
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-app-surface border border-app-border rounded-2xl backdrop-blur-md relative z-30">
      <div className="flex flex-wrap items-center gap-3">
        {/* View Toggle */}
        <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            onClick={() => onViewChange('tree')}
            title={`${viewTabLabel} View`}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'tree' ? 'bg-white text-violet-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <ListTree className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">{viewTabLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('board')}
            title="Board View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'board' ? 'bg-white text-violet-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <Kanban className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">Board</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <Table2 className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('raci')}
            title="RACI Matrix"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'raci' ? 'bg-white text-violet-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <ListTree className="h-4 w-4 rotate-90" />
            <span className="text-xs font-medium hidden md:inline">RACI Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('unassigned')}
            title="Unassigned Work"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'unassigned' ? 'bg-white text-amber-600 shadow-sm' : 'text-app-fg hover:bg-amber-500/10'}`}
          >
            <Search className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium hidden md:inline">Unassigned</span>
          </button>
        </div>

        {/* Undo/Redo buttons */}
        <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            disabled={undoStack.length === 0 || !hasEditAccess || isPending}
            onClick={handleUndo}
            title="Undo last change"
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={redoStack.length === 0 || !hasEditAccess || isPending}
            onClick={handleRedo}
            title="Redo change"
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Morphed Single Expand/Collapse Toggle Button */}
        <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            onClick={toggleExpandCollapse}
            title={isAllExpanded ? "Collapse All" : "Expand All"}
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg transition-colors cursor-pointer flex items-center gap-1"
          >
            {isAllExpanded ? (
              <Minimize2 className="h-4 w-4 text-violet-500" />
            ) : (
              <Maximize2 className="h-4 w-4 text-violet-500" />
            )}
          </button>
        </div>

        {/* Financials Toggle (Hidden in Product / Agile mode) */}
        {showBudgetControls && onToggleFinancials && (
          <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
            <button
              type="button"
              onClick={onToggleFinancials}
              title={showFinancials ? "Hide Budget" : "Show Budget"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                showFinancials 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm' 
                  : 'text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium hidden md:inline">
                {showFinancials ? "Hide Budget" : "Show Budget"}
              </span>
            </button>
          </div>
        )}

        {/* Add primary root button (Role-Adaptive: + Add Epic vs + Add Phase) */}
        {hasEditAccess && (
          <>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                {handleBulkAssignIteration && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setBulkAssignOpen(!bulkAssignOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span>Assign ({selectedIds.length})</span>
                      <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                    </button>

                    {bulkAssignOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setBulkAssignOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
                          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            Assign Selected Scope ({selectedIds.length})
                          </div>

                          {iterations.length === 0 ? (
                            <div className="px-2.5 py-2 text-xs text-slate-400 italic">No Sprints / Phases created yet</div>
                          ) : (
                            iterations.map((iter) => (
                              <button
                                key={iter.id}
                                type="button"
                                onClick={() => {
                                  handleBulkAssignIteration(iter.id)
                                  setBulkAssignOpen(false)
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 transition-all cursor-pointer"
                              >
                                <span className="truncate">{iter.name}</span>
                              </button>
                            ))
                          )}

                          <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleBulkAssignIteration(null)
                                setBulkAssignOpen(false)
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            >
                              <span>Unassign (Move to Backlog)</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {handleBulkDelete && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.length})
                  </button>
                )}
              </div>
            )}
            {onToggleHideCompleted && (
              <button
                type="button"
                onClick={onToggleHideCompleted}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative shrink-0 shadow-2xs ${
                  hideCompleted
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                    : 'bg-app-surface text-app-subtle border-app-border hover:text-app-fg hover:bg-app-hover'
                }`}
                title={hideCompleted ? `Showing active work (${completedCount} completed items archived)` : `Hide ${completedCount} completed items`}
              >
                <Archive className="w-4 h-4" />
                {completedCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-extrabold text-white shadow-xs">
                    {completedCount}
                  </span>
                )}
              </button>
            )}
            {onImport && (
              <button
                type="button"
                onClick={onImport}
                className="btn-ghost-accent py-1.5 px-3 rounded-xl flex items-center gap-1.5"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
            )}
            {onCreateIteration && (
              <button
                type="button"
                onClick={onCreateIteration}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{iterationButtonLabel || 'Create Sprint'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCreateElement(null)}
              className="btn-primary py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              {addButtonText}
            </button>
          </>
        )}
      </div>

      {/* Search filter input */}
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-subtle pointer-events-none" />
        <input
          type="text"
          placeholder="Search WBS elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
        />
      </div>
    </div>
  )
}
