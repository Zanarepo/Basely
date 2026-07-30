'use client'

import { useEffect, useState, useCallback } from 'react'
import { getProductKpis, getOkrObjectives } from '@/lib/product-strategy/actions'
import type { ProductKpi, OkrObjective } from '@/lib/product-strategy/types'

export interface OkrKpiReportSummary {
  northStar: ProductKpi | undefined
  growthLevers: ProductKpi[]
  objectives: OkrObjective[]
  overallOkrProgress: number
  onTrackCount: number
  atRiskCount: number
  behindCount: number
  markdownTable: string
}

export function useOkrKpiReportData(projectId: string, organizationId: string) {
  const [data, setData] = useState<OkrKpiReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReportData = useCallback(async () => {
    setLoading(true)
    try {
      const [kpis, objectives] = await Promise.all([
        getProductKpis(organizationId, projectId),
        getOkrObjectives(organizationId, projectId)
      ])

      const northStar = kpis.find(k => k.category === 'north_star')
      const growthLevers = kpis.filter(k => k.id !== northStar?.id)

      let totalProg = 0
      let onTrackCount = 0
      let atRiskCount = 0
      let behindCount = 0

      objectives.forEach(obj => {
        totalProg += obj.progress || 0
        if (obj.status === 'on_track') onTrackCount++
        else if (obj.status === 'at_risk') atRiskCount++
        else if (obj.status === 'behind') behindCount++
      })

      const overallOkrProgress = objectives.length > 0 ? Math.round(totalProg / objectives.length) : 0

      // Generate clean markdown analytical table for document exports
      let mdTable = `### 🌟 Executive North Star & Growth Levers\n\n`
      mdTable += `| Metric Name | Category | Current Value | Target Objective | Frequency | Status |\n`
      mdTable += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`
      if (northStar) {
        mdTable += `| **${northStar.name}** | ⭐ North Star | **${northStar.current_value}** | ${northStar.target_value} | ${northStar.frequency} | ${northStar.status.toUpperCase()} |\n`
      }
      growthLevers.forEach(k => {
        mdTable += `| ${k.name} | ${k.category.toUpperCase()} | **${k.current_value}** | ${k.target_value} | ${k.frequency} | ${k.status.toUpperCase()} |\n`
      })

      mdTable += `\n### 🎯 Quarterly OKR Objectives & Key Results Hierarchy\n\n`
      objectives.forEach(obj => {
        mdTable += `#### Objective: **${obj.title}** (${obj.progress || 0}% Complete - ${obj.status.toUpperCase()})\n`
        mdTable += `- **Owner:** ${obj.owner || 'Unassigned'} | **Timeframe:** ${obj.timeframe}\n`
        if (obj.description) mdTable += `- *Strategic Intent:* ${obj.description}\n\n`
        
        const krs = obj.key_results || []
        if (krs.length > 0) {
          mdTable += `| Key Result Outcome | Baseline | Current | Target | Progress | Confidence |\n`
          mdTable += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`
          krs.forEach(kr => {
            mdTable += `| **${kr.title}** | ${kr.baseline_value} | ${kr.current_value} | ${kr.target_value} | **${kr.progress || 0}%** | ${kr.confidence_score}% |\n`
          })
          mdTable += `\n`
        } else {
          mdTable += `*No quantifiable Key Results attached to this Objective yet.*\n\n`
        }
      })

      setData({
        northStar,
        growthLevers,
        objectives,
        overallOkrProgress,
        onTrackCount,
        atRiskCount,
        behindCount,
        markdownTable: mdTable
      })
    } catch (error) {
      console.error('Error resolving OKR KPI report data:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, organizationId])

  useEffect(() => {
    if (organizationId) {
      loadReportData()
    }
  }, [organizationId, projectId, loadReportData])

  return { data, loading, reload: loadReportData }
}
