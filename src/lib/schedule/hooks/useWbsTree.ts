import { useMemo } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Activity } from '@/lib/schedule/cpm'

/**
 * Derives WBS tree metadata: element levels, codes, visibility, and timeline bounds.
 */
export function useWbsTree(
  elements: WbsElement[],
  activities: Activity[],
  expandedNodeIds: Set<string>,
  setExpandedNodeIds: (ids: Set<string>) => void,
) {
  // Pre-calculate visual level for indentation
  const elementLevels = useMemo(() => {
    const map = new Map<string, number>()
    const getLevel = (el: WbsElement): number => {
      if (map.has(el.id)) return map.get(el.id)!
      if (!el.parentId) return 0
      const parent = elements.find((x) => x.id === el.parentId)
      const lvl = parent ? getLevel(parent) + 1 : 0
      map.set(el.id, lvl)
      return lvl
    }
    elements.forEach((el) => getLevel(el))
    return map
  }, [elements])

  // Auto-align timeline borders
  const timelineDates = useMemo(() => {
    if (activities.length === 0) {
      const today = new Date().toISOString().split('T')[0]!
      return { start: today, end: today }
    }

    const startTimes = activities.filter((a) => a.es).map((a) => new Date(a.es!).getTime())
    const finishTimes = activities.filter((a) => a.ef).map((a) => new Date(a.ef!).getTime())

    const minDate = startTimes.length > 0 ? new Date(Math.min(...startTimes)) : new Date()
    const maxDate = finishTimes.length > 0 ? new Date(Math.max(...finishTimes)) : new Date()

    // Add buffers (14 days start, 45 days finish)
    minDate.setDate(minDate.getDate() - 14)
    maxDate.setDate(maxDate.getDate() + 45)

    return {
      start: minDate.toISOString().split('T')[0]!,
      end: maxDate.toISOString().split('T')[0]!,
    }
  }, [activities])

  // Toggle child expansion
  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedNodeIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodeIds(newExpanded)
  }

  // Filter tree rows based on parent expand states
  const visibleElements = useMemo(() => {
    return elements.filter((el) => {
      let temp = el.parentId
      while (temp) {
        if (!expandedNodeIds.has(temp)) return false
        const parent = elements.find((x) => x.id === temp)
        temp = parent ? parent.parentId : null
      }
      return true
    })
  }, [elements, expandedNodeIds])

  // Lookup code mapping (e.g. "1.2.3")
  const wbsCodes = useMemo(() => {
    const codes = new Map<string, string>()
    const countMap = new Map<string | null, number>()

    const generateCode = (el: WbsElement) => {
      const parent = el.parentId
      const parentCode = parent ? codes.get(parent) : ''
      const count = (countMap.get(parent) || 0) + 1
      countMap.set(parent, count)
      const code = parentCode ? `${parentCode}.${count}` : `${count}`
      codes.set(el.id, code)
    }

    elements.forEach((el) => generateCode(el))
    return codes
  }, [elements])

  return {
    elementLevels,
    timelineDates,
    handleToggleExpand,
    visibleElements,
    wbsCodes,
  }
}
