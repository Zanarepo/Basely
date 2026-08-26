'use client'

import React from 'react'
import { useProjectDashboardData } from '@/components/dashboard/projects/hooks/useProjectDashboardData'
import CostHealthWidget from '@/components/dashboard/projects/widgets/CostHealthWidget'
import { Layers, Lock } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { FeatureGateScreen } from '@/components/dashboard/billing'

type Props = {
  projectId: string
  projectCurrency: string
  isPremium: boolean
  canUpgrade?: boolean
}

export default function CostDashboardView({ projectId, projectCurrency, isPremium, canUpgrade = false }: Props) {
  const { costHealth, loading, error } = useProjectDashboardData(projectId)

  if (!isPremium) {
    return (
      <div className="mt-8">
        <FeatureGateScreen
          featureName="Advanced Cost Analytics"
          description="Manage Earned Value Management (EVM) metrics, performance indices, and accurate forecasting based on real-time actuals and baselines. Available on the Premium plan."
          canUpgrade={canUpgrade}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-app-subtle">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error || !costHealth) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400">
        <p className="text-sm">Failed to load advanced cost metrics. Ensure you have established a baseline first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CostHealthWidget takes up space nicely. */}
        <div className="col-span-1 lg:col-span-2">
          <CostHealthWidget health={costHealth} currency={projectCurrency} />
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Detailed EVM Breakdown</span>
          </h3>
        </div>
        
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-app-border text-app-muted text-xs uppercase font-bold bg-app-bg/50">
                <th className="py-3 px-4 rounded-tl-xl">Metric</th>
                <th className="py-3 px-4">Formula</th>
                <th className="py-3 px-4">Project Value</th>
                <th className="py-3 px-4 rounded-tr-xl">Status / Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Planned Value (PV)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">BAC × % planned complete</td>
                <td className="py-3 px-4 font-mono font-bold">
                  <CurrencyDisplay amount={costHealth.pv} currency={projectCurrency} />
                </td>
                <td className="py-3 px-4 text-app-muted font-medium">Expected baseline value to date</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Earned Value (EV)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">BAC × % actually complete</td>
                <td className="py-3 px-4 font-mono font-bold">
                  <CurrencyDisplay amount={costHealth.ev} currency={projectCurrency} />
                </td>
                <td className="py-3 px-4 text-app-muted font-medium">Value of work actually performed</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Cost Variance (CV)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">EV - AC</td>
                <td className={`py-3 px-4 font-mono font-bold ${(costHealth.ev - costHealth.ac) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <CurrencyDisplay amount={costHealth.ev - costHealth.ac} currency={projectCurrency} />
                </td>
                <td className={`py-3 px-4 font-medium ${(costHealth.ev - costHealth.ac) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(costHealth.ev - costHealth.ac) >= 0 ? 'Under budget (Positive)' : 'Over budget (Negative)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Schedule Variance (SV)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">EV - PV</td>
                <td className={`py-3 px-4 font-mono font-bold ${(costHealth.ev - costHealth.pv) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <CurrencyDisplay amount={costHealth.ev - costHealth.pv} currency={projectCurrency} />
                </td>
                <td className={`py-3 px-4 font-medium ${(costHealth.ev - costHealth.pv) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(costHealth.ev - costHealth.pv) >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Cost Performance Index (CPI)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">EV ÷ AC</td>
                <td className={`py-3 px-4 font-mono font-bold ${costHealth.cpi !== null && costHealth.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {costHealth.cpi !== null ? costHealth.cpi.toFixed(2) : '—'}
                </td>
                <td className={`py-3 px-4 font-medium ${costHealth.cpi !== null && costHealth.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {costHealth.cpi === null ? 'No actuals logged' : costHealth.cpi >= 1 ? 'Cost-efficient (≥ 1)' : 'Cost overrun (< 1)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-3 px-4 font-bold text-app-fg">Schedule Perf. Index (SPI)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">EV ÷ PV</td>
                <td className={`py-3 px-4 font-mono font-bold ${costHealth.spi !== null && costHealth.spi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {costHealth.spi !== null ? costHealth.spi.toFixed(2) : '—'}
                </td>
                <td className={`py-3 px-4 font-medium ${costHealth.spi !== null && costHealth.spi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {costHealth.spi === null ? 'No baseline scheduled' : costHealth.spi >= 1 ? 'Ahead of schedule (≥ 1)' : 'Behind schedule (< 1)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-3 px-4 font-bold text-app-fg">Estimate at Completion (EAC)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">BAC ÷ CPI</td>
                <td className="py-3 px-4 font-mono font-bold">
                  <CurrencyDisplay amount={costHealth.eac} currency={projectCurrency} />
                </td>
                <td className="py-3 px-4 text-app-muted font-medium">Total forecasted project cost</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-3 px-4 font-bold text-app-fg">Estimate to Complete (ETC)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">EAC - AC</td>
                <td className="py-3 px-4 font-mono font-bold">
                  <CurrencyDisplay amount={costHealth.eac - costHealth.ac} currency={projectCurrency} />
                </td>
                <td className="py-3 px-4 text-app-muted font-medium">Forecasted remaining costs</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-3 px-4 font-bold text-app-fg">Variance at Completion (VAC)</td>
                <td className="py-3 px-4 font-mono text-violet-400 text-xs">BAC - EAC</td>
                <td className={`py-3 px-4 font-mono font-bold ${costHealth.vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <CurrencyDisplay amount={costHealth.vac} currency={projectCurrency} />
                </td>
                <td className={`py-3 px-4 font-medium ${costHealth.vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {costHealth.vac >= 0 ? 'Expected to finish under budget' : 'Expected to finish over budget'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
