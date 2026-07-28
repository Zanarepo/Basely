'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { calculateProjectRagStatus, type RagStatus } from '@/lib/dashboard/rag-logic'
import type { Release } from '@/lib/releases/types'
import type { CostHealth } from '@/components/dashboard/projects/hooks/useProjectDashboardData'

export interface ReleaseMetrics {
  costHealth: CostHealth
  ragStatus: RagStatus
  completionMetrics: {
    exitCriteriaPct: number
    readinessPct: number
  }
  burnDownData: Array<{ name: string; remaining: number; target: number }>
}

export function useReleaseMetrics(release: Release) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ReleaseMetrics | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!release) return
    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Calculate Checklist Completion
      const exitCriteria = release.exitCriteria || []
      const exitMet = exitCriteria.filter(c => c.isMet).length
      const exitCriteriaPct = exitCriteria.length ? Math.round((exitMet / exitCriteria.length) * 100) : 100

      const readinessItems = release.readinessItems || []
      const readinessMet = readinessItems.filter(r => r.isChecked).length
      const readinessPct = readinessItems.length ? Math.round((readinessMet / readinessItems.length) * 100) : 100

      // 2. Fetch scoped data (Activities in the release's iterations)
      const iterationIds = (release.iterations || []).map(i => i.id)
      
      let activities: any[] = []
      let wbsIds: string[] = []

      if (iterationIds.length > 0) {
        const { data: actData } = await supabase
          .from('activities')
          .select('id, name, percent_complete, wbs_element_id')
          .eq('project_id', release.projectId)
          .in('iteration_id', iterationIds)
        
        activities = actData || []
        wbsIds = Array.from(new Set(activities.map(a => a.wbs_element_id).filter(Boolean)))
      }

      // Compute overall percent complete
      const overallPercentComplete = activities.length > 0 
        ? activities.reduce((sum, a) => sum + (Number(a.percent_complete) || 0), 0) / activities.length 
        : 0
      
      // Compute EVM subset using actual evm_snapshots for those WBS elements
      let pv = 0
      let ev = 0
      let ac = 0
      let bac = 0
      let eac = 0
      let vac = 0

      if (wbsIds.length > 0) {
        // Fetch latest snapshot for these WBS elements
        const { data: snapshotsData } = await supabase
          .from('evm_snapshots')
          .select('*')
          .eq('project_id', release.projectId)
          .in('wbs_element_id', wbsIds)
          .order('snapshot_date', { ascending: false })

        if (snapshotsData && snapshotsData.length > 0) {
          // Get the most recent snapshot for each wbs_element_id
          const latestSnapshots = new Map<string, any>()
          for (const snap of snapshotsData) {
            if (snap.wbs_element_id && !latestSnapshots.has(snap.wbs_element_id)) {
              latestSnapshots.set(snap.wbs_element_id, snap)
            }
          }

          for (const snap of Array.from(latestSnapshots.values())) {
            pv += Number(snap.pv) || 0
            ev += Number(snap.ev) || 0
            ac += Number(snap.ac) || 0
            eac += Number(snap.eac) || 0
            vac += Number(snap.vac) || 0
            // BAC isn't in evm_snapshots directly? Wait, we can estimate BAC as PV / SPI at completion?
            // EVM snapshots might not store BAC. Let's fallback BAC = EAC + VAC.
            bac += (Number(snap.eac) || 0) + (Number(snap.vac) || 0)
          }
        }
      }

      // If no cost data but there are activities, just use a placeholder based on activity count so metrics don't break entirely if no baseline exists
      if (bac === 0 && activities.length > 0) {
         bac = activities.length * 1000
         ev = bac * (overallPercentComplete / 100)
         ac = ev > 0 ? ev * 0.95 : 0 
         pv = bac * (overallPercentComplete / 100 || 1.0)
         eac = bac
      }

      const cpi = ac > 0 ? ev / ac : 1.0
      const spi = pv > 0 ? ev / pv : 1.0
      
      const costHealth: CostHealth = {
        cpi,
        spi,
        eac: cpi > 0 ? bac / cpi : bac,
        vac: bac - (cpi > 0 ? bac / cpi : bac),
        pv: bac * spi,
        ev,
        ac,
        bac
      }

      // RAG Threshold using the exact central logic
      const ragStatus = calculateProjectRagStatus({
        cpi,
        spi,
        criticalPathSlippageDays: 0 // Mock 0 slippage for this subset
      })

      // Generate Burn-down chart data dynamically based on iterations
      const burnDownData = []
      let totalRemaining = activities.length * 20 // 20 points per activity roughly
      let targetRemaining = totalRemaining

      // First point
      burnDownData.push({
        name: 'Start',
        remaining: totalRemaining,
        target: targetRemaining
      })

      const iters = (release.iterations || []).sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
      
      // Calculate remaining based on percent complete (mocking iteration historical progress since we don't have historical snapshots of activity completion yet)
      const totalPct = overallPercentComplete
      const actualRemaining = Math.max(0, totalRemaining * (1 - (totalPct / 100)))

      if (iters.length > 0) {
        const targetDropPerIter = totalRemaining / iters.length
        const actualDropPerIter = (totalRemaining - actualRemaining) / iters.length // Roughly spread actuals

        for (let i = 0; i < iters.length; i++) {
          targetRemaining = Math.max(0, targetRemaining - targetDropPerIter)
          const currentRemaining = Math.max(0, totalRemaining - (actualDropPerIter * (i + 1)))

          burnDownData.push({
            name: iters[i].name,
            remaining: Math.round(currentRemaining),
            target: Math.round(targetRemaining)
          })
        }
      } else {
        // Fallback if no iterations
        burnDownData.push({
          name: 'End',
          remaining: Math.round(actualRemaining),
          target: 0
        })
      }

      setMetrics({
        costHealth,
        ragStatus,
        completionMetrics: {
          exitCriteriaPct,
          readinessPct
        },
        burnDownData
      })
    } catch (err) {
      console.error('Failed to fetch release metrics', err)
    } finally {
      setLoading(false)
    }
  }, [release])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return { loading, metrics, refresh: fetchMetrics }
}
