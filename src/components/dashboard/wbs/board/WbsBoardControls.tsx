import { Plus, Check, X, Eye } from 'lucide-react'
import { useState } from 'react'
import type { BoardColumnDef } from '../workspace/useWbsBoard'

interface WbsBoardControlsProps {
  hiddenColumns: Set<string>
  columns: BoardColumnDef[]
  hasEditAccess: boolean
  toggleColumnVisibility: (name: string) => void
  addColumn: (name: string) => boolean
}

export function WbsBoardControls({
  hiddenColumns,
  columns,
  hasEditAccess,
  toggleColumnVisibility,
  addColumn
}: WbsBoardControlsProps) {
  const [isAddingCol, setIsAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')

  const handleSaveNewColumn = () => {
    if (addColumn(newColName)) {
      setNewColName('')
      setIsAddingCol(false)
    }
  }

  return (
    <div className="w-72 shrink-0 flex flex-col gap-4">
      {hiddenColumns.size > 0 && (
        <div className="w-full bg-app-surface-solid border border-app-border rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Hidden Columns</h3>
          <div className="flex flex-col gap-2">
            {Array.from(hiddenColumns).map((name) => {
              const colDef = columns.find((c) => c.name === name)
              if (!colDef) return null
              return (
                <div key={name} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colDef.color }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{name}</span>
                  </div>
                  <button
                    onClick={() => toggleColumnVisibility(name)}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-all"
                    title="Unhide Column"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {hasEditAccess && (
        <div className="w-full">
          {isAddingCol ? (
          <div className="w-full bg-app-surface-solid border border-app-border rounded-2xl p-3">
            <input
              autoFocus
              type="text"
              placeholder="Column Name"
              className="w-full mb-2 px-3 py-1.5 text-sm bg-app-input border border-indigo-500 rounded-lg text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNewColumn()}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 flex justify-center items-center py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                onClick={handleSaveNewColumn}
              >
                <Check className="w-3 h-3 mr-1" /> Save
              </button>
              <button
                type="button"
                className="flex-1 flex justify-center items-center py-1.5 bg-app-muted-surface hover:bg-app-hover text-app-subtle rounded-lg text-xs font-semibold cursor-pointer"
                onClick={() => setIsAddingCol(false)}
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCol(true)}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-app-subtle bg-app-surface border border-dashed border-app-border rounded-2xl hover:bg-app-hover hover:border-indigo-500/50 hover:text-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
          )}
        </div>
      )}
    </div>
  )
}
