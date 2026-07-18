'use client'

import { useState, useMemo } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import type { WbsCostData } from '@/lib/cost/types'
import { generateLinearTimePhasing } from '@/lib/cost/actions'

type Props = {
  projectId: string
  wbsCostData: WbsCostData[]
  projectCurrency: string
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function TimePhasingView({ projectId, wbsCostData, projectCurrency, hasEditAccess, onDataChange }: Props) {
  const [selectedWbsId, setSelectedWbsId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workPackages = wbsCostData.filter(w => w.isWorkPackage && w.costAccount)

  const selectedWp = useMemo(() => workPackages.find(w => w.wbsId === selectedWbsId), [workPackages, selectedWbsId])

  // Simple aggregation for S-Curve visualization (Cumulative Cost over Time)
  const chartData = useMemo(() => {
    if (!selectedWp || !selectedWp.timePhaseEntries.length) return []
    
    // Sort chronologically
    const sorted = [...selectedWp.timePhaseEntries].sort((a, b) => new Date(a.period_start_date).getTime() - new Date(b.period_start_date).getTime())
    
    let cumulative = 0
    return sorted.map(entry => {
      cumulative += entry.planned_amount
      return {
        ...entry,
        cumulative
      }
    })
  }, [selectedWp])

  const handleGenerate = async () => {
    if (!selectedWp || !selectedWp.costAccount) return
    setIsGenerating(true)
    setError(null)
    try {
      // Hardcoded dates for demonstration (In reality, these would come from the Gantt/Schedule activities)
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]

      await generateLinearTimePhasing(
        selectedWp.costAccount.id,
        startDate,
        endDate,
        selectedWp.costAccount.budgeted_total
      )
      onDataChange()
    } catch (err: any) {
      setError(err.message || "Failed to generate time phasing")
    } finally {
      setIsGenerating(false)
    }
  }

  const maxCumulative = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 1

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
      {/* Left List: Estimated Work Packages */}
      <div className="w-full lg:w-1/3 bg-app-surface border border-app-border rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-app-border bg-app-muted-surface">
          <h3 className="font-bold text-app-fg">Estimated Packages</h3>
          <p className="text-xs text-app-muted mt-1">Select a package to view its time-phase</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {workPackages.length === 0 ? (
            <p className="text-center text-app-muted text-sm mt-8">No estimated work packages. Estimate costs first.</p>
          ) : (
            workPackages.map(wp => (
              <button
                key={wp.wbsId}
                onClick={() => setSelectedWbsId(wp.wbsId)}
                className={`w-full text-left p-3 mb-2 rounded-xl transition-all border ${
                  selectedWbsId === wp.wbsId
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'
                    : 'bg-app-surface border-transparent hover:bg-app-hover hover:border-app-border'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-app-fg">{wp.wbsCode} - {wp.wbsName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-app-muted">
                    {wp.timePhaseEntries.length} periods
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(wp.costAccount!.budgeted_total)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Detail: S-Curve & Distribution */}
      <div className="w-full lg:w-2/3 bg-app-surface border border-app-border rounded-3xl flex flex-col shadow-sm p-6 overflow-hidden">
        {!selectedWp ? (
          <div className="flex-1 flex flex-col items-center justify-center text-app-subtle">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a Work Package to view its Time-Phased distribution</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-app-fg">Time-Phasing (S-Curve)</h2>
                <p className="text-sm text-app-muted mt-1">Distribute budget over the duration of the work package</p>
              </div>
              {hasEditAccess && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Generate Linear Distribution
                </button>
              )}
            </div>

            {error && <div className="mb-4 text-sm text-red-500 font-semibold">{error}</div>}

            {chartData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-app-subtle border-2 border-dashed border-app-border rounded-xl">
                <p>No time-phase entries generated yet.</p>
                <p className="text-xs mt-2">Click "Generate Linear Distribution" to create them based on the activity schedule.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-6">
                {/* CSS Bar Chart for S-Curve approximation */}
                <div className="h-48 flex items-end gap-1 border-b border-l border-app-border pb-2 pl-2 relative">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-app-fg text-app-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {d.period_start_date}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(d.cumulative)}
                      </div>
                      
                      {/* Bar (Cumulative) */}
                      <div 
                        className="w-full bg-indigo-500/20 rounded-t-sm transition-all relative flex items-end"
                        style={{ height: `${(d.cumulative / maxCumulative) * 100}%` }}
                      >
                        {/* Inner Bar (Period amount) */}
                        <div 
                          className="w-full bg-indigo-500 rounded-t-sm"
                          style={{ height: `${(d.planned_amount / d.cumulative) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-app-muted mt-2 rotate-45 origin-left">
                        {new Date(d.period_start_date).toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-auto border border-app-border rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-app-muted-surface sticky top-0">
                      <tr>
                        <th className="p-3 font-semibold text-app-muted border-b border-app-border">Period Start</th>
                        <th className="p-3 font-semibold text-app-muted border-b border-app-border">Period End</th>
                        <th className="p-3 font-semibold text-app-muted border-b border-app-border text-right">Planned Amount</th>
                        <th className="p-3 font-semibold text-app-muted border-b border-app-border text-right">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((d, i) => (
                        <tr key={i} className="border-b border-app-border last:border-none hover:bg-app-hover">
                          <td className="p-3 text-app-fg">{d.period_start_date}</td>
                          <td className="p-3 text-app-fg">{d.period_end_date}</td>
                          <td className="p-3 text-app-fg text-right font-medium">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(d.planned_amount)}
                          </td>
                          <td className="p-3 text-indigo-600 dark:text-indigo-400 text-right font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(d.cumulative)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
