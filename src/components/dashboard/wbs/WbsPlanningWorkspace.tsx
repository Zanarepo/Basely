'use client'

import { useState } from 'react'
import { FileSpreadsheet, Plus, Loader2 } from 'lucide-react'
import { WbsTree } from './WbsTree'
import { WbsBoardView } from './WbsBoardView'
import { WbsGridView } from './WbsGridView'
import { WbsElementSidePanel } from './WbsElementSidePanel'
import { ToastContainer } from '@/components/dashboard/Toast'

// Moduralized Components & Hooks
import { useWbsPlanning } from './workspace/useWbsPlanning'
import { WbsToolbar, WbsViewType } from './workspace/WbsToolbar'

type WbsPlanningWorkspaceProps = {
  projectId: string
  workspaceMembers: { userId: string; name: string; email: string }[]
  callerUserId: string
  hasEditAccess: boolean
}

import { useWbsBoard } from './workspace/useWbsBoard'

export function WbsPlanningWorkspace({
  projectId,
  workspaceMembers,
  callerUserId,
  hasEditAccess,
}: WbsPlanningWorkspaceProps) {
  const [currentView, setCurrentView] = useState<WbsViewType>('tree')

  const {
    elements,
    loading,
    error,
    isPending,
    activeElementId,
    setActiveElementId,
    expandedNodeIds,
    setExpandedNodeIds,
    searchQuery,
    setSearchQuery,
    draggedNodeId,
    setDraggedNodeId,
    undoStack,
    redoStack,
    toasts,
    dismissToast,
    handleUndo,
    handleRedo,
    handleCreateElement,
    handleRenameElement,
    handleSaveDetails,
    handleDeleteElement,
    handleMoveNode,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
    activeElement,
    treeNodes,
    getElementProgress,
  } = useWbsPlanning(projectId, hasEditAccess)

  const { columns, taskOrders, addColumn, deleteColumn, renameColumn, reorderColumn, moveTask, hiddenColumns, toggleColumnVisibility } = useWbsBoard(projectId, elements)

  if (loading && elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-app-muted">Loading WBS planning workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Toolbar header */}
      <WbsToolbar
        hasEditAccess={hasEditAccess}
        isPending={isPending}
        undoStack={undoStack}
        redoStack={redoStack}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        handleExpandAll={handleExpandAll}
        handleCollapseAll={handleCollapseAll}
        handleCreateElement={handleCreateElement}
      />

      {/* Main content split panel */}
      {elements.length === 0 ? (
        /* Empty tree state card */
        <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
            <FileSpreadsheet className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-app-fg mb-1">
            WBS Empty
          </h3>
          <p className="text-sm text-app-muted max-w-sm mb-6 leading-relaxed">
            Create hierarchical elements to decompose your project scope. WBS codes will calculate automatically at every level.
          </p>
          {hasEditAccess && (
            <button
              type="button"
              onClick={() => handleCreateElement(null)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create First Element
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6 shadow-xs overflow-x-auto min-h-[350px]">
            {currentView === 'tree' && (
              <WbsTree
                treeNodes={treeNodes}
                expandedNodeIds={expandedNodeIds}
                onToggleExpand={handleToggleExpand}
                activeElementId={activeElementId}
                onSelect={setActiveElementId}
                onAddChild={(element) => handleCreateElement(element.parentId, element, 'child')}
                onAddSibling={(element) => handleCreateElement(element.parentId, element, 'sibling')}
                onDelete={handleDeleteElement}
                onRename={handleRenameElement}
                onMove={handleMoveNode}
                hasEditAccess={hasEditAccess}
                draggedNodeId={draggedNodeId}
                setDraggedNodeId={setDraggedNodeId}
                workspaceMembers={workspaceMembers}
                getElementProgress={getElementProgress}
              />
            )}
            
            {currentView === 'board' && (
              <WbsBoardView 
                columns={columns}
                taskOrders={taskOrders}
                addColumn={addColumn}
                deleteColumn={deleteColumn}
                renameColumn={renameColumn}
                reorderColumn={reorderColumn}
                moveTask={moveTask}
                hiddenColumns={hiddenColumns}
                toggleColumnVisibility={toggleColumnVisibility}
                elements={elements}
                workspaceMembers={workspaceMembers}
                hasEditAccess={hasEditAccess}
                onSelect={setActiveElementId}
                onStatusChange={(id, newStatus) => handleSaveDetails(id, { status: newStatus })}
              />
            )}

            {currentView === 'grid' && (
              <WbsGridView 
                projectId={projectId}
                elements={elements}
                workspaceMembers={workspaceMembers}
                onSelect={setActiveElementId}
              />
            )}
          </div>
        </div>
      )}

      {/* Detail sidebar editor panel */}
      <WbsElementSidePanel
        element={activeElement}
        workspaceMembers={workspaceMembers}
        onClose={() => setActiveElementId(null)}
        onSave={handleSaveDetails}
        hasEditAccess={hasEditAccess}
        customStatuses={columns.map((c) => c.name)}
        onAddCustomStatus={addColumn}
      />
    </div>
  )
}
