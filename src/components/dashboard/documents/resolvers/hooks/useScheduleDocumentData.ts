'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface ScheduleActivityItem {
  id: string
  name: string
  wbs_element_id?: string
  wbs_code?: string
  start_date?: string
  end_date?: string
  duration?: number
  is_critical?: boolean
  baseline_start?: string
  baseline_finish?: string
  status: string
  is_milestone?: boolean
}

export interface ScheduleDocumentData {
  activities: ScheduleActivityItem[]
  milestones: ScheduleActivityItem[]
  criticalPath: ScheduleActivityItem[]
  totalActivities: number
  criticalCount: number
  completedCount: number
  loading: boolean
  error?: string
  refetch: () => Promise<void>
}

export function useScheduleDocumentData(projectId: string, periodEnd?: Date, frozenData?: any): ScheduleDocumentData {
  const [loading, setLoading] = useState(!frozenData)
  const [activities, setActivities] = useState<ScheduleActivityItem[]>(frozenData?.activities || [])
  const [milestones, setMilestones] = useState<ScheduleActivityItem[]>(frozenData?.milestones || [])
  const [criticalPath, setCriticalPath] = useState<ScheduleActivityItem[]>(frozenData?.criticalPath || [])
  const [error, setError] = useState<string>()

  const loadData = useCallback(async () => {
    if (frozenData) {
      setActivities(frozenData.activities || [])
      setMilestones(frozenData.milestones || [])
      setCriticalPath(frozenData.criticalPath || [])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // Fetch activities (with joined wbs_elements.code), WBS elements and latest baseline
      const [actRes, wbsRes, baseRes] = await Promise.all([
        supabase.from('activities').select('*, wbs_elements(id, name, code)').eq('project_id', projectId).order('es', { ascending: true }),
        supabase.from('wbs_elements').select('id, name, code, status').eq('project_id', projectId),
        supabase.from('baselines').select('id').eq('project_id', projectId).order('saved_at', { ascending: false }).limit(1)
      ])

      if (actRes.error && actRes.error.code !== 'PGRST116') {
        console.warn('Could not load activities:', actRes.error)
      }
      if (wbsRes.error) {
        console.warn('Could not load wbs_elements:', wbsRes.error)
      }

      const wbsList = wbsRes.data || []
      const rawActivities = actRes.data || []

      let baselineSnapshots: any[] = []
      if (baseRes.data && baseRes.data.length > 0) {
        const { data: snaps } = await supabase
          .from('baseline_activity_snapshots')
          .select('activity_id, baseline_start, baseline_finish')
          .eq('baseline_id', baseRes.data[0].id)
        if (snaps) baselineSnapshots = snaps
      }

      let items: ScheduleActivityItem[] = []

      if (rawActivities.length > 0) {
        items = rawActivities.map((act: any) => {
          const wbsFromList = wbsList.find(w => w.id === act.wbs_element_id)
          const wbsJoined = Array.isArray(act.wbs_elements) ? act.wbs_elements[0] : act.wbs_elements
          const wbs = wbsFromList || wbsJoined
          const snap = baselineSnapshots.find(s => s.activity_id === act.id)
          const duration = Number(act.duration_days || act.duration || 0)
          const isMilestone = duration === 0 || act.name.toLowerCase().includes('milestone') || act.type === 'milestone'
          return {
            id: act.id,
            name: act.name,
            wbs_element_id: act.wbs_element_id,
            wbs_code: wbs?.code || act.wbs_code || 'N/A',
            start_date: act.es || act.start_date,
            end_date: act.ef || act.end_date || act.finish_date,
            duration,
            is_critical: Boolean(act.is_critical || act.total_float === 0),
            baseline_start: snap?.baseline_start || act.es || act.start_date,
            baseline_finish: snap?.baseline_finish || act.ef || act.end_date || act.finish_date,
            status: act.status || (act.percent_complete === 100 ? 'Completed' : 'In Progress'),
            is_milestone: isMilestone
          }
        })
      } else {
        // Fallback to WBS elements if no granular Gantt activities exist
        items = wbsList.map(wbs => ({
          id: wbs.id,
          name: wbs.name,
          wbs_element_id: wbs.id,
          wbs_code: wbs.code || 'WBS',
          start_date: undefined,
          end_date: undefined,
          duration: 1,
          is_critical: false,
          baseline_start: undefined,
          baseline_finish: undefined,
          status: wbs.status || 'Planned',
          is_milestone: wbs.name.toLowerCase().includes('milestone')
        }))
      }

      setActivities(items)
      setMilestones(items.filter(i => i.is_milestone))
      setCriticalPath(items.filter(i => i.is_critical))
    } catch (err: any) {
      console.error('Error in useScheduleDocumentData:', err)
      setError('Failed to fetch project schedule narrative data.')
    } finally {
      setLoading(false)
    }
  }, [projectId, periodEnd, frozenData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalActivities = activities.length
  const criticalCount = criticalPath.length
  const completedCount = activities.filter(a => a.status?.toLowerCase() === 'completed' || a.status?.toLowerCase() === 'done').length

  return {
    activities,
    milestones,
    criticalPath,
    totalActivities,
    criticalCount,
    completedCount,
    loading,
    error,
    refetch: loadData
  }
}
