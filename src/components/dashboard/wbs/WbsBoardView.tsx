import { Plus, Check, X, Trash2, EyeOff, Eye } from 'lucide-react'
import { useState } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { BoardColumnDef } from './workspace/useWbsBoard'

type WbsBoardViewProps = {
  columns: BoardColumnDef[]
  taskOrders: Record<string, string[]>
  addColumn: (name: string) => boolean
  deleteColumn: (name: string) => void
  renameColumn: (oldName: string, newName: string) => boolean
  reorderColumn: (sourceIndex: number, targetIndex: number) => void
  moveTask: (taskId: string, sourceCol: string, targetCol: string, targetIndex: number) => void
  hiddenColumns: Set<string>
  toggleColumnVisibility: (name: string) => void
  elements: WbsElement[]
  workspaceMembers: { userId: string; name: string; email: string }[]
  onSelect: (id: string) => void
  onStatusChange: (id: string, newStatus: string) => void
  hasEditAccess: boolean
}

export function WbsBoardView({ columns, taskOrders, addColumn, deleteColumn, renameColumn, reorderColumn, moveTask, hiddenColumns, toggleColumnVisibility, elements, workspaceMembers, onSelect, onStatusChange, hasEditAccess }: WbsBoardViewProps) {
  
  const [isAddingCol, setIsAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  
  // Column Drag state
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null)
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null)

  const [editingColName, setEditingColName] = useState<string | null>(null)
  const [editingColValue, setEditingColValue] = useState('')

  // Column Drag Handlers
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    if (!hasEditAccess) return
    setDraggedColIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('colIndex', index.toString())
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    if (!hasEditAccess || draggedColIndex === null) return
    e.preventDefault()
    if (draggedColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverColIndex(null)
    setDraggedColIndex(null)
    const sourceStr = e.dataTransfer.getData('colIndex')
    if (sourceStr) {
      const sourceIndex = parseInt(sourceStr, 10)
      if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
        reorderColumn(sourceIndex, targetIndex)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceCol: string) => {
    if (!hasEditAccess) {
      e.preventDefault()
      return
    }
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.setData('sourceCol', sourceCol)
  }

  const handleDragOverColumn = (e: React.DragEvent) => {
    if (!hasEditAccess || !draggedTaskId) return
    e.preventDefault() 
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOverTask = (e: React.DragEvent, targetTaskId: string) => {
    if (!hasEditAccess || !draggedTaskId) return
    e.preventDefault()
    e.stopPropagation() // Prevent column drag over
    e.dataTransfer.dropEffect = 'move'
    if (draggedTaskId !== targetTaskId) {
      setDragOverTaskId(targetTaskId)
    }
  }

  const handleDragLeaveTask = (e: React.DragEvent) => {
    setDragOverTaskId(null)
  }

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDragOverTaskId(null)
    if (!hasEditAccess || !draggedTaskId) return
    
    const sourceCol = e.dataTransfer.getData('sourceCol')
    const task = elements.find(t => t.id === draggedTaskId)
    
    if (task) {
      const targetIndex = taskOrders[targetStatus] ? taskOrders[targetStatus].length : 0
      moveTask(draggedTaskId, sourceCol, targetStatus, targetIndex)
      
      if (task.status !== targetStatus) {
        onStatusChange(draggedTaskId, targetStatus)
      }
    }
    setDraggedTaskId(null)
  }

  const handleDropOnTask = (e: React.DragEvent, targetTaskId: string, targetStatus: string) => {
    e.preventDefault()
    e.stopPropagation() // Prevent column drop
    setDragOverTaskId(null)
    if (!hasEditAccess || !draggedTaskId) return
    
    const sourceCol = e.dataTransfer.getData('sourceCol')
    const task = elements.find(t => t.id === draggedTaskId)
    
    if (task) {
      const targetColOrder = taskOrders[targetStatus] || []
      let targetIndex = targetColOrder.indexOf(targetTaskId)
      if (targetIndex === -1) targetIndex = targetColOrder.length

      moveTask(draggedTaskId, sourceCol, targetStatus, targetIndex)
      
      if (task.status !== targetStatus) {
        onStatusChange(draggedTaskId, targetStatus)
      }
    }
    setDraggedTaskId(null)
  }

  const handleSaveNewColumn = () => {
    if (addColumn(newColName)) {
      setNewColName('')
      setIsAddingCol(false)
    }
  }

  const visibleColumns = columns.filter(c => !hiddenColumns.has(c.name))

  return (
    <div className="flex gap-4 p-5 overflow-x-auto h-[600px] w-full items-start">
      {columns.map((col, colIndex) => {
        if (hiddenColumns.has(col.name)) return null;
        
        const visibleColIndex = visibleColumns.findIndex(c => c.name === col.name);

        // Get tasks for this column and sort them by taskOrders
        const rawColumnTasks = elements.filter((e) => e.status === col.name && e.isWorkPackage)
        const orderArray = taskOrders[col.name] || []
        
        const columnTasks = [...rawColumnTasks].sort((a, b) => {
          const indexA = orderArray.indexOf(a.id)
          const indexB = orderArray.indexOf(b.id)
          if (indexA === -1 && indexB === -1) return 0
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        })



        return (
          <div 
            key={col.name} 
            className={`w-72 shrink-0 flex flex-col bg-app-surface-solid border border-app-border rounded-2xl h-full transition-all duration-300
              ${draggedColIndex === colIndex ? 'opacity-40 border-dashed' : ''}
              ${dragOverColIndex === colIndex ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
            `}
            onDragOver={(e) => {
              if (draggedColIndex !== null) handleColumnDragOver(e, colIndex)
              else handleDragOverColumn(e)
            }}
            onDrop={(e) => {
              if (draggedColIndex !== null) handleColumnDrop(e, colIndex)
              else handleDropOnColumn(e, col.name)
            }}
          >
            <div 
              className={`flex items-center gap-2 mb-2.5 p-3 pb-0 group/colheader ${hasEditAccess ? 'cursor-grab active:cursor-grabbing' : ''}`}
              draggable={hasEditAccess}
              onDragStart={(e) => handleColumnDragStart(e, colIndex)}
              onDragEnd={() => { setDraggedColIndex(null); setDragOverColIndex(null); }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              {editingColName === col.name ? (
                <input
                  autoFocus
                  type="text"
                  value={editingColValue}
                  onChange={(e) => setEditingColValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameColumn(col.name, editingColValue)
                      setEditingColName(null)
                    } else if (e.key === 'Escape') {
                      setEditingColName(null)
                    }
                  }}
                  onBlur={() => {
                    renameColumn(col.name, editingColValue)
                    setEditingColName(null)
                  }}
                  className="text-xs font-semibold text-app-fg bg-app-input border border-indigo-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
                />
              ) : (
                <span
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-default"
                  onDoubleClick={() => {
                    if (hasEditAccess) {
                      setEditingColName(col.name)
                      setEditingColValue(col.name)
                    }
                  }}
                  title="Double-click to rename"
                >
                  {col.name}
                </span>
              )}
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-1.5">
                {columnTasks.length}
              </span>
              
              <div className="ml-auto flex items-center opacity-0 group-hover/colheader:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleColumnVisibility(col.name)}
                  className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-all"
                  title="Hide Column"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                {hasEditAccess && (
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the column "${col.name}"? Tasks inside it will not be deleted, but they will be hidden from the board until their status is changed.`)) {
                        deleteColumn(col.name)
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
            <div className="flex-1 space-y-3 overflow-y-auto p-3 pt-2">
              {columnTasks.map((t) => {
                const owner = workspaceMembers.find((m) => m.userId === t.ownerId)
                const ownerInitials = owner?.name
                  ? owner.name.substring(0, 2).toUpperCase()
                  : '??'

                const parentElement = t.parentId ? elements.find(e => e.id === t.parentId) : null
                const tagText = parentElement ? parentElement.name : 'Work Package'

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    draggable={hasEditAccess}
                    onDragStart={(e) => handleDragStart(e, t.id, col.name)}
                    onDragOver={(e) => handleDragOverTask(e, t.id)}
                    onDragLeave={handleDragLeaveTask}
                    onDrop={(e) => handleDropOnTask(e, t.id, col.name)}
                    onDragEnd={() => { setDraggedTaskId(null); setDragOverTaskId(null); }}
                    className={`bg-app-surface border rounded-xl p-4 shadow-sm transition-all cursor-pointer group select-none 
                      ${draggedTaskId === t.id ? 'opacity-40 border-dashed border-app-border' : 'border-app-border hover:shadow-md'}
                      ${dragOverTaskId === t.id ? 'border-t-2 border-t-indigo-500 transform translate-y-1' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {t.code}
                      </span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {visibleColIndex + 1}/{visibleColumns.length}
                        </span>
                        <span 
                          className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px]"
                          title={tagText}
                        >
                          {tagText}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-app-fg font-medium leading-snug mb-3">
                      {t.name}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      {t.ownerId ? (
                        <div
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[9px] flex items-center justify-center font-semibold shrink-0"
                          title={owner?.name || 'Unknown'}
                        >
                          {ownerInitials}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-app-border flex items-center justify-center text-app-subtle text-[10px]">
                          +
                        </div>
                      )}
                      
                      {/* Workflow stage progress bar */}
                      <div className="w-16 h-1.5 bg-app-muted-surface rounded-full overflow-hidden" title={`Workflow Stage: ${visibleColIndex + 1} of ${visibleColumns.length}`}>
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(((visibleColIndex + 1) / visibleColumns.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Add Column Button / Form */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        {hiddenColumns.size > 0 && (
          <div className="w-full bg-app-surface-solid border border-app-border rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Hidden Columns</h3>
            <div className="flex flex-col gap-2">
              {Array.from(hiddenColumns).map(name => {
                const colDef = columns.find(c => c.name === name)
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
    </div>
  )
}
