import { useState, useEffect, useTransition, useMemo } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import {
  getWbsElements,
  createWbsElement,
  updateWbsElement,
  deleteWbsElement,
  updateWbsSortOrders,
} from '@/lib/wbs/actions'
import type { ToastMessage } from '@/components/dashboard/Toast'

export type TreeNode = {
  element: WbsElement
  children: TreeNode[]
}

export function useWbsPlanning(projectId: string, hasEditAccess: boolean) {
  const [elements, setElements] = useState<WbsElement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Selection & UI controls
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<WbsElement[][]>([])
  const [redoStack, setRedoStack] = useState<WbsElement[][]>([])

  // HUD Toast alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Load WBS elements
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

  // --- Client-side WBS Code Recalculator (for instant optimistic updates) ---
  const recalculateClientCodes = (flatList: WbsElement[]): WbsElement[] => {
    const list = [...flatList]

    const recurse = (parentId: string | null, parentCode: string) => {
      const children = list
        .filter((el) => el.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      children.forEach((child, index) => {
        const computedCode = parentCode === '' ? `${index + 1}` : `${parentCode}.${index + 1}`
        child.code = computedCode
        recurse(child.id, computedCode)
      })
    }

    recurse(null, '')
    return list
  }

  // --- History Snapshots ---
  const saveSnapshot = (currentState: WbsElement[]) => {
    const clone = JSON.parse(JSON.stringify(currentState))
    setUndoStack((prev) => [...prev.slice(-19), clone]) // limit to 20 states
    setRedoStack([])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]!
    const nextUndo = undoStack.slice(0, -1)

    saveSnapshotForRedo(elements)
    setUndoStack(nextUndo)

    const updated = recalculateClientCodes(prev)
    setElements(updated)
    syncStateToDatabase(updated)
    showToast('info', 'Undo completed')
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    const nextRedo = redoStack.slice(0, -1)

    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(elements))])
    setRedoStack(nextRedo)

    const updated = recalculateClientCodes(next)
    setElements(updated)
    syncStateToDatabase(updated)
    showToast('info', 'Redo completed')
  }

  const saveSnapshotForRedo = (currentState: WbsElement[]) => {
    const clone = JSON.parse(JSON.stringify(currentState))
    setRedoStack((prev) => [...prev, clone])
  }

  const syncStateToDatabase = (list: WbsElement[]) => {
    startTransition(async () => {
      const updates = list
        .filter((item) => !item.id.startsWith('temp-'))
        .map((item) => ({
          id: item.id,
          parentId: item.parentId && !item.parentId.startsWith('temp-') ? item.parentId : null,
          sortOrder: item.sortOrder,
        }))
      const res = await updateWbsSortOrders(projectId, updates)
      if (!res.ok) {
        showToast('error', `Failed to sync undo/redo structure to database: ${res.error}`)
      }
    })
  }

  // --- CRUD Handler Actions ---

  const handleCreateElement = async (
    targetParentId: string | null,
    referenceElement?: WbsElement,
    position: 'child' | 'sibling' = 'sibling'
  ) => {
    if (!hasEditAccess) return

    saveSnapshot(elements)

    const parentId = position === 'child' ? referenceElement?.id ?? null : targetParentId
    const siblings = elements.filter((el) => el.parentId === parentId)
    
    // Default sort order is the end of the siblings list
    let nextSortOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) + 1 : 1

    // If adding a sibling after a reference element, adjust sort order offsets
    if (position === 'sibling' && referenceElement) {
      nextSortOrder = referenceElement.sortOrder + 1
      // Shift sort order of subsequent elements to make room
      elements.forEach((el) => {
        if (el.parentId === parentId && el.sortOrder >= nextSortOrder) {
          el.sortOrder += 1
        }
      })
    }

    const tempId = `temp-${Math.random()}`
    const newTempElement: WbsElement = {
      id: tempId,
      projectId,
      parentId,
      code: '', // computed server-side and client-side
      name: 'New Element',
      description: null,
      ownerId: null,
      deliverables: null,
      acceptanceCriteria: null,
      status: 'Not Started',
      isWorkPackage: false,
      sortOrder: nextSortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Apply optimistic updates
    const optimisticList = recalculateClientCodes([...elements, newTempElement])
    setElements(optimisticList)
    if (parentId) {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
    }

    startTransition(async () => {
      const result = await createWbsElement(projectId, parentId, 'New Element', nextSortOrder)
      if (result.ok) {
        // Swap temp ID with real ID and load elements to sync code changes
        setElements((prevList) =>
          prevList.map((item) => (item.id === tempId ? { ...item, id: result.id } : item))
        )
        showToast('success', 'WBS element created')
        setActiveElementId(result.id) // Automatically select for naming
        loadElements() // Full reload to get server computed codes
      } else {
        showToast('error', `Could not create element: ${result.error}`)
        loadElements() // Rollback state
      }
    })
  }

  const handleRenameElement = (id: string, newName: string) => {
    if (!hasEditAccess) return
    if (id.startsWith('temp-')) {
      showToast('info', 'Please wait for the new element to finish saving before renaming')
      return
    }

    saveSnapshot(elements)

    // Optimistic Rename
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, name: newName } : el)))

    startTransition(async () => {
      const result = await updateWbsElement(id, projectId, { name: newName })
      if (result.ok) {
        showToast('success', 'Element renamed')
      } else {
        showToast('error', `Could not rename: ${result.error}`)
        loadElements() // Rollback
      }
    })
  }

  const handleSaveDetails = async (id: string, updates: Partial<WbsElement>): Promise<boolean> => {
    if (!hasEditAccess) return false
    if (id.startsWith('temp-')) {
      showToast('info', 'Please wait for the new element to finish saving before updating details')
      return false
    }

    saveSnapshot(elements)

    // Optimistic Update details
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    )

    const result = await updateWbsElement(id, projectId, updates)
    if (result.ok) {
      showToast('success', 'WBS Dictionary details updated')
      return true
    } else {
      showToast('error', `Could not save details: ${result.error}`)
      loadElements() // Rollback
      return false
    }
  }

  const handleDeleteElement = (element: WbsElement) => {
    if (!hasEditAccess) return

    if (element.id.startsWith('temp-')) {
      const filtered = elements.filter((el) => el.id !== element.id)
      setElements(recalculateClientCodes(filtered))
      if (activeElementId === element.id) setActiveElementId(null)
      showToast('success', 'WBS element removed')
      return
    }

    // Calculate how many descendants are affected
    const getDescendantCount = (id: string): number => {
      let count = 0
      const children = elements.filter((el) => el.parentId === id)
      count += children.length
      children.forEach((child) => {
        count += getDescendantCount(child.id)
      })
      return count
    }

    const descendantCount = getDescendantCount(element.id)
    const warningText =
      descendantCount > 0
        ? `Deleting "${element.name}" will also delete all of its ${descendantCount} child elements recursively. This action cannot be undone. Are you sure?`
        : `Are you sure you want to delete WBS element "${element.name}"?`

    if (!window.confirm(warningText)) return

    saveSnapshot(elements)

    // Optimistic delete item and all descendants
    const filterDescendants = (list: WbsElement[], parentId: string): WbsElement[] => {
      const childrenIds = list.filter((el) => el.parentId === parentId).map((el) => el.id)
      let filtered = list.filter((el) => el.id !== parentId)
      childrenIds.forEach((cId) => {
        filtered = filterDescendants(filtered, cId)
      })
      return filtered
    }

    const optimisticList = recalculateClientCodes(filterDescendants(elements, element.id))
    setElements(optimisticList)
    if (activeElementId === element.id) setActiveElementId(null)

    startTransition(async () => {
      const result = await deleteWbsElement(element.id, projectId)
      if (result.ok) {
        showToast('success', 'WBS element deleted')
        loadElements() // Refresh code alignment
      } else {
        showToast('error', `Could not delete element: ${result.error}`)
        loadElements() // Rollback
      }
    })
  }

  // Drag and Drop structural moving
  const handleMoveNode = (
    draggedId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => {
    if (!hasEditAccess) return
    if (draggedId.startsWith('temp-') || targetId.startsWith('temp-')) {
      showToast('info', 'Please wait for the new element to finish saving before moving it')
      return
    }

    // Ancestor check to prevent loops/cycles
    const isAncestor = (currId: string, targetParentId: string | null): boolean => {
      let temp = targetParentId
      while (temp !== null) {
        if (temp === currId) return true
        const nextNode = elements.find((item) => item.id === temp)
        temp = nextNode ? nextNode.parentId : null
      }
      return false
    }

    const targetNode = elements.find((item) => item.id === targetId)
    if (!targetNode) return

    const newParentId = position === 'inside' ? targetNode.id : targetNode.parentId

    if (isAncestor(draggedId, newParentId)) {
      showToast('error', 'Cannot move a WBS element inside its own child subtree')
      return
    }

    saveSnapshot(elements)

    // Compute sort orders
    const siblings = elements
      .filter((el) => el.parentId === newParentId && el.id !== draggedId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    let newSortOrder = 1
    if (position === 'inside') {
      newSortOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) + 1 : 1
    } else {
      const targetIndex = siblings.findIndex((s) => s.id === targetId)
      if (position === 'before') {
        newSortOrder = targetNode.sortOrder
      } else {
        newSortOrder = targetNode.sortOrder + 1
      }
    }

    // Apply move changes locally & build database updates payload
    const updatesPayload: { id: string; parentId: string | null; sortOrder: number }[] = []

    const optimisticList = elements.map((item) => {
      let nextParentId = item.parentId
      let nextSortOrder = item.sortOrder
      let changed = false

      if (item.id === draggedId) {
        nextParentId = newParentId
        nextSortOrder = newSortOrder
        changed = true
      } else if (item.parentId === newParentId && item.sortOrder >= newSortOrder) {
        // Shift following siblings up
        nextSortOrder += 1
        changed = true
      }

      if (changed) {
        updatesPayload.push({ id: item.id, parentId: nextParentId, sortOrder: nextSortOrder })
      }

      return { ...item, parentId: nextParentId, sortOrder: nextSortOrder }
    })

    const recalculated = recalculateClientCodes(optimisticList)
    setElements(recalculated)

    // Expand the target node if dropped inside it
    if (position === 'inside') {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev)
        next.add(targetId)
        return next
      })
    }

    startTransition(async () => {
      const result = await updateWbsSortOrders(projectId, updatesPayload)
      if (result.ok) {
        showToast('success', 'WBS structure updated')
        loadElements() // Recalculate code alignment
      } else {
        showToast('error', `Could not update structure: ${result.error}`)
        loadElements() // Rollback
      }
    })
  }

  // Expand/collapse controls
  const handleToggleExpand = (id: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const parentIds = new Set(elements.map((el) => el.parentId).filter((id): id is string => id !== null))
    setExpandedNodeIds(parentIds)
    showToast('info', 'Tree nodes expanded')
  }

  const handleCollapseAll = () => {
    setExpandedNodeIds(new Set())
    showToast('info', 'Tree nodes collapsed')
  }

  // --- Reconstruction of flat elements into WBS Tree ---
  const activeElement = elements.find((item) => item.id === activeElementId) || null

  // Search logic: If node matches, keep it and all its ancestor parents visible
  const searchFilterMap = useMemo(() => {
    if (!searchQuery.trim()) return null

    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    const ancestorsToKeep = new Set<string>()

    // Find direct matches
    elements.forEach((el) => {
      if (el.name.toLowerCase().includes(q) || el.code.includes(q)) {
        matches.add(el.id)
        // Climb parents and add to keep path
        let parentId = el.parentId
        while (parentId) {
          ancestorsToKeep.add(parentId)
          const pNode = elements.find((x) => x.id === parentId)
          parentId = pNode ? pNode.parentId : null
        }
      }
    })

    // Auto-expand all ancestors when searching
    if (ancestorsToKeep.size > 0) {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev)
        ancestorsToKeep.forEach((id) => next.add(id))
        return next
      })
    }

    return { matches, ancestorsToKeep }
  }, [searchQuery, elements])

  const treeNodes = useMemo(() => {
    const buildTree = (flat: WbsElement[]): TreeNode[] => {
      const nodeMap = new Map<string, TreeNode>()
      const roots: TreeNode[] = []

      flat.forEach((el) => {
        nodeMap.set(el.id, { element: el, children: [] })
      })

      flat.forEach((el) => {
        const node = nodeMap.get(el.id)!
        if (el.parentId && nodeMap.has(el.parentId)) {
          nodeMap.get(el.parentId)!.children.push(node)
        } else if (!el.parentId) {
          roots.push(node)
        }
      })

      // Sorting children recursively
      nodeMap.forEach((node) => {
        node.children.sort((a, b) => a.element.sortOrder - b.element.sortOrder)
      })

      roots.sort((a, b) => a.element.sortOrder - b.element.sortOrder)

      return roots
    }

    // Filter elements list if search filter matches
    let processedElements = elements
    if (searchFilterMap) {
      processedElements = elements.filter(
        (el) => searchFilterMap.matches.has(el.id) || searchFilterMap.ancestorsToKeep.has(el.id)
      )
    }

    return buildTree(processedElements)
  }, [elements, searchFilterMap])

  return {
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
  }
}
