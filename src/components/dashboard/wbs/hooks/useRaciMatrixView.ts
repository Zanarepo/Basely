import { useState, useEffect, useMemo } from 'react'
import { getProjectRaciStakeholders } from '@/lib/wbs/raci-actions'
import type { WbsElement } from '@/lib/wbs/constants'

export type Stakeholder = {
  id: string
  name: string
  organization_type: 'internal' | 'external'
  profiles?: { full_name: string | null; email: string | null } | any
}

interface UseRaciMatrixViewProps {
  projectId: string
  elements: WbsElement[]
  expandedNodeIds: Set<string>
}

export function useRaciMatrixView({ projectId, elements, expandedNodeIds }: UseRaciMatrixViewProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchStakeholder, setSearchStakeholder] = useState('')
  const [showWbsColumn, setShowWbsColumn] = useState(true)

  useEffect(() => {
    async function loadStakeholders() {
      try {
        const data = await getProjectRaciStakeholders(projectId)
        if (data) setStakeholders(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStakeholders()
  }, [projectId])

  const filteredElements = useMemo(() => {
    // Filter out milestones (duration === 0) — they only appear on Gantt and Status Report
    const nonMilestoneElements = elements.filter((el) => {
      if (!el.isWorkPackage) return true // summary elements always show
      return el.duration !== 0
    })

    const visible: WbsElement[] = []
    const parentVisible = new Map<string, boolean>()

    nonMilestoneElements.forEach((el) => {
      let isVisible = true

      if (el.parentId) {
        const pVisible = parentVisible.get(el.parentId) ?? true
        const pExpanded = expandedNodeIds.has(el.parentId)
        isVisible = pVisible && pExpanded
      }

      parentVisible.set(el.id, isVisible)

      if (isVisible) {
        visible.push(el)
      }
    })

    return visible
  }, [elements, expandedNodeIds])

  const elementLevels = useMemo(() => {
    const levels = new Map<string, number>()
    elements.forEach((el) => {
      let lvl = 0
      if (el.parentId) {
        lvl = (levels.get(el.parentId) || 0) + 1
      }
      levels.set(el.id, lvl)
    })
    return levels
  }, [elements])

  const filteredStakeholders = useMemo(() => {
    if (!searchStakeholder) return stakeholders
    const query = searchStakeholder.toLowerCase()
    return stakeholders.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.profiles?.full_name?.toLowerCase().includes(query)) ||
      (s.profiles?.email?.toLowerCase().includes(query))
    )
  }, [stakeholders, searchStakeholder])

  return {
    stakeholders,
    loading,
    searchStakeholder,
    setSearchStakeholder,
    showWbsColumn,
    setShowWbsColumn,
    filteredElements,
    elementLevels,
    filteredStakeholders
  }
}
