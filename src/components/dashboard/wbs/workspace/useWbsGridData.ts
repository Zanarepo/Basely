'use client'

import { useState, useEffect } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'
import { createClient } from '@/utils/supabase/client'

export type WbsGridElementData = Omit<WbsElement, 'duration' | 'cost'> & {
  start: string
  finish: string
  es: string
  ef: string
  ls: string
  lf: string
  duration: string
  float: string
  cost: number | null
  currency: string | null
}

type ActivityRow = {
  wbs_element_id: string
  es: string | null
  ef: string | null
  ls: string | null
  lf: string | null
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
          .select('wbs_element_id, es, ef, ls, lf, duration, total_float')
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
          es: '—',
          ef: '—',
          ls: '—',
          lf: '—',
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

      const costMap = new Map<string, { budgeted_total: number }>()
      if (costAccounts) {
        costAccounts.forEach((ca: any) => {
          costMap.set(ca.wbs_element_id, { budgeted_total: Number(ca.budgeted_total) || 0 })
        })
      }

      // Helper function to recursively collect all descendant work packages of a summary element
      const getDescendantWorkPackages = (parentId: string): { element: WbsElement; act: ActivityRow | undefined; cost: number }[] => {
        const results: { element: WbsElement; act: ActivityRow | undefined; cost: number }[] = []
        const children = elements.filter(e => e.parentId === parentId)

        for (const child of children) {
          if (child.isWorkPackage) {
            const act = activityMap.get(child.id)
            const costObj = costMap.get(child.id)
            results.push({
              element: child,
              act,
              cost: costObj ? costObj.budgeted_total : (child.cost || 0)
            })
          } else {
            results.push(...getDescendantWorkPackages(child.id))
          }
        }
        return results
      }

      const merged: WbsGridElementData[] = elements.map((e) => {
        if (e.isWorkPackage) {
          // Work Package: direct activity and cost data
          const act = activityMap.get(e.id)
          const costData = costMap.get(e.id)

          return {
            ...e,
            start: act?.es || '—',
            finish: act?.ef || '—',
            es: act?.es || '—',
            ef: act?.ef || '—',
            ls: act?.ls || '—',
            lf: act?.lf || '—',
            duration: act?.duration ? `${act.duration}d` : '—',
            float: act?.total_float !== undefined && act?.total_float !== null ? `${act.total_float}d` : '—',
            cost: costData ? costData.budgeted_total : (e.cost || 0),
            currency: projectCurrency,
          }
        } else {
          // Summary Element: Roll-up metrics of all descendant work packages
          const descendants = getDescendantWorkPackages(e.id)

          if (descendants.length === 0) {
            return {
              ...e,
              start: '—',
              finish: '—',
              es: '—',
              ef: '—',
              ls: '—',
              lf: '—',
              duration: '—',
              float: '—',
              cost: 0,
              currency: projectCurrency,
            }
          }

          // 1. ES (Earliest Early Start) & EF (Latest Early Finish)
          const validStarts = descendants.map(d => d.act?.es).filter((s): s is string => !!s)
          const earliestStart = validStarts.length > 0
            ? new Date(Math.min(...validStarts.map(s => new Date(s).getTime()))).toISOString().split('T')[0]
            : '—'

          const validFinishes = descendants.map(d => d.act?.ef).filter((f): f is string => !!f)
          const latestFinish = validFinishes.length > 0
            ? new Date(Math.max(...validFinishes.map(f => new Date(f).getTime()))).toISOString().split('T')[0]
            : '—'

          // 2. LS (Earliest Late Start) & LF (Latest Late Finish)
          const validLS = descendants.map(d => d.act?.ls).filter((s): s is string => !!s)
          const earliestLS = validLS.length > 0
            ? new Date(Math.min(...validLS.map(s => new Date(s).getTime()))).toISOString().split('T')[0]
            : '—'

          const validLF = descendants.map(d => d.act?.lf).filter((f): f is string => !!f)
          const latestLF = validLF.length > 0
            ? new Date(Math.max(...validLF.map(f => new Date(f).getTime()))).toISOString().split('T')[0]
            : '—'

          // 3. Duration: working days from earliestStart to latestFinish
          let durationStr = '—'
          if (earliestStart !== '—' && latestFinish !== '—') {
            const startDt = new Date(earliestStart)
            const finishDt = new Date(latestFinish)
            let workingDays = 0
            const cur = new Date(startDt)
            while (cur <= finishDt) {
              const day = cur.getDay()
              if (day !== 0 && day !== 6) workingDays++
              cur.setDate(cur.getDate() + 1)
            }
            durationStr = `${Math.max(1, workingDays)}d`
          }

          // 4. Float: Minimum total_float among descendants (tightest critical path margin)
          const validFloats = descendants.map(d => d.act?.total_float).filter((f): f is number => f !== undefined && f !== null)
          const minFloat = validFloats.length > 0 ? Math.min(...validFloats) : null
          const floatStr = minFloat !== null ? `${minFloat}d` : '—'

          // 5. Total Cost: Sum of budgeted_total of all descendant work packages
          const totalCost = descendants.reduce((sum, d) => sum + (d.cost || 0), 0)

          // 6. Roll-up status
          const allComplete = descendants.every(d => d.element.status === 'Complete')
          const anyInProgress = descendants.some(d => d.element.status === 'In Progress' || d.element.status === 'Complete')
          const summaryStatus = allComplete ? 'Complete' : anyInProgress ? 'In Progress' : e.status

          return {
            ...e,
            status: summaryStatus,
            start: earliestStart,
            finish: latestFinish,
            es: earliestStart,
            ef: latestFinish,
            ls: earliestLS,
            lf: latestLF,
            duration: durationStr,
            float: floatStr,
            cost: totalCost,
            currency: projectCurrency,
          }
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
