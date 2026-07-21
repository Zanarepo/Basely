import { useState, useEffect, useMemo } from 'react'
import { getWbsElements } from '@/lib/wbs/actions'
import { getScheduleData } from '@/lib/schedule/actions/queries'
import { recalculateSchedule } from '@/lib/schedule/actions/recalculate'
import { updateActivityDuration } from '@/lib/schedule/actions/activities'
import { createDependency, deleteDependency } from '@/lib/schedule/actions/dependencies'
import { saveBaseline } from '@/lib/schedule/actions/baselines'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Activity, Dependency } from '@/lib/schedule/cpm'

export function useGanttData(projectId: string) {
  // Loading & Data States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [elements, setElements] = useState<WbsElement[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [baselines, setBaselines] = useState<any[]>([])
  const [baselineSnapshots, setBaselineSnapshots] = useState<any[]>([])

  // HUD Status Toasts
  const [hudMessage, setHudMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Navigation & Control States
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('')

  // Fetch all scheduling and hierarchy data
  const fetchData = async (showHud = false) => {
    if (showHud) {
      setHudMessage({ text: 'Recalculating critical path and floats...', type: 'info' })
    }

    try {
      const [wbsRes, schedRes] = await Promise.all([
        getWbsElements(projectId),
        getScheduleData(projectId),
      ])

      if (!wbsRes.ok) throw new Error(wbsRes.error)
      if (!schedRes.ok) throw new Error(schedRes.error)

      // Sort elements by parent-child order and sortOrder
      const sorted = sortWbsElements(wbsRes.data || [])
      setElements(sorted)

      const { activities: acts, dependencies: deps, baselines: bLines } = schedRes.data || {}
      setActivities(acts || [])
      setDependencies(deps || [])
      setBaselines(bLines || [])

      // Auto expand all parent nodes on first load
      if (expandedNodeIds.size === 0) {
        const parents = sorted.filter((el) => !el.isWorkPackage).map((el) => el.id)
        setExpandedNodeIds(new Set(parents))
      }

      if (bLines && bLines.length > 0 && !selectedBaselineId) {
        setSelectedBaselineId(bLines[0].id)
      }

      if (showHud) {
        setHudMessage({ text: 'Schedule successfully updated!', type: 'success' })
      }
    } catch (err: any) {
      setError(err.message)
      setHudMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
      if (showHud) {
        setTimeout(() => setHudMessage(null), 3000)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // Get snapshots when baseline selection changes
  useEffect(() => {
    if (!selectedBaselineId) {
      setBaselineSnapshots([])
      return
    }
    const fetchSnapshots = async () => {
      try {
        const supabase = (await import('@/utils/supabase/client')).createClient()
        const { data } = await supabase
          .from('baseline_activity_snapshots')
          .select('*')
          .eq('baseline_id', selectedBaselineId)
        setBaselineSnapshots(data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchSnapshots()
  }, [selectedBaselineId])

  // Sort helper to format the hierarchy tree
  const sortWbsElements = (list: WbsElement[]): WbsElement[] => {
    const map = new Map<string | null, WbsElement[]>()
    list.forEach((item) => {
      const parent = item.parentId
      if (!map.has(parent)) map.set(parent, [])
      map.get(parent)!.push(item)
    })

    const result: WbsElement[] = []
    const traverse = (parentId: string | null) => {
      const children = map.get(parentId) || []
      children.sort((a, b) => a.sortOrder - b.sortOrder)
      children.forEach((child) => {
        result.push(child)
        traverse(child.id)
      })
    }
    traverse(null)
    return result
  }

  // Pre-calculate visual level for spacers
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

    // Find min start and max finish
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

  // Lookup code mapping
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

  // --- CPM Canvas Callback Handlers ---

  const handleMoveActivity = async (id: string, deltaDays: number): Promise<boolean> => {
    try {
      const act = activities.find((a) => a.id === id)
      if (!act) return false

      setHudMessage({ text: 'Updating activity schedule dates...', type: 'info' })

      const supabase = (await import('@/utils/supabase/client')).createClient()

      // Calculate new constraint parameters
      const currentEs = new Date(act.es!)
      const newEsDate = new Date(currentEs.getTime() + deltaDays * 24 * 60 * 60 * 1000)
      const newEsStr = newEsDate.toISOString().split('T')[0]!

      // Update constraints in the DB
      const { error: dbError } = await supabase
        .from('activities')
        .update({
          constraint_type: 'Start No Earlier Than',
          constraint_date: newEsStr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (dbError) throw new Error(dbError.message)

      // Recalculate CPM
      const res = await recalculateSchedule(projectId)
      if (!res.ok) throw new Error(res.error)

      await fetchData()
      setHudMessage({ text: 'Activity moved and timeline recalculated!', type: 'success' })
      setTimeout(() => setHudMessage(null), 3000)
      return true
    } catch (err: any) {
      setHudMessage({ text: err.message, type: 'error' })
      return false
    }
  }

  const handleResizeActivity = async (id: string, newDuration: number): Promise<boolean> => {
    try {
      setHudMessage({ text: 'Updating activity duration...', type: 'info' })
      const res = await updateActivityDuration(projectId, id, newDuration)
      if (!res.ok) throw new Error(res.error)

      await fetchData()
      setHudMessage({ text: 'Duration updated and timeline recalculated!', type: 'success' })
      setTimeout(() => setHudMessage(null), 3000)
      return true
    } catch (err: any) {
      setHudMessage({ text: err.message, type: 'error' })
      return false
    }
  }

  const handleCreateDependency = async (predId: string, succId: string): Promise<boolean> => {
    try {
      setHudMessage({ text: 'Adding dependency links...', type: 'info' })
      const res = await createDependency(projectId, predId, succId, 'FS', 0)
      if (!res.ok) throw new Error(res.error)

      await fetchData()
      setHudMessage({ text: 'Dependency link successfully established!', type: 'success' })
      setTimeout(() => setHudMessage(null), 3000)
      return true
    } catch (err: any) {
      setHudMessage({ text: err.message, type: 'error' })
      return false
    }
  }

  const handleDeleteDependency = async (depId: string): Promise<boolean> => {
    try {
      setHudMessage({ text: 'Removing dependency link...', type: 'info' })
      const res = await deleteDependency(projectId, depId)
      if (!res.ok) throw new Error(res.error)

      await recalculateSchedule(projectId)
      await fetchData()

      setHudMessage({ text: 'Dependency link removed', type: 'success' })
      setTimeout(() => setHudMessage(null), 3000)
      return true
    } catch (err: any) {
      setHudMessage({ text: err.message, type: 'error' })
      return false
    }
  }

  const handleCreateBaseline = async () => {
    const name = prompt('Enter a name for this baseline (e.g. Kickoff Baseline):')
    if (!name || !name.trim()) return

    setLoading(true)
    try {
      const res = await saveBaseline(projectId, name.trim())
      if (!res.ok) throw new Error(res.error)
      await fetchData()
      setHudMessage({ text: 'Baseline saved successfully!', type: 'success' })
      setTimeout(() => setHudMessage(null), 3000)
    } catch (err: any) {
      setHudMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    elements,
    activities,
    dependencies,
    baselines,
    baselineSnapshots,
    hudMessage,
    expandedNodeIds,
    selectedBaselineId,
    setSelectedBaselineId,
    timelineDates,
    visibleElements,
    wbsCodes,
    elementLevels,
    handleMoveActivity,
    handleResizeActivity,
    handleCreateDependency,
    handleDeleteDependency,
    handleToggleExpand,
    handleCreateBaseline,
  }
}
