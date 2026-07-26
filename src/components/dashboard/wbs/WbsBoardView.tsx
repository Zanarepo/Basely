import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { BoardColumnDef } from './workspace/useWbsBoard'
import { useBoardDragAndDrop } from './board/hooks/useBoardDragAndDrop'
import { WbsBoardCard } from './board/WbsBoardCard'
import { WbsBoardColumnHeader } from './board/WbsBoardColumnHeader'
import { WbsBoardControls } from './board/WbsBoardControls'

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
  onAddCard?: (status: string) => void
  onDeleteCard?: (id: string) => void
  hasEditAccess: boolean
  callerRole?: string
  callerUserId?: string
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function WbsBoardView({
  columns,
  taskOrders,
  addColumn,
  deleteColumn,
  renameColumn,
  reorderColumn,
  moveTask,
  hiddenColumns,
  toggleColumnVisibility,
  elements,
  onSelect,
  onStatusChange,
  onAddCard,
  onDeleteCard,
  hasEditAccess,
  callerRole,
  callerUserId,
  onShowToast
}: WbsBoardViewProps) {
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set())

  const toggleColCollapse = (colName: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev)
      if (next.has(colName)) next.delete(colName)
      else next.add(colName)
      return next
    })
  }

  const {
    dragStates: { draggedTaskId, dragOverTaskId, draggedColIndex, dragOverColIndex, touchPos },
    setDragStates: { setDraggedTaskId, setDragOverTaskId, setDraggedColIndex, setDragOverColIndex },
    handlers: {
      handleColumnDragStart,
      handleColumnDragOver,
      handleColumnDrop,
      handleDragStart,
      handleDragOverColumn,
      handleDragOverTask,
      handleDragLeaveTask,
      handleDropOnColumn,
      handleDropOnTask,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    }
  } = useBoardDragAndDrop({
    elements,
    taskOrders,
    hasEditAccess,
    callerRole,
    callerUserId,
    reorderColumn,
    moveTask,
    onStatusChange,
    onShowToast
  })

  const visibleColumns = columns.filter((c) => !hiddenColumns.has(c.name))
  const draggedTask = draggedTaskId ? elements.find(e => e.id === draggedTaskId) : null

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-4 p-4 md:p-5 overflow-y-auto md:overflow-x-auto h-[750px] md:h-[600px] w-full items-stretch md:items-start relative">
      {/* Floating Touch Drag Ghost Card */}
      {touchPos && draggedTask && (
        <div
          className="fixed z-[9999] pointer-events-none p-3 w-64 rounded-2xl bg-app-surface border-2 border-indigo-500 shadow-2xl scale-105 opacity-95 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 backdrop-blur-md"
          style={{ left: `${touchPos.x}px`, top: `${touchPos.y}px` }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
              {draggedTask.code}
            </span>
            <span className="text-[10px] font-bold text-indigo-500 animate-pulse">DRAGGING</span>
          </div>
          <span className="text-sm font-bold text-app-fg truncate">
            {draggedTask.name}
          </span>
        </div>
      )}

      {columns.map((col, colIndex) => {
        if (hiddenColumns.has(col.name)) return null
        
        const visibleColIndex = visibleColumns.findIndex((c) => c.name === col.name)
        const isCollapsed = collapsedCols.has(col.name)

        const rawColumnTasks = elements.filter((e) => e.status === col.name && e.isWorkPackage && e.duration !== 0)
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
            data-board-column={col.name}
            className={`w-full md:w-72 shrink-0 flex flex-col bg-app-surface-solid border border-app-border rounded-2xl md:h-full transition-all duration-300
              ${draggedColIndex === colIndex ? 'opacity-40 border-dashed' : ''}
              ${dragOverColIndex === colIndex ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-lg ring-2 ring-indigo-500/30' : ''}
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
            <WbsBoardColumnHeader
              colName={col.name}
              color={col.color}
              taskCount={columnTasks.length}
              hasEditAccess={hasEditAccess}
              draggedColIndex={draggedColIndex}
              colIndex={colIndex}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleColCollapse(col.name)}
              renameColumn={renameColumn}
              toggleColumnVisibility={toggleColumnVisibility}
              deleteColumn={deleteColumn}
              onDragStart={handleColumnDragStart}
              onDragEnd={() => { setDraggedColIndex(null); setDragOverColIndex(null); }}
            />

            {/* Column Content — hidden on mobile if collapsed */}
            <div className={`flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-3 pt-2 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
              {columnTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-app-subtle border-2 border-dashed border-app-border/40 rounded-xl">
                  No cards in this stage
                </div>
              ) : (
                columnTasks.map((t) => (
                  <WbsBoardCard
                    key={t.id}
                    task={t}
                    colName={col.name}
                    elements={elements}
                    visibleColIndex={visibleColIndex}
                    visibleColumnsLength={visibleColumns.length}
                    hasEditAccess={hasEditAccess}
                    callerRole={callerRole}
                    callerUserId={callerUserId}
                    draggedTaskId={draggedTaskId}
                    dragOverTaskId={dragOverTaskId}
                    onSelect={onSelect}
                    onDeleteCard={onDeleteCard}
                    onDragStart={handleDragStart}
                    onDragOverTask={handleDragOverTask}
                    onDragLeaveTask={handleDragLeaveTask}
                    onDropOnTask={handleDropOnTask}
                    onDragEnd={() => { setDraggedTaskId(null); setDragOverTaskId(null); }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                ))
              )}
              
              {hasEditAccess && onAddCard && (
                <button
                  type="button"
                  onClick={() => onAddCard(col.name)}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-2.5 mt-2 rounded-xl border-2 border-dashed border-app-border text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors text-sm font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              )}
            </div>
          </div>
        )
      })}

      <WbsBoardControls
        hiddenColumns={hiddenColumns}
        columns={columns}
        hasEditAccess={hasEditAccess}
        toggleColumnVisibility={toggleColumnVisibility}
        addColumn={addColumn}
      />
    </div>
  )
}
