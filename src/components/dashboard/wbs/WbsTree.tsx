'use client'

import React from 'react'
import type { WbsTreeProps } from './tree/types'
import { WbsNodeRow } from './tree/WbsNodeRow'

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
