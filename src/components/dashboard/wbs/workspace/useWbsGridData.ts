'use client'

import { useState, useEffect } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import { createClient } from '@/utils/supabase/client'

export type WbsGridElementData = Omit<WbsElement, 'duration'> & {
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
    if (elements.length === 0) {
      setGridData([])
      setLoading(false)
      return
    }

    const fetchScheduleData = async () => {
      setLoading(true)
      const supabase = createClient()

      const [activitiesRes, costAccountsRes, projectRes] = await Promise.all([
        supabase
          .from('activities')
          .select('wbs_element_id, es, ef, duration, total_float')
          .eq('project_id', projectId),
        supabase
          .from('cost_accounts')
          .select('wbs_element_id, budgeted_total')
          .in('wbs_element_id', elements.map(e => e.id)),
        supabase
          .from('projects')
          .select('currency')
          .eq('id', projectId)
          .single()
      ])

      const { data: activities, error: activitiesError } = activitiesRes
      const { data: costAccounts, error: costAccountsError } = costAccountsRes
      const { data: projectData } = projectRes
      const projectCurrency = projectData?.currency || 'USD'

      if (activitiesError || costAccountsError) {
        console.error('Failed to fetch schedule/cost data for grid:', activitiesError?.message || costAccountsError?.message)
        // Fallback: show work packages with empty schedule fields
        setGridData(elements.map(e => ({
          ...e,
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

      const merged: WbsGridElementData[] = elements.map((e) => {
        const act = activityMap.get(e.id)
        const costData = costMap.get(e.id)

        if (act) {
          return {
            ...e,
            start: act.es || '—',
            finish: act.ef || '—',
            duration: `${act.duration}d`,
            float: act.total_float !== null ? `${act.total_float}d` : '—',
            cost: costData ? costData.budgeted_total : null,
            currency: projectCurrency,
          }
        }

        return {
          ...e,
          start: '—',
          finish: '—',
          duration: '—',
          float: '—',
          cost: costData ? costData.budgeted_total : null,
          currency: projectCurrency,
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
