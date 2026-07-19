import { Undo2, Redo2, Maximize2, Minimize2, Plus, Search, ListTree, Kanban, Table2, Upload, Trash2 } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'

export type WbsViewType = 'tree' | 'board' | 'grid'

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
}: WbsToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-app-surface border border-app-border rounded-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        {/* View Toggle */}
        <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            onClick={() => onViewChange('tree')}
            title="Tree View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <ListTree className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">Tree</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('board')}
            title="Board View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <Kanban className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">Board</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${currentView === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-app-fg hover:bg-app-hover'}`}
          >
            <Table2 className="h-4 w-4" />
            <span className="text-xs font-medium hidden md:inline">Grid</span>
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

        {/* Node Expand/Collapse buttons */}
        <div className="flex rounded-xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            onClick={handleExpandAll}
            title="Expand all elements"
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg transition-colors cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            title="Collapse all elements"
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg transition-colors cursor-pointer"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Add sibling root button */}
        {hasEditAccess && (
          <>
            {selectedIds.length > 0 && handleBulkDelete && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.length})
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
            <button
              type="button"
              onClick={() => handleCreateElement(null)}
              className="btn-primary py-1.5 px-3 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Root Element
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
          className="w-full pl-10 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
        />
      </div>
    </div>
  )
}
