'use client'

import { useState, useEffect } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import { createClient } from '@/utils/supabase/client'

export type WbsGridElementData = WbsElement & {
  start: string
  finish: string
  duration: string
  float: string
}

type ActivityRow = {
  wbs_element_id: string
  es: string | null
  ef: string | null
  duration: number
  total_float: number | null
}

export function useWbsGridData(projectId: string, elements: WbsElement[]) {
  const [gridData, setGridData] = useState<WbsGridElementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const workPackages = elements.filter((e) => e.isWorkPackage)
    if (workPackages.length === 0) {
      setGridData([])
      setLoading(false)
      return
    }

    const fetchScheduleData = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: activities, error } = await supabase
        .from('activities')
        .select('wbs_element_id, es, ef, duration, total_float')
        .eq('project_id', projectId)

      if (error) {
        console.error('Failed to fetch schedule data for grid:', error.message)
        // Fallback: show work packages with empty schedule fields
        setGridData(workPackages.map(wp => ({
          ...wp,
          start: '—',
          finish: '—',
          duration: '—',
          float: '—',
        })))
        setLoading(false)
        return
      }

      // Build a lookup map: wbs_element_id -> activity schedule data
      const activityMap = new Map<string, ActivityRow>()
      if (activities) {
        activities.forEach((act: ActivityRow) => {
          activityMap.set(act.wbs_element_id, act)
        })
      }

      const merged: WbsGridElementData[] = workPackages.map((wp) => {
        const act = activityMap.get(wp.id)

        if (act) {
          return {
            ...wp,
            start: act.es || '—',
            finish: act.ef || '—',
            duration: `${act.duration}d`,
            float: act.total_float !== null ? `${act.total_float}d` : '—',
          }
        }

        // No activity record yet
        return {
          ...wp,
          start: '—',
          finish: '—',
          duration: '—',
          float: '—',
        }
      })

      setGridData(merged)
      setLoading(false)
    }

    fetchScheduleData()
  }, [projectId, elements])

  return {
    gridData,
    loading,
  }
}
