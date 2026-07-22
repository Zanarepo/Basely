'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { calculateProjectRagStatus, type RagStatus } from '@/lib/dashboard/rag-logic'

export interface PortfolioProjectInput {
  id: string
  name: string
  clientName: string | null
  description: string | null
  methodology: 'Waterfall' | 'Agile' | 'Hybrid'
  currency: string
  startDate: string | null
  endDate: string | null
}

export interface PortfolioProjectRow {
  id: string
  name: string
  clientName: string | null
  methodology: string
  currency: string
  overallPercentComplete: number
  cpi: number | null
  spi: number | null
  eac: number
  vac: number
  ac: number
  bac: number
  slippageDays: number
  ragStatus: RagStatus
}

export interface PortfolioAggregates {
  totalBudget: number
  totalSpend: number
  redCount: number
  amberCount: number
  greenCount: number
}

export interface EvmSnapshotItem {
  project_id: string
  cpi: number | null
  spi: number | null
  eac: number | null
  vac: number | null
  ac: number | null
  pv: number | null
  ev: number | null
}

export interface ActivityItem {
  id: string
  project_id: string
  wbs_element_id: string | null
  type: string
  duration: number | null
  percent_complete: number | null
  is_critical: boolean | null
  ef: string | null
  total_float: number | null
}

export interface BaselineItem {
  id: string
  project_id: string
}

export interface BaselineSnapItem {
  baseline_id: string
  activity_id: string
  baseline_finish: string | null
}

export interface ActualCostItem {
  wbs_element_id: string
  amount: number
}

export interface CostAccountItem {
  project_id: string
  budgeted_total: number
}

export function usePortfolioData(projects: PortfolioProjectInput[]) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectRows, setProjectRows] = useState<PortfolioProjectRow[]>([])
  const [aggregates, setAggregates] = useState<PortfolioAggregates>({
    totalBudget: 0,
    totalSpend: 0,
    redCount: 0,
    amberCount: 0,
    greenCount: 0
  })

  const fetchPortfolioData = useCallback(async () => {
    if (!projects || projects.length === 0) {
      setProjectRows([])
      setAggregates({
        totalBudget: 0,
        totalSpend: 0,
        redCount: 0,
        amberCount: 0,
        greenCount: 0
      })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const projectIds = projects.map(p => p.id)

    try {
      // 1. Fetch EVM snapshots for all projects in a single query
      const { data: allSnapshots, error: snapErr } = await supabase
        .from('evm_snapshots')
        .select('project_id, cpi, spi, eac, vac, ac, pv, ev')
        .in('project_id', projectIds)
        .is('wbs_element_id', null)
        .order('snapshot_date', { ascending: false })

      if (snapErr) throw snapErr

      // Group snapshots by project_id and keep only the latest snapshot_date per project
      const latestSnapshotsMap = new Map<string, EvmSnapshotItem>()
      const typedSnapshots = (allSnapshots || []) as unknown as EvmSnapshotItem[]
      typedSnapshots.forEach(snap => {
        if (!latestSnapshotsMap.has(snap.project_id)) {
          latestSnapshotsMap.set(snap.project_id, snap)
        }
      })

      // 2. Fetch all activities for all projects in a single query
      const { data: allActivities, error: actErr } = await supabase
        .from('activities')
        .select('id, project_id, wbs_element_id, type, duration, percent_complete, is_critical, ef, total_float')
        .in('project_id', projectIds)

      if (actErr) throw actErr

      // Group activities by project_id
      const activitiesMap = new Map<string, ActivityItem[]>()
      const typedActivities = (allActivities || []) as unknown as ActivityItem[]
      typedActivities.forEach(act => {
        const list = activitiesMap.get(act.project_id) || []
        list.push(act)
        activitiesMap.set(act.project_id, list)
      })

      // 3. Fetch latest baselines for all projects
      const { data: allBaselines, error: baseErr } = await supabase
        .from('baselines')
        .select('id, project_id')
        .in('project_id', projectIds)
        .order('saved_at', { ascending: false })

      if (baseErr) throw baseErr

      // Keep latest baseline per project
      const latestBaselineMap = new Map<string, BaselineItem>()
      const typedBaselines = (allBaselines || []) as unknown as BaselineItem[]
      typedBaselines.forEach(base => {
        if (!latestBaselineMap.has(base.project_id)) {
          latestBaselineMap.set(base.project_id, base)
        }
      })

      // Fetch baseline activity snapshots in batch
      const baselineIds = Array.from(latestBaselineMap.values()).map(b => b.id)
      let allBaselineSnaps: BaselineSnapItem[] = []
      if (baselineIds.length > 0) {
        const { data: snapData } = await supabase
          .from('baseline_activity_snapshots')
          .select('baseline_id, activity_id, baseline_finish')
          .in('baseline_id', baselineIds)
        allBaselineSnaps = (snapData || []) as unknown as BaselineSnapItem[]
      }

      // Group baseline snapshots by baseline_id
      const baselineSnapsMap = new Map<string, BaselineSnapItem[]>()
      allBaselineSnaps.forEach(s => {
        const list = baselineSnapsMap.get(s.baseline_id) || []
        list.push(s)
        baselineSnapsMap.set(s.baseline_id, list)
      })

      // 4. Fallback cost queries: cost accounts and actual costs in batch
      const [allAccountsRes, allActualsRes] = await Promise.all([
        supabase.from('cost_accounts').select('project_id, budgeted_total').in('project_id', projectIds),
        supabase.from('actual_costs').select('wbs_element_id, amount').in('wbs_element_id', typedActivities.map(a => a.wbs_element_id).filter(Boolean))
      ])

      const typedAccounts = (allAccountsRes.data || []) as unknown as CostAccountItem[]
      const accountsMap = new Map<string, number>()
      typedAccounts.forEach(acc => {
        const val = accountsMap.get(acc.project_id) || 0
        accountsMap.set(acc.project_id, val + (Number(acc.budgeted_total) || 0))
      })

      // Group actuals by project_id
      const wbsToProjectMap = new Map<string, string>()
      typedActivities.forEach(a => {
        if (a.wbs_element_id) {
          wbsToProjectMap.set(a.wbs_element_id, a.project_id)
        }
      })

      const typedActuals = (allActualsRes.data || []) as unknown as ActualCostItem[]
      const actualsMap = new Map<string, number>()
      typedActuals.forEach(act => {
        const pId = wbsToProjectMap.get(act.wbs_element_id)
        if (pId) {
          const val = actualsMap.get(pId) || 0
          actualsMap.set(pId, val + (Number(act.amount) || 0))
        }
      })

      // 5. Build project rows list
      const rows: PortfolioProjectRow[] = projects.map(proj => {
        const projActs = activitiesMap.get(proj.id) || []
        
        // Calculate weighted schedule percent complete
        const tasksOnly = projActs.filter(a => a.type === 'Task')
        const totalDuration = tasksOnly.reduce((sum, t) => sum + (Number(t.duration) || 0), 0)
        let overallPercentComplete = 0
        if (totalDuration > 0) {
          const weightedSum = tasksOnly.reduce((sum, t) => sum + (Number(t.percent_complete || 0) * (Number(t.duration) || 0)), 0)
          overallPercentComplete = Math.round(weightedSum / totalDuration)
        } else if (tasksOnly.length > 0) {
          const sum = tasksOnly.reduce((sum, t) => sum + Number(t.percent_complete || 0), 0)
          overallPercentComplete = Math.round(sum / tasksOnly.length)
        }

        // Calculate schedule slippage
        const criticalActivities = projActs.filter(a => a.is_critical)
        let slippageDays = 0
        
        const base = latestBaselineMap.get(proj.id)
        const snaps = base ? (baselineSnapsMap.get(base.id) || []) : []

        if (snaps.length > 0) {
          criticalActivities.forEach(act => {
            const snap = snaps.find(s => s.activity_id === act.id)
            if (snap && snap.baseline_finish && act.ef) {
              const diffMs = new Date(act.ef).getTime() - new Date(snap.baseline_finish).getTime()
              const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
              if (diffDays > slippageDays) {
                slippageDays = diffDays
              }
            }
          })
        } else {
          criticalActivities.forEach(act => {
            const float = act.total_float !== null ? Number(act.total_float) : 0
            if (float < 0 && Math.abs(float) > slippageDays) {
              slippageDays = Math.abs(float)
            }
          })
        }

        // Cost EVM Metrics
        const snap = latestSnapshotsMap.get(proj.id)
        let cpi: number | null
        let spi: number | null
        let eac = 0
        let vac = 0
        let ac = 0
        let bac = 0

        if (snap) {
          cpi = snap.cpi !== null ? Number(snap.cpi) : null
          spi = snap.spi !== null ? Number(snap.spi) : null
          eac = Number(snap.eac) || 0
          vac = Number(snap.vac) || 0
          ac = Number(snap.ac) || 0
          bac = eac + vac
        } else {
          // Live fallback
          bac = accountsMap.get(proj.id) || 0
          ac = actualsMap.get(proj.id) || 0
          const ev = bac * (overallPercentComplete / 100)
          cpi = ac > 0 ? ev / ac : 1.0
          spi = overallPercentComplete / 100
          eac = cpi > 0 ? ac + (bac - ev) / cpi : bac
          vac = bac - eac
        }

        // RAG Status
        const ragStatus = calculateProjectRagStatus({
          cpi,
          spi,
          criticalPathSlippageDays: slippageDays
        })

        return {
          id: proj.id,
          name: proj.name,
          clientName: proj.clientName,
          methodology: proj.methodology,
          currency: proj.currency,
          overallPercentComplete,
          cpi,
          spi,
          eac,
          vac,
          ac,
          bac,
          slippageDays,
          ragStatus
        }
      })

      setProjectRows(rows)

      // Calculate portfolio aggregates
      let totalBudget = 0
      let totalSpend = 0
      let redCount = 0
      let amberCount = 0
      let greenCount = 0

      rows.forEach(r => {
        totalBudget += r.bac
        totalSpend += r.ac
        if (r.ragStatus === 'Red') redCount++
        else if (r.ragStatus === 'Amber') amberCount++
        else greenCount++
      })

      setAggregates({
        totalBudget,
        totalSpend,
        redCount,
        amberCount,
        greenCount
      })

    } catch (err) {
      console.error('Error fetching portfolio data:', err)
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch portfolio rollup details'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [projects])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPortfolioData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchPortfolioData])

  return {
    loading,
    error,
    projectRows,
    aggregates,
    refresh: fetchPortfolioData
  }
}
