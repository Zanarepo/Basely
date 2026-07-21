import { useTransition } from 'react'
import type { WbsElement, WbsStatus } from '@/lib/wbs/constants'
import {
  createWbsElement,
  updateWbsElement,
  deleteWbsElement,
  updateWbsSortOrders,
  bulkDeleteWbsElements,
} from '@/lib/wbs/actions'

interface UseWbsMutationsProps {
  projectId: string
  elements: WbsElement[]
  setElements: React.Dispatch<React.SetStateAction<WbsElement[]>>
  hasEditAccess: boolean
  saveSnapshot: (list: WbsElement[]) => void
  recalculateClientCodes: (list: WbsElement[]) => WbsElement[]
  setExpandedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>
  activeElementId: string | null
  setActiveElementId: (id: string | null) => void
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void
  loadElements: () => Promise<void>
}

export function useWbsMutations({
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
}: UseWbsMutationsProps) {
  const [isPending, startTransition] = useTransition()

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

  const handleCreateElement = async (
    targetParentId: string | null,
    referenceElement?: WbsElement,
    position: 'child' | 'sibling' = 'sibling',
    initialData?: { status?: string; isWorkPackage?: boolean }
  ) => {
    if (!hasEditAccess) return

    saveSnapshot(elements)

    const parentId = position === 'child' ? referenceElement?.id ?? null : targetParentId
    const siblings = elements.filter((el) => el.parentId === parentId)
    
    let nextSortOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) + 1 : 1

    if (position === 'sibling' && referenceElement) {
      nextSortOrder = referenceElement.sortOrder + 1
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
      code: '',
      name: 'New Element',
      description: null,
      ownerId: null,
      deliverables: null,
      acceptanceCriteria: null,
      status: (initialData?.status as WbsStatus) || 'Not Started',
      isWorkPackage: initialData?.isWorkPackage ?? false,
      sortOrder: nextSortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

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
      const result = await createWbsElement(projectId, parentId, 'New Element', nextSortOrder, initialData)
      if (result.ok) {
        setElements((prevList) =>
          prevList.map((item) => (item.id === tempId ? { ...item, id: result.id } : item))
        )
        showToast('success', 'WBS element created')
        setActiveElementId(result.id)
        loadElements()
      } else {
        showToast('error', `Could not create element: ${result.error}`)
        loadElements()
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
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, name: newName } : el)))

    startTransition(async () => {
      const result = await updateWbsElement(id, projectId, { name: newName })
      if (result.ok) {
        showToast('success', 'Element renamed')
      } else {
        showToast('error', `Could not rename: ${result.error}`)
        loadElements()
      }
    })
  }

  const getDescendantWorkPackages = (parentId: string, allElements: WbsElement[]): WbsElement[] => {
    const result: WbsElement[] = []
    const children = allElements.filter(e => e.parentId === parentId)
    for (const child of children) {
      if (child.isWorkPackage) {
        result.push(child)
      } else {
        result.push(...getDescendantWorkPackages(child.id, allElements))
      }
    }
    return result
  }

  const propagateStatusToParents = (elementId: string, currentElements: WbsElement[]) => {
    const element = currentElements.find(e => e.id === elementId)
    if (!element || !element.parentId) return

    let parentId: string | null = element.parentId
    const updatedElements = [...currentElements]
    const parentUpdates: { id: string; status: string }[] = []

    while (parentId) {
      const parent = updatedElements.find(e => e.id === parentId)
      if (!parent || parent.isWorkPackage) break

      const descendantWPs = getDescendantWorkPackages(parentId, updatedElements)
      if (descendantWPs.length === 0) {
        parentId = parent.parentId
        continue
      }

      const allComplete = descendantWPs.every(wp => wp.status === 'Complete')
      const allNotStarted = descendantWPs.every(wp => wp.status === 'Not Started')

      let newParentStatus: string
      if (allComplete) {
        newParentStatus = 'Complete'
      } else if (allNotStarted) {
        newParentStatus = 'Not Started'
      } else {
        newParentStatus = 'In Progress'
      }

      if (parent.status !== newParentStatus) {
        parent.status = newParentStatus
        parentUpdates.push({ id: parent.id, status: newParentStatus })
      }

      parentId = parent.parentId
    }

    if (parentUpdates.length > 0) {
      setElements(prev =>
        prev.map(el => {
          const update = parentUpdates.find(u => u.id === el.id)
          return update ? { ...el, status: update.status } : el
        })
      )

      startTransition(async () => {
        for (const update of parentUpdates) {
          await updateWbsElement(update.id, projectId, { status: update.status })
        }
      })
    }
  }

  const getElementProgress = (elementId: string): number => {
    const descendantWPs = getDescendantWorkPackages(elementId, elements)
    if (descendantWPs.length === 0) return 0
    const completedCount = descendantWPs.filter(wp => wp.status === 'Complete').length
    return Math.round((completedCount / descendantWPs.length) * 100)
  }

  const handleSaveDetails = async (id: string, updates: Partial<WbsElement>): Promise<boolean> => {
    if (id.startsWith('temp-')) {
      showToast('info', 'Please wait for the new element to finish saving before updating details')
      return false
    }

    saveSnapshot(elements)
    const updatedList = elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    setElements(updatedList)

    const result = await updateWbsElement(id, projectId, updates)
    if (result.ok) {
      showToast('success', 'WBS Dictionary details updated')
      if (updates.status !== undefined) {
        propagateStatusToParents(id, updatedList)
      }
      return true
    } else {
      showToast('error', `Could not save details: ${result.error}`)
      loadElements()
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
        loadElements()
      } else {
        showToast('error', `Could not delete element: ${result.error}`)
        loadElements()
      }
    })
  }

  const handleBulkDelete = () => {
    if (!hasEditAccess || selectedIds.length === 0) return

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} WBS elements? All their children will also be deleted recursively. This action cannot be undone.`)) return

    saveSnapshot(elements)

    const idsToDelete = new Set(selectedIds)
    const queue = [...selectedIds]
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const children = elements.filter(e => e.parentId === currentId)
      children.forEach(c => {
        if (!idsToDelete.has(c.id)) {
          idsToDelete.add(c.id)
          queue.push(c.id)
        }
      })
    }

    const optimisticList = recalculateClientCodes(elements.filter(el => !idsToDelete.has(el.id)))
    setElements(optimisticList)
    if (activeElementId && idsToDelete.has(activeElementId)) {
      setActiveElementId(null)
    }

    startTransition(async () => {
      const result = await bulkDeleteWbsElements(Array.from(idsToDelete), projectId)
      if (result.ok) {
        showToast('success', `${idsToDelete.size} WBS elements deleted`)
        setSelectedIds([])
        loadElements()
      } else {
        showToast('error', `Could not delete elements: ${result.error}`)
        loadElements()
      }
    })
  }

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
        loadElements()
      } else {
        showToast('error', `Could not update structure: ${result.error}`)
        loadElements()
      }
    })
  }

  return {
    isPending,
    syncStateToDatabase,
    handleCreateElement,
    handleRenameElement,
    handleSaveDetails,
    handleDeleteElement,
    handleBulkDelete,
    handleMoveNode,
    getElementProgress
  }
}
