'use client'

import { AlertTriangle, ShieldCheck } from 'lucide-react'
import type { ProductStrategy } from '@/lib/product-strategy/types'

export function AiInsightsPanel({ strategy }: { strategy: ProductStrategy }) {
  if (!strategy.strategic_risks?.length && !strategy.execution_moats?.length) {
    return null
  }

  return (
    <>
      {strategy.strategic_risks && strategy.strategic_risks.length > 0 && (
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>AI-Identified Strategic Risks</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Automatically surfaced from recent project retrospectives and lessons learned.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategy.strategic_risks.map((risk, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{risk.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 flex-1">{risk.description}</p>
                <div className="mt-auto text-[11px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded border border-red-100 dark:border-red-800/30">
                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Mitigation Strategy:</span> 
                  {risk.mitigation_strategy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {strategy.execution_moats && strategy.execution_moats.length > 0 && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>AI-Identified Execution Moats</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Validated operational advantages mapped directly from successful delivery metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategy.execution_moats.map((moat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex flex-col">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{moat.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 flex-1">{moat.description}</p>
                <div className="mt-auto text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded border border-emerald-100 dark:border-emerald-800/30">
                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Strategic Impact:</span> 
                  {moat.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
