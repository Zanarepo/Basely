import { useState, useMemo } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Iteration } from '@/lib/releases/types'

export type ScopeFilterType = 'active' | 'all' | 'backlog' | 'lookahead' | string

type UseWbsBoardFilterProps = {
  elements: WbsElement[]
  iterations: Iteration[]
  methodology: string | null
  hideCompleted: boolean
}

export function useWbsBoardFilter({
  elements,
  iterations,
  methodology,
  hideCompleted,
}: UseWbsBoardFilterProps) {
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set())
  const [scopeFilter, setScopeFilter] = useState<ScopeFilterType>('active')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const isAgile = methodology === 'Agile' || methodology === 'Hybrid'

  const isCompletedStatus = (status?: string | null) => {
    if (!status) return false
    const s = status.toLowerCase()
    return s === 'complete' || s === 'completed' || s === 'done'
  }

  const toggleColCollapse = (colName: string) => {
    setCollapsedCols((prev) => {
      const next = new Set(prev)
      if (next.has(colName)) next.delete(colName)
      else next.add(colName)
      return next
    })
  }

  // Identify active iteration
  const activeIteration = useMemo(() => {
    if (!iterations || iterations.length === 0) return null
    const now = new Date()
    const current = iterations.find(
      (i) => new Date(i.startDate) <= now && new Date(i.endDate) >= now
    )
    return current || iterations[0]
  }, [iterations])

  // Filter elements based on scopeFilter
  const filteredElements = useMemo(() => {
    if (scopeFilter === 'all') return elements

    if (scopeFilter === 'active') {
      if (!activeIteration) return elements
      return elements.filter(
        (e) => e.iterationId === activeIteration.id || e.iteration_id === activeIteration.id
      )
    }

    if (scopeFilter === 'backlog') {
      return elements.filter((e) => !e.iterationId && !e.iteration_id)
    }

    if (scopeFilter === 'lookahead') {
      // 3-Week Lookahead (21 days)
      const now = new Date()
      const cutoff = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
      return elements.filter((e) => {
        if (!e.createdAt) return true
        const date = new Date(e.createdAt)
        return date <= cutoff
      })
    }

    return elements.filter(
      (e) => e.iterationId === scopeFilter || e.iteration_id === scopeFilter
    )
  }, [elements, scopeFilter, activeIteration])

  const finalElements = useMemo(() => {
    if (!hideCompleted) return filteredElements
    return filteredElements.filter((e) => !isCompletedStatus(e.status))
  }, [filteredElements, hideCompleted])

  const completedCount = useMemo(() => {
    return filteredElements.filter((e) => isCompletedStatus(e.status)).length
  }, [filteredElements])

  return {
    collapsedCols,
    toggleColCollapse,
    scopeFilter,
    setScopeFilter,
    filterDropdownOpen,
    setFilterDropdownOpen,
    isAgile,
    activeIteration,
    filteredElements,
    finalElements,
    completedCount,
  }
}
