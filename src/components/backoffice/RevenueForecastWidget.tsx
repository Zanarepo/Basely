'use client'

import React from 'react'
import { ForecastRange } from '@/lib/backoffice/analytics'

export function RevenueForecastWidget({ totalLTV, forecast, isSuperadmin, currencySymbol = '$' }: { totalLTV: number, forecast: ForecastRange, isSuperadmin: boolean, currencySymbol?: string }) {
  if (!isSuperadmin) return null // Hide entirely for non-superadmins, as LTV/Forecast is highly sensitive

  const { expectedMRR, bestCaseMRR, worstCaseMRR, assumptions } = forecast

  return (
    <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between col-span-full md:col-span-2">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-app-fg uppercase tracking-wider">Revenue Forecast</h3>
        <p className="text-xs text-app-muted mt-1">Projected MRR based on historical churn variance.</p>
      </div>

      <div className="space-y-6">
        {/* Actual LTV */}
        <div>
          <p className="text-xs font-bold text-app-muted uppercase mb-1">Actual Realized LTV</p>
          <p className="text-2xl font-black text-emerald-500">{currencySymbol}{totalLTV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-app-subtle mt-1">Sum of all successfully paid invoices</p>
        </div>

        <div className="h-px w-full bg-app-border/50"></div>

        {/* Forecast */}
        <div>
          <p className="text-xs font-bold text-app-muted uppercase mb-2">30-Day MRR Forecast</p>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
              <p className="text-[10px] font-bold text-red-500 uppercase">Worst Case</p>
              <p className="text-sm font-black text-app-fg">{currencySymbol}{worstCaseMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-app-subtle mt-1">{(assumptions.worstCaseChurnRate * 100).toFixed(1)}% Churn</p>
            </div>
            
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
              <p className="text-[10px] font-bold text-indigo-500 uppercase">Expected</p>
              <p className="text-base font-black text-app-fg">{currencySymbol}{expectedMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-app-subtle mt-1">{(assumptions.historicalChurnRate * 100).toFixed(1)}% Churn</p>
            </div>

            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Best Case</p>
              <p className="text-sm font-black text-app-fg">{currencySymbol}{bestCaseMRR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-app-subtle mt-1">{(assumptions.bestCaseChurnRate * 100).toFixed(1)}% Churn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
