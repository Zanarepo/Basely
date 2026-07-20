'use client'

import { useState, useRef } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Subtitles,
  Trash2,
  Edit2,
  FolderPlus,
  Check,
  X,
  FileCheck,
} from 'lucide-react'
import type { WbsElement, WbsStatus } from '@/lib/wbs/constants'

type TreeNode = {
  element: WbsElement
  children: TreeNode[]
}

type WbsTreeProps = {
  treeNodes: TreeNode[]
  expandedNodeIds: Set<string>
  onToggleExpand: (id: string) => void
  activeElementId: string | null
  onSelect: (id: string) => void
  onAddChild: (element: WbsElement) => void
  onAddSibling: (element: WbsElement) => void
  onDelete: (element: WbsElement) => void
  onRename: (id: string, newName: string) => void
  onMove: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
  hasEditAccess: boolean
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
  workspaceMembers: { userId: string; name: string; email: string; role?: string }[]
  getElementProgress: (id: string) => number
  selectedIds: string[]
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
}

function getStatusColor(status: WbsStatus) {
  switch (status) {
    case 'Complete':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    case 'In Progress':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    case 'On Hold':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
  }
}

function getProgressColor(progress: number) {
  if (progress === 0) return 'bg-slate-200 dark:bg-slate-700'
  if (progress < 33) return 'bg-rose-500'
  if (progress < 66) return 'bg-amber-500'
  if (progress < 100) return 'bg-indigo-500'
  return 'bg-emerald-500'
}

export function WbsTree({
  treeNodes,
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
  selectAll,
  clearSelection,
}: WbsTreeProps) {
  return (
    <div className="space-y-1 min-w-[800px] pb-4">
      {treeNodes.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-2 bg-app-muted-surface border border-app-border rounded-xl">
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length >= document.querySelectorAll('[data-wbs-node]').length}
            onChange={(e) => {
              if (e.target.checked) selectAll()
              else clearSelection()
            }}
            className="w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer ml-1"
          />
          <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">Select All</span>
        </div>
      )}
      {treeNodes.map((node) => (
        <WbsNodeRow
          key={node.element.id}
          node={node}
          depth={0}
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
  )
}

type WbsNodeRowProps = {
  node: TreeNode
  depth: number
  expandedNodeIds: Set<string>
  onToggleExpand: (id: string) => void
  activeElementId: string | null
  onSelect: (id: string) => void
  onAddChild: (element: WbsElement) => void
  onAddSibling: (element: WbsElement) => void
  onDelete: (element: WbsElement) => void
  onRename: (id: string, newName: string) => void
  onMove: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
  hasEditAccess: boolean
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
  workspaceMembers: { userId: string; name: string; email: string; role?: string }[]
  getElementProgress: (id: string) => number
  selectedIds: string[]
  toggleSelection: (id: string) => void
}

function WbsNodeRow({
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

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(element.name)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(element.name)
  }

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== element.name) {
      onRename(element.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(element.name)
    }
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    if (!hasEditAccess) {
      e.preventDefault()
      return
    }
    setDraggedNodeId(element.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', element.id)
  }

  const handleDragEnd = () => {
    setDraggedNodeId(null)
    setDropPosition(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasEditAccess || !draggedNodeId || draggedNodeId === element.id) {
      return
    }

    // Cycle prevention helper check: make sure target isn't inside dragged node
    const isTargetDescendantOfDragged = (draggedId: string, targetNode: TreeNode): boolean => {
      if (targetNode.element.parentId === draggedId) return true
      // We can also let the move action check cycles, but checking client-side prevents visual bugs
      return false
    }

    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!rowRef.current) return

    const rect = rowRef.current.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const height = rect.height

    if (relativeY < height / 4) {
      setDropPosition('before')
    } else if (relativeY > (height * 3) / 4) {
      setDropPosition('after')
    } else {
      setDropPosition('inside')
    }
  }

  const handleDragLeave = () => {
    setDropPosition(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!hasEditAccess || !draggedNodeId || draggedNodeId === element.id || !dropPosition) {
      return
    }

    onMove(draggedNodeId, element.id, dropPosition)
    setDropPosition(null)
    setDraggedNodeId(null)
  }

  // Determine line indentation level classes
  const indentPadding = `${depth * 28}px`

  // Highlight style mapping for drop drop positions
  let dropBorderClass = 'border-transparent'
  if (dropPosition === 'before') {
    dropBorderClass = 'border-t-2 border-indigo-500'
  } else if (dropPosition === 'after') {
    dropBorderClass = 'border-b-2 border-indigo-500'
  } else if (dropPosition === 'inside') {
    dropBorderClass = 'border-2 border-indigo-500 bg-indigo-500/5'
  }

  const isActive = activeElementId === element.id

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
            ? 'bg-indigo-500/10 border-indigo-500/30 dark:border-indigo-500/25 shadow-xs'
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
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-app-subtle/40" />
            )}
          </div>

          {/* WBS Code */}
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-app-muted-surface border border-app-border text-app-subtle shrink-0">
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
                <span className="text-sm font-semibold text-app-fg truncate">
                  {element.name}
                </span>
                {/* WBS Dictionary indicator */}
                {element.isWorkPackage && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                    <FileCheck className="h-3 w-3" />
                    Work Package
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {(() => {
            const isMissingRaci = element.isWorkPackage && (!element.raciAssignments?.some(a => a.roleType === 'Responsible') || !element.raciAssignments?.some(a => a.roleType === 'Accountable'))

            const responsible = element.raciAssignments?.find(a => a.roleType === 'Responsible')
            const responsibleName = responsible?.stakeholder?.name || null
            
            const initials = responsibleName
              ? responsibleName.substring(0, 2).toUpperCase()
              : null

            return (
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
            )
          })()}

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
