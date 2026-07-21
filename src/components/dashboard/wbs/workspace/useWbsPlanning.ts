import { useState, useEffect } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import { getWbsElements } from '@/lib/wbs/actions'

// Import extracted hooks
import { useWbsToasts } from './hooks/useWbsToasts'
import { useWbsSelection } from './hooks/useWbsSelection'
import { useWbsHistory } from './hooks/useWbsHistory'
import { useWbsTreeData, TreeNode } from './hooks/useWbsTreeData'
import { useWbsMutations } from './hooks/useWbsMutations'

export type { TreeNode }

export function useWbsPlanning(projectId: string, hasEditAccess: boolean) {
  const [elements, setElements] = useState<WbsElement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadElements = async () => {
    setLoading(true)
    const result = await getWbsElements(projectId)
    if (result.ok) {
      setElements(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadElements()
  }, [projectId])

  // 1. Toasts
  const { toasts, showToast, dismissToast } = useWbsToasts()

  // 2. Selection & UI State
  const {
    activeElementId,
    setActiveElementId,
    expandedNodeIds,
    setExpandedNodeIds,
    searchQuery,
    setSearchQuery,
    draggedNodeId,
    setDraggedNodeId,
    selectedIds,
    setSelectedIds,
    activeElement,
    toggleSelection,
    selectAll,
    clearSelection,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll
  } = useWbsSelection(elements, showToast)

  // 3. Tree Data & Searching
  const {
    recalculateClientCodes,
    treeNodes,
  } = useWbsTreeData(elements, searchQuery, setExpandedNodeIds)

  // 4. History (Undo / Redo)
  const {
    undoStack,
    redoStack,
    saveSnapshot,
    handleUndo,
    handleRedo
  } = useWbsHistory(elements, setElements, recalculateClientCodes, (list) => mutations.syncStateToDatabase(list), showToast)

  // 5. Mutations & Server Actions
  const mutations = useWbsMutations({
    projectId,
    elements,
    setElements,
    hasEditAccess,
    saveSnapshot,
    recalculateClientCodes,
    setExpandedNodeIds,
    activeElementId,
    setActiveElementId,
    selectedIds,
    setSelectedIds,
    showToast,
    loadElements
  })

  return {
    elements,
    loading,
    error,
    isPending: mutations.isPending,
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
    handleCreateElement: mutations.handleCreateElement,
    handleRenameElement: mutations.handleRenameElement,
    handleSaveDetails: mutations.handleSaveDetails,
    handleDeleteElement: mutations.handleDeleteElement,
    handleBulkDelete: mutations.handleBulkDelete,
    handleMoveNode: mutations.handleMoveNode,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
    activeElement,
    treeNodes,
    getElementProgress: mutations.getElementProgress,
    loadElements,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
  }
}
