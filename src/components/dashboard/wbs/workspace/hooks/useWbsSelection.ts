import { useState } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'

export function useWbsSelection(elements: WbsElement[], showToast: (type: 'info', msg: string) => void) {
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const activeElement = elements.find((item) => item.id === activeElementId) || null

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      let next = [...prev]
      if (next.includes(id)) {
        next = next.filter(sid => sid !== id)
      } else {
        next.push(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(elements.map(e => e.id))
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

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

  return {
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
  }
}
