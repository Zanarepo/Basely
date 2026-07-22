'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { calculateProjectRagStatus, type RagStatus } from '@/lib/dashboard/rag-logic'

export interface ProjectInfo {
  id: string
  name: string
  client_name: string | null
  description: string | null
  methodology: string
  currency: string
  start_date: string | null
  end_date: string | null
}

export interface ScheduleHealth {
  overallPercentComplete: number
  criticalPathStatus: 'On Track' | 'At Risk'
  slippageDays: number
  milestoneHit: number
  milestoneMissed: number
  milestoneUpcoming: number
}

export interface CostHealth {
  cpi: number | null
  spi: number | null
  eac: number
  vac: number
  pv: number
  ev: number
  ac: number
  bac: number
}

export interface DashboardMilestone {
  id: string
  name: string
  finishDate: string | null
  percentComplete: number
  status: 'Hit' | 'Missed' | 'Upcoming'
}

export interface BaselineSnapshot {
  activity_id: string
  baseline_finish: string | null
}

export interface DashboardRisk {
  id: string
  title: string
  risk_score: number
  probability: number
  impact: number
  status: string
  response_strategy: string | null
}

export function useProjectDashboardData(projectId: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [scheduleHealth, setScheduleHealth] = useState<ScheduleHealth | null>(null)
  const [costHealth, setCostHealth] = useState<CostHealth | null>(null)
  const [ragStatus, setRagStatus] = useState<RagStatus>('Green')
  const [upcomingMilestones, setUpcomingMilestones] = useState<DashboardMilestone[]>([])
  const [topRisks, setTopRisks] = useState<DashboardRisk[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const todayStr = new Date().toISOString().split('T')[0]

    try {
      // 1. Fetch project info
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('id, name, client_name, description, methodology, currency, start_date, end_date')
        .eq('id', projectId)
        .single()

      if (projErr) throw projErr
      setProject(projData)

      // 2. Fetch all schedule activities & baselines
      const [actRes, baseRes] = await Promise.all([
        supabase.from('activities').select('*').eq('project_id', projectId),
        supabase.from('baselines').select('id').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1)
      ])

      if (actRes.error) throw actRes.error
      const activities = actRes.data || []
      const latestBaseline = baseRes.data?.[0] || null

      // Fetch baseline snapshots if a baseline exists
      let baselineSnapshots: BaselineSnapshot[] = []
      if (latestBaseline) {
        const { data: snapData } = await supabase
          .from('baseline_activity_snapshots')
          .select('*')
          .eq('baseline_id', latestBaseline.id)
        baselineSnapshots = snapData || []
      }

      // Compute schedule percent complete (weighted by duration)
      const tasksOnly = activities.filter(a => a.type === 'Task')
      const totalDuration = tasksOnly.reduce((sum, t) => sum + (Number(t.duration) || 0), 0)
      let overallPercentComplete = 0
      if (totalDuration > 0) {
        const weightedSum = tasksOnly.reduce((sum, t) => sum + (Number(t.percent_complete || 0) * (Number(t.duration) || 0)), 0)
        overallPercentComplete = Math.round(weightedSum / totalDuration)
      } else if (tasksOnly.length > 0) {
        // Fallback to simple average
        const sum = tasksOnly.reduce((sum, t) => sum + Number(t.percent_complete || 0), 0)
        overallPercentComplete = Math.round(sum / tasksOnly.length)
      }

      // Compute milestones counters & list
      const milestoneActivities = activities.filter(a => a.type === 'Milestone' || Number(a.duration) === 0)
      let milestoneHit = 0
      let milestoneMissed = 0
      let milestoneUpcoming = 0
      const allMilestones: DashboardMilestone[] = []

      milestoneActivities.forEach(m => {
        const pct = Number(m.percent_complete) || 0
        const finishDate = m.ef || m.constraint_date || null
        
        let status: 'Hit' | 'Missed' | 'Upcoming' = 'Upcoming'
        if (pct === 100) {
          status = 'Hit'
          milestoneHit++
        } else if (finishDate && finishDate < todayStr) {
          status = 'Missed'
          milestoneMissed++
        } else {
          status = 'Upcoming'
          milestoneUpcoming++
        }

        allMilestones.push({
          id: m.id,
          name: m.name,
          finishDate,
          percentComplete: pct,
          status
        })
      })

      // Sort upcoming milestones chronologically
      const upcomingSorted = allMilestones
        .filter(m => m.status === 'Upcoming' || m.status === 'Missed')
        .sort((a, b) => {
          if (!a.finishDate) return 1
          if (!b.finishDate) return -1
          return new Date(a.finishDate).getTime() - new Date(b.finishDate).getTime()
        })
        .slice(0, 5)

      setUpcomingMilestones(upcomingSorted)

      // Calculate critical path slippage
      const criticalActivities = activities.filter(a => a.is_critical)
      let slippageDays = 0

      if (baselineSnapshots.length > 0) {
        // Compare with baseline snapshots
        criticalActivities.forEach(act => {
          const snap = baselineSnapshots.find(s => s.activity_id === act.id)
          if (snap && snap.baseline_finish && act.ef) {
            const diffMs = new Date(act.ef).getTime() - new Date(snap.baseline_finish).getTime()
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
            if (diffDays > slippageDays) {
              slippageDays = diffDays
            }
          }
        })
      } else {
        // Fallback: use absolute of most negative float
        criticalActivities.forEach(act => {
          const float = act.total_float !== null ? Number(act.total_float) : 0
          if (float < 0 && Math.abs(float) > slippageDays) {
            slippageDays = Math.abs(float)
          }
        })
      }

      const criticalPathStatus = slippageDays > 0 ? 'At Risk' : 'On Track'
      setScheduleHealth({
        overallPercentComplete,
        criticalPathStatus,
        slippageDays,
        milestoneHit,
        milestoneMissed,
        milestoneUpcoming
      })

      // 3. Fetch latest EVM snapshot
      const { data: snapshots, error: evmErr } = await supabase
        .from('evm_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .is('wbs_element_id', null)
        .order('snapshot_date', { ascending: false })
        .limit(1)

      let costMetrics: CostHealth

      if (!evmErr && snapshots && snapshots.length > 0) {
        const snap = snapshots[0]
        costMetrics = {
          cpi: snap.cpi !== null ? Number(snap.cpi) : null,
          spi: snap.spi !== null ? Number(snap.spi) : null,
          eac: Number(snap.eac) || 0,
          vac: Number(snap.vac) || 0,
          pv: Number(snap.pv) || 0,
          ev: Number(snap.ev) || 0,
          ac: Number(snap.ac) || 0,
          bac: (Number(snap.eac) || 0) + (Number(snap.vac) || 0) // BAC = EAC + VAC
        }
      } else {
        // Fallback: compute live cost values from accounts and actual costs
        const [accountsRes, actualsRes] = await Promise.all([
          supabase.from('cost_accounts').select('budgeted_total').eq('project_id', projectId),
          supabase.from('actual_costs').select('amount').in('wbs_element_id', activities.map(a => a.wbs_element_id).filter(Boolean))
        ])

        const bac = (accountsRes.data || []).reduce((sum, a) => sum + (Number(a.budgeted_total) || 0), 0)
        const ac = (actualsRes.data || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
        const ev = bac * (overallPercentComplete / 100)
        const cpi = ac > 0 ? ev / ac : 1.0
        const spi = overallPercentComplete / 100 // raw approximation fallback
        const eac = cpi > 0 ? ac + (bac - ev) / cpi : bac
        const vac = bac - eac

        costMetrics = {
          cpi,
          spi,
          eac,
          vac,
          pv: 0,
          ev,
          ac,
          bac
        }
      }
      setCostHealth(costMetrics)

      // 4. Calculate RAG status
      const currentRag = calculateProjectRagStatus({
        cpi: costMetrics.cpi,
        spi: costMetrics.spi,
        criticalPathSlippageDays: slippageDays
      })
      setRagStatus(currentRag)

      // 5. Fetch Top 5 Risks
      const { data: risksData, error: riskErr } = await supabase
        .from('risks')
        .select('id, title, risk_score, probability, impact, status, response_strategy')
        .eq('project_id', projectId)
        .order('risk_score', { ascending: false })
        .limit(5)

      if (riskErr) throw riskErr
      setTopRisks(risksData || [])

    } catch (err) {
      console.error('Error loading project dashboard details:', err)
      const errMsg = err instanceof Error ? err.message : 'Failed to load project dashboard details'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchDashboardData])

  return {
    loading,
    error,
    project,
    scheduleHealth,
    costHealth,
    ragStatus,
    upcomingMilestones,
    topRisks,
    refresh: fetchDashboardData
  }
}
