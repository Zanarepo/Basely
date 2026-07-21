import { EyeOff, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface WbsBoardColumnHeaderProps {
  colName: string
  color: string
  taskCount: number
  hasEditAccess: boolean
  draggedColIndex: number | null
  colIndex: number
  renameColumn: (oldName: string, newName: string) => boolean
  toggleColumnVisibility: (name: string) => void
  deleteColumn: (name: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

export function WbsBoardColumnHeader({
  colName,
  color,
  taskCount,
  hasEditAccess,
  draggedColIndex,
  colIndex,
  renameColumn,
  toggleColumnVisibility,
  deleteColumn,
  onDragStart,
  onDragEnd,
}: WbsBoardColumnHeaderProps) {
  const [editingColName, setEditingColName] = useState<string | null>(null)
  const [editingColValue, setEditingColValue] = useState('')

  return (
    <div 
      className={`flex items-center gap-2 mb-2.5 p-3 pb-0 group/colheader ${hasEditAccess ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={hasEditAccess}
      onDragStart={(e) => onDragStart(e, colIndex)}
      onDragEnd={onDragEnd}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {editingColName === colName ? (
        <input
          autoFocus
          type="text"
          value={editingColValue}
          onChange={(e) => setEditingColValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              renameColumn(colName, editingColValue)
              setEditingColName(null)
            } else if (e.key === 'Escape') {
              setEditingColName(null)
            }
          }}
          onBlur={() => {
            renameColumn(colName, editingColValue)
            setEditingColName(null)
          }}
          className="text-xs font-semibold text-app-fg bg-app-input border border-indigo-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
        />
      ) : (
        <span
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-default"
          onDoubleClick={() => {
            if (hasEditAccess) {
              setEditingColName(colName)
              setEditingColValue(colName)
            }
          }}
          title="Double-click to rename"
        >
          {colName}
        </span>
      )}
      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-1.5">
        {taskCount}
      </span>
      
      <div className="ml-auto flex items-center opacity-0 group-hover/colheader:opacity-100 transition-opacity">
        <button
          onClick={() => toggleColumnVisibility(colName)}
          className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-all"
          title="Hide Column"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
        {hasEditAccess && (
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete the column "${colName}"? Tasks inside it will not be deleted, but they will be hidden from the board until their status is changed.`)) {
                deleteColumn(colName)
              }
            }}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all ml-0.5"
            title="Delete Column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
