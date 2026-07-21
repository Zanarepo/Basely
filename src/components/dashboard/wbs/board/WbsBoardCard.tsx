import { Trash2, CheckSquare } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'

interface WbsBoardCardProps {
  task: WbsElement
  colName: string
  elements: WbsElement[]
  visibleColIndex: number
  visibleColumnsLength: number
  hasEditAccess: boolean
  callerRole?: string
  callerUserId?: string
  draggedTaskId: string | null
  dragOverTaskId: string | null
  onSelect: (id: string) => void
  onDeleteCard?: (id: string) => void
  onDragStart: (e: React.DragEvent, taskId: string, sourceCol: string) => void
  onDragOverTask: (e: React.DragEvent, targetTaskId: string) => void
  onDragLeaveTask: (e: React.DragEvent) => void
  onDropOnTask: (e: React.DragEvent, targetTaskId: string, targetStatus: string) => void
  onDragEnd: () => void
}

export function WbsBoardCard({
  task: t,
  colName,
  elements,
  visibleColIndex,
  visibleColumnsLength,
  hasEditAccess,
  callerRole,
  callerUserId,
  draggedTaskId,
  dragOverTaskId,
  onSelect,
  onDeleteCard,
  onDragStart,
  onDragOverTask,
  onDragLeaveTask,
  onDropOnTask,
  onDragEnd,
}: WbsBoardCardProps) {
  const responsible = t.raciAssignments?.find((a) => a.roleType === 'Responsible')
  const responsibleName = responsible?.stakeholder?.name || null
  const isMissingRaci = !t.raciAssignments?.some((a) => a.roleType === 'Responsible') || !t.raciAssignments?.some((a) => a.roleType === 'Accountable')
  
  const initials = responsibleName
    ? responsibleName.substring(0, 2).toUpperCase()
    : null
  const parentElement = t.parentId ? elements.find((e) => e.id === t.parentId) : null
  const tagText = parentElement ? parentElement.name : 'Work Package'

  const isResponsible = callerRole === 'Team Member' && t.raciAssignments?.some((a) => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId)
  const canDragTask = hasEditAccess || isResponsible

  return (
    <div
      onClick={() => onSelect(t.id)}
      draggable={canDragTask}
      onDragStart={(e) => onDragStart(e, t.id, colName)}
      onDragOver={(e) => onDragOverTask(e, t.id)}
      onDragLeave={onDragLeaveTask}
      onDrop={(e) => onDropOnTask(e, t.id, colName)}
      onDragEnd={onDragEnd}
      className={`group/task group relative bg-app-surface border rounded-xl p-3 shadow-xs transition-all duration-200
        ${isResponsible ? 'border-indigo-400 ring-1 ring-indigo-400/50 bg-indigo-50/30 dark:bg-indigo-500/5' : 'border-app-border'}
        ${canDragTask ? 'cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md' : 'cursor-pointer hover:border-slate-300'}
        ${draggedTaskId === t.id ? 'opacity-40 border-dashed scale-95' : ''}
        ${dragOverTaskId === t.id ? 'border-t-2 border-t-indigo-500 transform translate-y-1' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {t.code}
        </span>
        {isResponsible && (
          <span className="ml-2 text-[9px] font-bold tracking-wide text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
            YOURS
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {hasEditAccess && onDeleteCard && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteCard(t.id)
              }}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
              title="Delete Card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {visibleColIndex + 1}/{visibleColumnsLength}
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
      
      {t.deliverablesData && t.deliverablesData.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium text-indigo-500/80">
          <CheckSquare className="w-3 h-3" />
          {(() => {
            const completed = t.deliverablesData.filter((d) => d.completed).length
            const total = t.deliverablesData.length
            const percent = Math.round((completed / total) * 100)
            return `Deliverables: ${completed}/${total} (${percent}%)`
          })()}
        </div>
      )}

      {t.acceptanceCriteriaData && t.acceptanceCriteriaData.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-medium text-emerald-500/80">
          <CheckSquare className="w-3 h-3" />
          {(() => {
            const completed = t.acceptanceCriteriaData.filter((d) => d.completed).length
            const total = t.acceptanceCriteriaData.length
            const percent = Math.round((completed / total) * 100)
            return `Criteria: ${completed}/${total} (${percent}%)`
          })()}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          {initials ? (
            <div
              className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-semibold shrink-0"
              title={`Responsible: ${responsibleName}`}
            >
              {initials}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-app-border flex items-center justify-center text-app-subtle text-[10px]" title="No Responsible assigned">
              +
            </div>
          )}
          {isMissingRaci && (
            <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs cursor-help">⚠️</span>
          )}
        </div>
        
        {/* Workflow stage progress bar */}
        <div className="w-16 h-1.5 bg-app-muted-surface rounded-full overflow-hidden" title={`Workflow Stage: ${visibleColIndex + 1} of ${visibleColumnsLength}`}>
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{
              width: `${Math.round(((visibleColIndex + 1) / visibleColumnsLength) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
