'use client'

import React from 'react'
import { useProjectManagementPlanData } from './hooks/useProjectManagementPlanData'
import { SubPlanCard } from './components/SubPlanCard'
import { Loader2, AlertTriangle, RefreshCw, Layers, CheckCircle2, FileText } from 'lucide-react'

interface ProjectManagementPlanResolverProps {
  projectId: string
  sectionKey: string
  periodEnd?: Date
  frozenData?: any
  onTabChange?: (tab: string) => void
}

export function ProjectManagementPlanResolver({
  projectId,
  periodEnd,
  frozenData,
  onTabChange
}: ProjectManagementPlanResolverProps) {
  const {
    subPlans,
    generatedCount,
    totalSubPlans,
    loading,
    error,
    refetch
  } = useProjectManagementPlanData(projectId, periodEnd, frozenData)

  const handleNavigate = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      const navEvent = new CustomEvent('document-tab-change', { detail: { tab } })
      window.dispatchEvent(navEvent)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-app-muted font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Aggregating master project management sub-plans...</span>
        </div>
      </div>
    )
  }

  if (error && subPlans.length === 0) {
    return (
      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-6 text-center text-rose-700 dark:text-rose-300 shadow-sm">
        <AlertTriangle className="w-6 h-6 mx-auto text-rose-500 mb-2" />
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-app-surface hover:bg-app-hover border border-app-border text-app-fg transition-colors cursor-pointer shadow-2xs"
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Master Plan Aggregation
        </button>
      </div>
    )
  }

  const completionPercent = Math.round((generatedCount / totalSubPlans) * 100)

  return (
    <div className="space-y-6">
      {/* Master Plan Governance Banner */}
      <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-app-fg">Master Project Management Plan Aggregator</h3>
            <p className="text-xs text-app-muted mt-1 max-w-xl">
              Central operational nexus referencing all nine subsidiary core plans without data duplication. Establishes the holistic project governance baseline.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-app-surface border border-app-border px-4 py-3 rounded-xl flex items-center gap-3.5 self-stretch sm:self-auto justify-between sm:justify-start shadow-2xs">
          <div className="text-right sm:text-left">
            <p className="text-[11px] font-bold uppercase text-app-muted tracking-wider">Plan Coverage</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{generatedCount} / {totalSubPlans} Published</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {completionPercent}%
          </div>
        </div>
      </div>

      {/* Responsive Grid of Integrated Sub-Plans - Max 2 items per row to prevent squeezing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subPlans.map(plan => (
          <SubPlanCard
            key={plan.type}
            plan={plan}
            onNavigateToTab={() => handleNavigate(plan.tabTarget)}
          />
        ))}
      </div>
    </div>
  )
}
