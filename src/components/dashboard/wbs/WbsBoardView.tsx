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

  const {
    dragStates: { draggedTaskId, dragOverTaskId, draggedColIndex, dragOverColIndex },
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

  return (
    <div className="flex gap-4 p-5 overflow-x-auto h-[600px] w-full items-start">
      {columns.map((col, colIndex) => {
        if (hiddenColumns.has(col.name)) return null
        
        const visibleColIndex = visibleColumns.findIndex((c) => c.name === col.name)

        // Get tasks for this column and sort them by taskOrders
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
            <WbsBoardColumnHeader
              colName={col.name}
              color={col.color}
              taskCount={columnTasks.length}
              hasEditAccess={hasEditAccess}
              draggedColIndex={draggedColIndex}
              colIndex={colIndex}
              renameColumn={renameColumn}
              toggleColumnVisibility={toggleColumnVisibility}
              deleteColumn={deleteColumn}
              onDragStart={handleColumnDragStart}
              onDragEnd={() => { setDraggedColIndex(null); setDragOverColIndex(null); }}
            />

            <div className="flex-1 space-y-3 overflow-y-auto p-3 pt-2">
              {columnTasks.map((t) => (
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
                />
              ))}
              
              {hasEditAccess && onAddCard && (
                <button
                  type="button"
                  onClick={() => onAddCard(col.name)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border-2 border-dashed border-app-border text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors text-sm font-semibold"
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
