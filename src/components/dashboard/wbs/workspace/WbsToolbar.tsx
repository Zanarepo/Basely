import { Undo2, Redo2, Maximize2, Minimize2, Plus, Search } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'

type WbsToolbarProps = {
  hasEditAccess: boolean
  isPending: boolean
  undoStack: WbsElement[][]
  redoStack: WbsElement[][]
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleUndo: () => void
  handleRedo: () => void
  handleExpandAll: () => void
  handleCollapseAll: () => void
  handleCreateElement: (parentId: string | null) => void
}

export function WbsToolbar({
  hasEditAccess,
  isPending,
  undoStack,
  redoStack,
  searchQuery,
  setSearchQuery,
  handleUndo,
  handleRedo,
  handleExpandAll,
  handleCollapseAll,
  handleCreateElement,
}: WbsToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-app-surface border border-app-border rounded-2xl backdrop-blur-md">
      <div className="flex items-center gap-3">
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
          <button
            type="button"
            onClick={() => handleCreateElement(null)}
            className="btn-ghost-accent py-1.5 px-3 rounded-xl flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Root Element
          </button>
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
