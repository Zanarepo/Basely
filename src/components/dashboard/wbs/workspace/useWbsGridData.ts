'use client'

import { useState, useEffect } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import { createClient } from '@/utils/supabase/client'

export type WbsGridElementData = WbsElement & {
  start: string
  finish: string
  duration: string
  float: string
  cost: number | null
  currency: string | null
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

      const [activitiesRes, costAccountsRes] = await Promise.all([
        supabase
          .from('activities')
          .select('wbs_element_id, es, ef, duration, total_float')
          .eq('project_id', projectId),
        supabase
          .from('cost_accounts')
          .select('wbs_element_id, budgeted_total, currency')
          .in('wbs_element_id', workPackages.map(wp => wp.id))
      ])

      const { data: activities, error: activitiesError } = activitiesRes
      const { data: costAccounts, error: costAccountsError } = costAccountsRes

      if (activitiesError || costAccountsError) {
        console.error('Failed to fetch schedule/cost data for grid:', activitiesError?.message || costAccountsError?.message)
        // Fallback: show work packages with empty schedule fields
        setGridData(workPackages.map(wp => ({
          ...wp,
          start: '—',
          finish: '—',
          duration: '—',
          float: '—',
          cost: null,
          currency: null,
        })))
        setLoading(false)
        return
      }

      // Build lookup maps
      const activityMap = new Map<string, ActivityRow>()
      if (activities) {
        activities.forEach((act: ActivityRow) => {
          activityMap.set(act.wbs_element_id, act)
        })
      }

      const costMap = new Map<string, { budgeted_total: number, currency: string }>()
      if (costAccounts) {
        costAccounts.forEach((ca: any) => {
          costMap.set(ca.wbs_element_id, { budgeted_total: ca.budgeted_total, currency: ca.currency })
        })
      }

      const merged: WbsGridElementData[] = workPackages.map((wp) => {
        const act = activityMap.get(wp.id)
        const costData = costMap.get(wp.id)

        if (act) {
          return {
            ...wp,
            start: act.es || '—',
            finish: act.ef || '—',
            duration: `${act.duration}d`,
            float: act.total_float !== null ? `${act.total_float}d` : '—',
            cost: costData ? costData.budgeted_total : null,
            currency: costData ? costData.currency : null,
          }
        }

        // No activity record yet
        return {
          ...wp,
          start: '—',
          finish: '—',
          duration: '—',
          float: '—',
          cost: costData ? costData.budgeted_total : null,
          currency: costData ? costData.currency : null,
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
