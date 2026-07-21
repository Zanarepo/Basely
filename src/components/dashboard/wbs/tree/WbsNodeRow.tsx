import React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  Check,
  X,
  FileCheck,
} from 'lucide-react'
import type { WbsNodeRowProps } from './types'
import { getStatusColor, getProgressColor } from './utils'
import { useWbsDragAndDrop } from './hooks/useWbsDragAndDrop'
import { useWbsNodeRename } from './hooks/useWbsNodeRename'

export function WbsNodeRow({
  node,
  depth,
  expandedNodeIds,
  onToggleExpand,
  activeElementId,
  onSelect,
  onAddChild,
  onAddSibling,
  onDelete,
  onRename,
  onMove,
  hasEditAccess,
  draggedNodeId,
  setDraggedNodeId,
  workspaceMembers,
  getElementProgress,
  selectedIds,
  toggleSelection,
}: WbsNodeRowProps) {
  const { element, children } = node
  const isExpanded = expandedNodeIds.has(element.id)
  const hasChildren = children.length > 0

  const {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    handleStartRename,
    handleSaveRename,
    handleKeyDown
  } = useWbsNodeRename(element, onRename)

  const {
    dropPosition,
    rowRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useWbsDragAndDrop({
    elementId: element.id,
    hasEditAccess,
    draggedNodeId,
    setDraggedNodeId,
    onMove
  })

  // Determine line indentation level classes
  const indentPadding = `${depth * 28}px`

  // Highlight style mapping for drop positions
  let dropBorderClass = 'border-transparent'
  if (dropPosition === 'before') {
    dropBorderClass = 'border-t-2 border-indigo-500'
  } else if (dropPosition === 'after') {
    dropBorderClass = 'border-b-2 border-indigo-500'
  } else if (dropPosition === 'inside') {
    dropBorderClass = 'border-2 border-indigo-500 bg-indigo-500/5'
  }

  const isActive = activeElementId === element.id
  const isMilestone = element.isWorkPackage && element.duration === 0

  const isMissingRaci = !isMilestone && element.isWorkPackage && (!element.raciAssignments?.some(a => a.roleType === 'Responsible') || !element.raciAssignments?.some(a => a.roleType === 'Accountable'))
  const responsible = element.raciAssignments?.find(a => a.roleType === 'Responsible')
  const responsibleName = responsible?.stakeholder?.name || null
  const initials = responsibleName
    ? responsibleName.substring(0, 2).toUpperCase()
    : null

  return (
    <div className="space-y-1">
      {/* Node row */}
      <div
        data-wbs-node
        ref={rowRef}
        draggable={hasEditAccess && !isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelect(element.id)}
        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group/row ${
          isActive || selectedIds.includes(element.id)
            ? isMilestone
              ? 'bg-amber-500/15 border-amber-500/40 dark:border-amber-500/30 shadow-xs'
              : 'bg-indigo-500/10 border-indigo-500/30 dark:border-indigo-500/25 shadow-xs'
            : isMilestone
              ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 hover:bg-amber-500/10'
              : 'bg-app-surface-solid border-app-border hover:bg-app-hover hover:border-app-border'
        } ${draggedNodeId === element.id ? 'opacity-40 border-dashed' : ''} ${dropBorderClass}`}
        style={{ paddingLeft: indentPadding }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedIds.includes(element.id)}
              onChange={() => toggleSelection(element.id)}
              className={`w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer ml-1 transition-opacity duration-200 ${selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 focus:opacity-100'}`}
            />
          </div>
          {/* Collapse/Expand Toggle Arrow */}
          <div className="w-5 h-5 shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand(element.id)
                }}
                className="p-0.5 rounded-md hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : isMilestone ? (
              <span className="w-2 h-2 rotate-45 bg-amber-500 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-app-subtle/40" />
            )}
          </div>

          {/* WBS Code */}
          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border shrink-0 ${
            isMilestone
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
              : 'bg-app-muted-surface border-app-border text-app-subtle'
          }`}>
            {element.code}
          </span>

          {/* Inline Edit Name Field */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveRename}
                  className="px-2.5 py-1 bg-app-input border border-indigo-500 rounded-lg text-sm text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${isMilestone ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-app-fg'}`}>
                  {element.name}
                </span>
                {/* WBS Dictionary indicator — Milestone or Work Package */}
                {isMilestone ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                    ◆ Milestone
                  </span>
                ) : element.isWorkPackage ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                    <FileCheck className="h-3 w-3" />
                    Work Package
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="flex items-center gap-1.5">
            {isMissingRaci && (
              <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs cursor-help">⚠️</span>
            )}
            {initials && (
              <span
                title={`Responsible: ${responsibleName}`}
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/25 shrink-0"
              >
                {initials}
              </span>
            )}
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
              element.status
            )}`}
          >
            {element.status}
          </span>

          {/* Progress Bar (Summary elements only) */}
          {!element.isWorkPackage && (
            <div className="flex items-center gap-2 w-24">
              <div className="flex-1 h-2 bg-app-muted-surface rounded-full overflow-hidden border border-app-border">
                <div 
                  className={`h-full ${getProgressColor(getElementProgress(element.id))} transition-all duration-500`} 
                  style={{ width: `${getElementProgress(element.id)}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-app-subtle w-7 text-right">
                {getElementProgress(element.id)}%
              </span>
            </div>
          )}

          {/* Row context action buttons (visible on hover) */}
          {hasEditAccess && !isEditing && (
            <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 transition-opacity duration-150">
              <button
                type="button"
                title="Rename item"
                onClick={handleStartRename}
                className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Add sibling element"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddSibling(element)
                }}
                className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Add child element"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(element)
                }}
                className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete element"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(element)
                }}
                className="p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recursive children list */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {children.map((child) => (
            <WbsNodeRow
              key={child.element.id}
              node={child}
              depth={depth + 1}
              expandedNodeIds={expandedNodeIds}
              onToggleExpand={onToggleExpand}
              activeElementId={activeElementId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
              onDelete={onDelete}
              onRename={onRename}
              onMove={onMove}
              hasEditAccess={hasEditAccess}
              draggedNodeId={draggedNodeId}
              setDraggedNodeId={setDraggedNodeId}
              workspaceMembers={workspaceMembers}
              getElementProgress={getElementProgress}
              selectedIds={selectedIds}
              toggleSelection={toggleSelection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
