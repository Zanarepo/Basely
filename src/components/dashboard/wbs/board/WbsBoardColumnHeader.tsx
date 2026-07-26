import { EyeOff, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface WbsBoardColumnHeaderProps {
  colName: string
  color: string
  taskCount: number
  hasEditAccess: boolean
  draggedColIndex: number | null
  colIndex: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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
  isCollapsed = false,
  onToggleCollapse,
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
      className={`flex items-center gap-2 mb-2.5 p-3.5 sm:p-3 pb-2 sm:pb-0 group/colheader ${hasEditAccess ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={hasEditAccess}
      onDragStart={(e) => onDragStart(e, colIndex)}
      onDragEnd={onDragEnd}
    >
      {/* Mobile Collapse Accordion Button */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="md:hidden p-1 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand column' : 'Collapse column'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-indigo-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-500" />
          )}
        </button>
      )}

      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
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
          className="text-xs font-semibold text-app-fg bg-app-input border border-indigo-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28"
        />
      ) : (
        <span
          className="text-sm md:text-xs font-bold md:font-semibold text-slate-800 dark:text-slate-200 cursor-default truncate"
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
      <span className="text-xs md:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 md:py-0">
        {taskCount}
      </span>
      
      <div className="ml-auto flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/colheader:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => toggleColumnVisibility(colName)}
          className="p-1.5 sm:p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-all"
          title="Hide Column"
        >
          <EyeOff className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
        {hasEditAccess && (
          <button 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete the column "${colName}"? Tasks inside it will not be deleted, but they will be hidden from the board until their status is changed.`)) {
                deleteColumn(colName)
              }
            }}
            className="p-1.5 sm:p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all"
            title="Delete Column"
          >
            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
