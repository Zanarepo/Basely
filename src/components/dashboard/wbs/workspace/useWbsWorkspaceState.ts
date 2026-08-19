import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Iteration } from '@/lib/releases/types'
import { useCreateIterationWithTagging } from '../hooks/useCreateIterationWithTagging'
import { WbsViewType } from './WbsToolbar'

export function useWbsWorkspaceState(
  projectId: string,
  elements: any[],
  treeNodes: any[],
  setActiveElementId: (id: string | null) => void,
  setExpandedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedIds: string[],
  clearSelection: () => void,
  loadElements: () => void,
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void
) {
  const searchParams = useSearchParams()
  const initialView = (searchParams.get('wbsView') as WbsViewType) || 'tree'
  const [currentView, setCurrentView] = useState<WbsViewType>(initialView)

  // -- Local Storage States --
  const [showFinancials, setShowFinancials] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wbsShowFinancials')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wbsShowFinancials', JSON.stringify(showFinancials))
    }
  }, [showFinancials])

  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`wbs_hide_completed_${projectId}`)
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`wbs_hide_completed_${projectId}`, JSON.stringify(hideCompleted))
    }
  }, [projectId, hideCompleted])


  // -- Iterations --
  const [iterations, setIterations] = useState<Iteration[]>([])
  const { createIterationWithTagging } = useCreateIterationWithTagging(projectId)

  useEffect(() => {
    const fetchIterations = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('iterations')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true })

      if (data) {
        setIterations(
          data.map((i: any) => ({
            id: i.id,
            projectId: i.project_id,
            name: i.name,
            sequenceNumber: i.sequence_number,
            startDate: i.start_date,
            endDate: i.end_date,
            labelOverride: i.label_override || null,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }))
        )
      }
    }
    fetchIterations()
  }, [projectId])

  const handleSaveIterationWithTagging = async (
    name: string,
    sequenceNumber: number,
    startDate: string,
    endDate: string,
    labelOverride?: 'sprint' | 'phase' | null,
    selectedWbsIds: string[] = []
  ) => {
    const res = await createIterationWithTagging(
      name,
      sequenceNumber,
      startDate,
      endDate,
      labelOverride,
      selectedWbsIds
    )

    if (res.ok && res.iteration) {
      showToast('success', `${res.iteration.name} created successfully!`)
      const supabase = createClient()
      const { data } = await supabase
        .from('iterations')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true })

      if (data) {
        setIterations(
          data.map((i: any) => ({
            id: i.id,
            projectId: i.project_id,
            name: i.name,
            sequenceNumber: i.sequence_number,
            startDate: i.start_date,
            endDate: i.end_date,
            labelOverride: i.label_override || null,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }))
        )
      }
      loadElements()
    }
    return res
  }

  const handleBulkAssignIteration = async (iterationId: string | null) => {
    if (selectedIds.length === 0) return
    const supabase = createClient()
    const { error } = await supabase
      .from('wbs_elements')
      .update({ iteration_id: iterationId })
      .in('id', selectedIds)

    if (!error) {
      try {
        await supabase
          .from('activities')
          .update({ iteration_id: iterationId })
          .in('wbs_element_id', selectedIds)
      } catch (e) {}

      const targetName = iterationId
        ? iterations.find((i) => i.id === iterationId)?.name || 'selected iteration'
        : 'Unassigned Backlog'
      showToast('success', `Assigned ${selectedIds.length} item(s) to ${targetName}`)
      clearSelection()
      loadElements()
    } else {
      showToast('error', 'Failed to assign items: ' + error.message)
    }
  }

  // -- URL & Navigation Sync --
  const elementIdFromUrl = searchParams.get('element')
  const [processedElementId, setProcessedElementId] = useState<string | null>(null)

  useEffect(() => {
    if (elementIdFromUrl && elementIdFromUrl !== processedElementId && elements.length > 0) {
      setActiveElementId(elementIdFromUrl)
      setProcessedElementId(elementIdFromUrl)
      
      const el = elements.find(e => e.id === elementIdFromUrl)
      if (el && el.parentId) {
        let current: any = el
        const toExpand = new Set<string>()
        while (current?.parentId) {
          toExpand.add(current.parentId)
          current = elements.find(e => e.id === current.parentId)
        }
        setExpandedNodeIds(prev => new Set([...prev, ...toExpand]))
      }
    }
  }, [elementIdFromUrl, processedElementId, elements, setActiveElementId, setExpandedNodeIds])

  useEffect(() => {
    const elementId = searchParams.get('elementId')
    if (elementId && elements.length > 0) {
      setActiveElementId(elementId)
      const el = elements.find(e => e.id === elementId)
      if (el?.parentId) {
        setExpandedNodeIds(prev => {
          const next = new Set(prev)
          let currentId = el.parentId
          while (currentId) {
            next.add(currentId)
            const parent = elements.find(e => e.id === currentId)
            currentId = parent?.parentId ?? null
          }
          return next
        })
      }
    }
  }, [searchParams, elements, setActiveElementId, setExpandedNodeIds])

  useEffect(() => {
    const view = searchParams.get('wbsView') as WbsViewType
    if (view && ['tree', 'board', 'grid', 'raci', 'unassigned'].includes(view)) {
      setCurrentView(view)
    }
  }, [searchParams])

  // -- Data Processing & Filtering --
  const treeNodesWithCosts = useMemo(() => {
    const calculateCosts = (nodes: any[]): any[] => {
      return nodes.map(node => {
        const clonedChildren = calculateCosts(node.children)
        let totalCost = node.element.cost || 0
        for (const child of clonedChildren) {
          totalCost += (child.element.cost || 0)
        }
        return {
          ...node,
          children: clonedChildren,
          element: { ...node.element, cost: totalCost }
        }
      })
    }
    return calculateCosts(treeNodes)
  }, [treeNodes])

  const sortedElements = useMemo(() => {
    const list: typeof elements = []
    const traverse = (nodes: typeof treeNodes) => {
      for (const node of nodes) {
        list.push(node.element)
        traverse(node.children)
      }
    }
    traverse(treeNodes)
    return list
  }, [treeNodes])

  const isCompletedStatus = (status?: string | null) => {
    if (!status) return false
    const s = status.toLowerCase()
    return s === 'complete' || s === 'completed' || s === 'done'
  }

  const completedCount = useMemo(() => {
    return elements.filter((e) => isCompletedStatus(e.status)).length
  }, [elements])

  const filteredSortedElements = useMemo(() => {
    if (!hideCompleted) return sortedElements
    return sortedElements.filter((e) => !isCompletedStatus(e.status))
  }, [sortedElements, hideCompleted])

  const filteredTreeNodesWithCosts = useMemo(() => {
    if (!hideCompleted) return treeNodesWithCosts
    const filterTree = (nodes: any[]): any[] => {
      return nodes
        .filter((node) => !isCompletedStatus(node.element.status))
        .map((node) => ({
          ...node,
          children: filterTree(node.children),
        }))
    }
    return filterTree(treeNodesWithCosts)
  }, [treeNodesWithCosts, hideCompleted])

  return {
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
  }
}
