'use client'

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import type { CostHealth } from '../hooks/useProjectDashboardData'

export default function CostHealthWidget({
  health,
  currency
}: {
  health: CostHealth
  currency: string
}) {
  const { cpi, spi, eac, vac, pv, ev, ac, bac } = health

  const formatIndex = (val: number | null) => {
    if (val === null) return '—'
    return val.toFixed(2)
  }

  const getStatusColor = (val: number | null) => {
    if (val === null) return 'text-app-muted'
    if (val >= 1.0) return 'text-emerald-500'
    if (val >= 0.9) return 'text-amber-500'
    return 'text-rose-500'
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-app-fg">Cost & EVM Health</h3>
          <DollarSign className="h-5 w-5 text-emerald-500" />
        </div>

        {/* CPI and SPI Mini Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              CPI
              {cpi !== null && cpi >= 1.0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
            </div>
            <div className={`text-xl font-extrabold ${getStatusColor(cpi)}`}>
              {formatIndex(cpi)}
            </div>
            <div className="text-[10px] text-app-muted mt-1">
              {cpi === null ? 'No actuals logged' : cpi >= 1.0 ? 'Under Budget' : 'Over Budget'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              SPI
              {spi !== null && spi >= 1.0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
            </div>
            <div className={`text-xl font-extrabold ${getStatusColor(spi)}`}>
              {formatIndex(spi)}
            </div>
            <div className="text-[10px] text-app-muted mt-1">
              {spi === null ? 'No timeline baseline' : spi >= 1.0 ? 'Ahead/On Schedule' : 'Behind Schedule'}
            </div>
          </div>
        </div>

        {/* Forecast Block */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-app-muted font-semibold">Budget at Completion (BAC):</span>
            <span className="font-extrabold text-app-fg">
              <CurrencyDisplay amount={bac} currency={currency} compactThreshold={10000} />
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-app-muted font-semibold">Estimate at Completion (EAC):</span>
            <span className="font-extrabold text-indigo-500">
              <CurrencyDisplay amount={eac} currency={currency} compactThreshold={10000} />
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-app-muted font-semibold">Variance at Completion (VAC):</span>
            <span className={`font-extrabold ${vac >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <CurrencyDisplay amount={vac} currency={currency} compactThreshold={10000} />
            </span>
          </div>
        </div>
      </div>

      {/* Primary EVM Triad: PV, EV, AC */}
      <div className="border-t border-app-border pt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Planned (PV)</div>
          <div className="font-bold text-app-fg mt-1">
            <CurrencyDisplay amount={pv} currency={currency} compactThreshold={1000} />
          </div>
        </div>
        <div className="border-l border-r border-app-border">
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Earned (EV)</div>
          <div className="font-bold text-indigo-500 mt-1">
            <CurrencyDisplay amount={ev} currency={currency} compactThreshold={1000} />
          </div>
        </div>
        <div>
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Actual (AC)</div>
          <div className="font-bold text-emerald-500 mt-1">
            <CurrencyDisplay amount={ac} currency={currency} compactThreshold={1000} />
          </div>
        </div>
      </div>
    </div>
  )
}
