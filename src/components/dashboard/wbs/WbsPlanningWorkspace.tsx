'use client'

import { useState } from 'react'
import { FileSpreadsheet, Plus, Loader2, Sparkles } from 'lucide-react'
import { WbsTree } from './WbsTree'
import { WbsBoardView } from './WbsBoardView'
import { WbsGridView } from './WbsGridView'
import { WbsElementSidePanel } from './WbsElementSidePanel'
import { ToastContainer } from '@/components/dashboard/Toast'
import { UnassignedWorkView } from './UnassignedWorkView'
import { SkillGapWidget } from './SkillGapWidget'

import { useWbsPlanning } from './workspace/useWbsPlanning'
import { WbsToolbar } from './workspace/WbsToolbar'
import { WbsImportModal } from './WbsImportModal'
import { RaciMatrixView } from './RaciMatrixView'
import { QualityGateModal } from './QualityGateModal'
import { IterationModal } from '@/components/dashboard/releases/components/IterationModal'
import { getTerminology, ProjectMethodology } from '@/utils/terminology'
import { useWbsBoard } from './workspace/useWbsBoard'
import { useWbsWorkspaceState } from './workspace/useWbsWorkspaceState'
import { useAutoGenerateWbs } from './workspace/hooks/useAutoGenerateWbs'

type WbsPlanningWorkspaceProps = {
  projectId: string
  workspaceMembers: { userId: string; name: string; email: string }[]
  callerUserId: string
  hasEditAccess: boolean
  canAssignMembers?: boolean
  callerRole?: string
  allowTeamScheduleEdits?: boolean
  currency?: string
  methodology?: ProjectMethodology | null
  organizationId: string
  tier: string
  aiEnabled: boolean
}

export function WbsPlanningWorkspace({
  projectId,
  workspaceMembers,
  callerUserId,
  hasEditAccess,
  canAssignMembers = false,
  callerRole,
  allowTeamScheduleEdits = false,
  currency = 'USD',
  methodology,
  organizationId,
  tier,
  aiEnabled,
}: WbsPlanningWorkspaceProps) {
  const terms = getTerminology(methodology)
  const [isImporting, setIsImporting] = useState(false)
  const [isCreateIterationModalOpen, setIsCreateIterationModalOpen] = useState(false)

  const {
    elements,
    loading,
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
    showToast,
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
    loadElements,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    handleBulkDelete,
    qualityGateState,
    setQualityGateState
  } = useWbsPlanning(projectId, hasEditAccess, callerRole, callerUserId, tier)

  const { columns, taskOrders, addColumn, deleteColumn, renameColumn, reorderColumn, moveTask, hiddenColumns, toggleColumnVisibility } = useWbsBoard(projectId, elements)

  const {
    currentView,
    setCurrentView,
    showFinancials,
    setShowFinancials,
    hideCompleted,
    setHideCompleted,
    iterations,
    handleSaveIterationWithTagging,
    handleBulkAssignIteration,
    completedCount,
    filteredSortedElements,
    filteredTreeNodesWithCosts,
  } = useWbsWorkspaceState(
    projectId,
    elements,
    treeNodes,
    setActiveElementId,
    setExpandedNodeIds,
    selectedIds,
    clearSelection,
    loadElements,
    showToast
  )

  const { isGeneratingWbs, handleAutoGenerateBacklogFromPrd } = useAutoGenerateWbs({
    projectId,
    organizationId,
    onShowToast: showToast,
    onSuccess: () => loadElements()
  })

  if (loading && elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-app-muted">Loading WBS planning workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {aiEnabled && (
        <SkillGapWidget projectId={projectId} organizationId={organizationId} />
      )}

      {qualityGateState.isOpen && (
        <QualityGateModal
          projectId={projectId}
          elementId={qualityGateState.elementId}
          standards={qualityGateState.standards}
          category={qualityGateState.category}
          onClose={() => setQualityGateState({ ...qualityGateState, isOpen: false })}
          onSuccess={() => {
            showToast('success', 'Quality gate passed. Task marked complete.')
            setQualityGateState({ ...qualityGateState, isOpen: false })
            loadElements()
          }}
          onExceptionRaised={() => {
            showToast('info', 'Quality exception logged. Task moved to In Review.')
            setQualityGateState({ ...qualityGateState, isOpen: false })
            addColumn('In Review')
            loadElements()
          }}
        />
      )}

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
        onImport={() => setIsImporting(true)}
        selectedIds={selectedIds}
        handleBulkDelete={handleBulkDelete}
        showFinancials={showFinancials}
        onToggleFinancials={() => setShowFinancials(!showFinancials)}
        onCreateIteration={() => setIsCreateIterationModalOpen(true)}
        iterationButtonLabel={`Create ${terms.iteration}`}
        iterations={iterations}
        handleBulkAssignIteration={handleBulkAssignIteration}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted((prev) => !prev)}
        completedCount={completedCount}
        methodology={methodology}
        terms={terms}
      />

      {isCreateIterationModalOpen && (
        <IterationModal
          isOpen={isCreateIterationModalOpen}
          onClose={() => setIsCreateIterationModalOpen(false)}
          onSave={handleSaveIterationWithTagging}
          projectMethodology={methodology}
          nextSequenceNumber={(iterations?.length || 0) + 1}
          availableWbsElements={elements.filter(e => e.isWorkPackage)}
          projectId={projectId}
          organizationId={organizationId}
        />
      )}

      {isImporting && (
        <WbsImportModal 
          projectId={projectId} 
          onClose={() => setIsImporting(false)} 
          onSuccess={() => {
            setIsImporting(false)
            loadElements()
          }} 
        />
      )}

      {/* Main content split panel */}
      {elements.length === 0 ? (
        /* Empty tree state card */
        <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-500 mb-4">
            <FileSpreadsheet className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-app-fg mb-1">
            WBS Empty
          </h3>
          <p className="text-sm text-app-muted max-w-sm mb-6 leading-relaxed">
            Create hierarchical elements to decompose your project scope. WBS codes will calculate automatically at every level.
          </p>
          {hasEditAccess && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCreateElement(null)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Create First Element
              </button>
              
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handleAutoGenerateBacklogFromPrd}
                  disabled={isGeneratingWbs}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isGeneratingWbs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Auto-Generate from PRD
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6 shadow-xs min-h-[350px] max-w-[100vw] sm:max-w-none min-w-0">
            {currentView === 'tree' && (
              <div className="overflow-x-auto">
                <WbsTree
                  treeNodes={filteredTreeNodesWithCosts}
                  expandedNodeIds={expandedNodeIds}
                  onToggleExpand={handleToggleExpand}
                  activeElementId={activeElementId}
                  onSelect={setActiveElementId}
                  onAddChild={(element) => handleCreateElement(element.parentId, element, 'child', { isWorkPackage: true })}
                  onAddSibling={(element) => handleCreateElement(element.parentId, element, 'sibling', { isWorkPackage: element.isWorkPackage })}
                  onDelete={handleDeleteElement}
                  onRename={handleRenameElement}
                  onMove={handleMoveNode}
                  hasEditAccess={hasEditAccess}
                  draggedNodeId={draggedNodeId}
                  setDraggedNodeId={setDraggedNodeId}
                  workspaceMembers={workspaceMembers}
                  getElementProgress={getElementProgress}
                  selectedIds={selectedIds}
                  toggleSelection={toggleSelection}
                  selectAll={selectAll}
                  clearSelection={clearSelection}
                  callerUserId={callerUserId}
                  callerRole={callerRole}
                  showFinancials={showFinancials}
                  currency={currency}
                  terms={terms}
                />
              </div>
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
                onAddCard={(status) => handleCreateElement(null, undefined, 'sibling', { status, isWorkPackage: true })}
                onDeleteCard={(id) => {
                  const el = elements.find(e => e.id === id)
                  if (el) handleDeleteElement(el)
                }}
                callerRole={callerRole}
                callerUserId={callerUserId}
                onShowToast={showToast}
                terms={terms}
                iterations={iterations}
                methodology={methodology}
                hideCompleted={hideCompleted}
                onToggleHideCompleted={() => setHideCompleted((prev) => !prev)}
              />
            )}

            {currentView === 'grid' && (
              <WbsGridView 
                projectId={projectId}
                elements={filteredSortedElements}
                workspaceMembers={workspaceMembers}
                onSelect={setActiveElementId}
                selectedIds={selectedIds}
                toggleSelection={toggleSelection}
                selectAll={selectAll}
                clearSelection={clearSelection}
                expandedNodeIds={expandedNodeIds}
                onToggleExpand={handleToggleExpand}
                terms={terms}
              />
            )}

            {currentView === 'raci' && (
              <RaciMatrixView 
                projectId={projectId} 
                elements={filteredSortedElements}
                expandedNodeIds={expandedNodeIds}
                onToggleExpand={handleToggleExpand}
                organizationId={organizationId}
                tier={tier}
                aiEnabled={aiEnabled}
                onShowToast={showToast}
                onAssignmentsCompleted={loadElements}
              />
            )}

            {currentView === 'unassigned' && (
              <UnassignedWorkView
                elements={elements}
                onSelect={setActiveElementId}
                terms={terms}
                hideCompleted={hideCompleted}
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
        onAssignmentChanged={loadElements}
        hasEditAccess={hasEditAccess}
        canAssignMembers={canAssignMembers}
        customStatuses={columns.map((c) => c.name)}
        onAddCustomStatus={addColumn}
        onShowToast={showToast}
        callerRole={callerRole}
        callerUserId={callerUserId}
        allowTeamScheduleEdits={allowTeamScheduleEdits}
        currency={currency}
        terms={terms}
        organizationId={organizationId}
        tier={tier}
        aiEnabled={aiEnabled}
        methodology={methodology}
      />
    </div>
  )
}
