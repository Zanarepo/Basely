import { useState, useEffect } from 'react'
import { getWbsElements } from '@/lib/wbs/core-actions'
import { getScheduleData } from '@/lib/schedule/actions/queries'
import { getPendingApprovalsForProject } from '@/lib/approvals/actions'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Activity, Dependency } from '@/lib/schedule/cpm'
import { createClient } from '@/utils/supabase/client'

export type HudMessage = { text: string; type: 'success' | 'error' | 'info' } | null

/** Sorts WBS elements into parent-child hierarchy order */
function sortWbsElements(list: WbsElement[]): WbsElement[] {
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

/**
 * Manages schedule data fetching, realtime subscriptions, and core state.
 */
export function useScheduleData(projectId: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [elements, setElements] = useState<WbsElement[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [baselines, setBaselines] = useState<any[]>([])
  const [baselineSnapshots, setBaselineSnapshots] = useState<any[]>([])
  const [pendingBaselines, setPendingBaselines] = useState<any[]>([])

  const [hudMessage, setHudMessage] = useState<HudMessage>(null)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('')

  const showHud = (text: string, type: HudMessage extends null ? never : NonNullable<HudMessage>['type'], autoHideMs = 3000) => {
    setHudMessage({ text, type })
    if (autoHideMs > 0) {
      setTimeout(() => setHudMessage(null), autoHideMs)
    }
  }

  // Fetch all scheduling and hierarchy data
  const fetchData = async (showHudOnComplete = false) => {
    if (showHudOnComplete) {
      setHudMessage({ text: 'Recalculating critical path and floats...', type: 'info' })
    }

    try {
      const [wbsRes, schedRes, pendingRes] = await Promise.all([
        getWbsElements(projectId),
        getScheduleData(projectId),
        getPendingApprovalsForProject(projectId, 'schedule_baseline')
      ])

      if (!wbsRes.ok) throw new Error(wbsRes.error)
      if (!schedRes.ok) throw new Error(schedRes.error)

      setPendingBaselines(pendingRes)

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

      if (showHudOnComplete) {
        showHud('Schedule successfully updated!', 'success')
      }
    } catch (err: any) {
      setError(err.message)
      showHud(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [projectId])

  // Subscribe to Realtime changes for schedule tables
  useEffect(() => {
    if (!projectId) return

    let timeoutId: NodeJS.Timeout
    let isMounted = true

    const handleRealtimeUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (!isMounted) return
        fetchData(false)
      }, 1000)
    }

    const supabase = createClient()
    const channelName = `schedule_sync:${projectId}_${Math.random().toString(36).substring(7)}`

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities', filter: `project_id=eq.${projectId}` },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dependencies', filter: `project_id=eq.${projectId}` },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wbs_elements', filter: `project_id=eq.${projectId}` },
        handleRealtimeUpdate
      )
      .subscribe()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [projectId])

  // Get snapshots when baseline selection changes
  useEffect(() => {
    if (!selectedBaselineId) {
      setBaselineSnapshots([])
      return
    }
    const fetchSnapshots = async () => {
      try {
        const supabase = createClient()
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

  return {
    loading,
    setLoading,
    error,
    elements,
    activities,
    setActivities,
    dependencies,
    setDependencies,
    baselines,
    baselineSnapshots,
    pendingBaselines,
    hudMessage,
    showHud,
    expandedNodeIds,
    setExpandedNodeIds,
    selectedBaselineId,
    setSelectedBaselineId,
    fetchData,
  }
}
