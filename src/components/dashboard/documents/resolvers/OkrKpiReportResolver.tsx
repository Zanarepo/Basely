'use client'

import React from 'react'
import { useOkrKpiReportData } from './hooks/useOkrKpiReportData'
import { Loader2, Target, TrendingUp, Compass, AlertTriangle, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react'

interface OkrKpiReportResolverProps {
  projectId: string
  organizationId: string
  source: string
}

export function OkrKpiReportResolver({ projectId, organizationId, source }: OkrKpiReportResolverProps) {
  const { data, loading, reload } = useOkrKpiReportData(projectId, organizationId)

  if (loading) {
    return (
      <div className="flex items-center py-6 px-4 text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-4 h-4 animate-spin mr-2.5 text-indigo-500" />
        <span>Resolving real-time quantitative North Star & OKR Performance telemetry...</span>
      </div>
    )
  }

  if (!data || (!data.northStar && data.growthLevers.length === 0 && data.objectives.length === 0)) {
    return (
      <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-500 my-4">
        <Compass className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
        <strong className="block text-sm text-slate-800 dark:text-slate-200 mb-1">No Quantitative Metrics Defined Yet</strong>
        Navigate to the North Star KPI Engine or OKR Performance Tree workspaces in the sidebar to register strategic outcomes and growth levers.
      </div>
    )
  }

  if (source === 'okrs.north_star_report') {
    return (
      <div className="space-y-6 my-4">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">PRIMARY NORTH STAR</span>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
              {data.northStar ? data.northStar.current_value : 'N/A'} <span className="text-xs text-slate-500 font-normal">/ {data.northStar?.target_value}</span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate block">{data.northStar?.name || 'Unset Metric'}</span>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-slate-900 dark:text-white shadow-xs">
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">SUPPORTING LEVERS</span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
              {data.growthLevers.length} Active Levers
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Acquisition, Activation & Retention Driver KPIs</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">TELEMETRY HEALTH</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  ACTIVE SYNC
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    reload()
                  }}
                  style={{ cursor: 'pointer' }}
                  className="p-1 text-slate-400 hover:text-indigo-500 rounded transition-colors ml-auto"
                  title="Refresh Live Metrics"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">Real-time binding to Product KPI Engine</span>
          </div>
        </div>

        {/* Detailed KPI Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              ⭐ North Star & Growth Lever Performance Roster
            </h4>
            <span className="text-xs text-slate-400 font-semibold">{data.growthLevers.length + (data.northStar ? 1 : 0)} Total KPIs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="p-3.5 pl-5">Metric Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Current Value</th>
                  <th className="p-3.5">Target Value</th>
                  <th className="p-3.5">Frequency</th>
                  <th className="p-3.5 pr-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {data.northStar && (
                  <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold">
                    <td className="p-3.5 pl-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <strong className="text-indigo-600 dark:text-indigo-400">{data.northStar.name}</strong>
                    </td>
                    <td className="p-3.5 text-[11px] font-extrabold text-indigo-500">⭐ North Star</td>
                    <td className="p-3.5 text-sm font-extrabold text-slate-900 dark:text-white">{data.northStar.current_value}</td>
                    <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400">{data.northStar.target_value}</td>
                    <td className="p-3.5 capitalize text-slate-500">{data.northStar.frequency}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {data.northStar.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                )}
                {data.growthLevers.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 font-bold">{k.name}</td>
                    <td className="p-3.5 capitalize text-slate-500 font-medium">{k.category} Lever</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{k.current_value}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{k.target_value}</td>
                    <td className="p-3.5 capitalize text-slate-500">{k.frequency}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {k.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Fallback or 'okrs.hierarchy_tree' view
  return (
    <div className="space-y-6 my-4">
      {/* Quarterly OKR Rollup Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">EXECUTIVE OKR ROLLUP</span>
          <h3 className="text-xl font-extrabold tracking-tight text-white mb-2">Quarterly Strategic Alignment & Execution</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{data.onTrackCount} On Track</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">{data.atRiskCount} At Risk</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">{data.behindCount} Behind</span>
          </div>
        </div>
        <div className="text-right shrink-0 bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
          <span className="text-[11px] text-slate-400 uppercase font-bold block mb-0.5">AVG ROLLUP PROGRESS</span>
          <span className="text-3xl font-extrabold text-indigo-400">{data.overallOkrProgress}%</span>
        </div>
      </div>

      {/* Objectives & KR Lists */}
      <div className="space-y-4">
        {data.objectives.map((obj) => {
          const krs = obj.key_results || []
          return (
            <div key={obj.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-wider">
                      OBJECTIVE
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{obj.timeframe} • Owner: {obj.owner || 'Unassigned'}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{obj.title}</h4>
                </div>
                <div className="text-right font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {obj.progress || 0}%
                </div>
              </div>
              
              {krs.length > 0 && (
                <div className="p-4 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">ATTACHED MEASURABLE KEY RESULTS</span>
                  <div className="space-y-2">
                    {krs.map((kr) => (
                      <div key={kr.id} className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">{kr.title}</span>
                          <span className="text-[11px] text-slate-500">Baseline: {kr.baseline_value} ➔ Target: <strong className="text-indigo-600 dark:text-indigo-400">{kr.target_value}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{kr.current_value} ({kr.progress || 0}%)</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {kr.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
