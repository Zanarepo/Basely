'use client'

import React from 'react'
import { CohortStats } from '@/lib/backoffice/analytics'

export function CohortRetentionWidget({ data }: { data: CohortStats[] }) {
  // Group by cohort_month
  const cohorts = Array.from(new Set(data.map(d => d.cohort_month)))
  const maxMonths = Math.max(...data.map(d => d.months_since_signup), 0)

  return (
    <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm col-span-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-app-fg uppercase tracking-wider">Cohort Retention Analysis</h3>
          <p className="text-xs text-app-muted mt-1">Percentage of organizations remaining active by signup month.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-app-border">
              <th className="py-2 px-3 font-bold text-app-muted min-w-[100px]">Cohort</th>
              <th className="py-2 px-3 font-bold text-app-muted">Orgs</th>
              {Array.from({ length: maxMonths + 1 }).map((_, i) => (
                <th key={i} className="py-2 px-3 font-bold text-app-muted text-center w-12">M{i}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/50">
            {cohorts.length === 0 && (
              <tr>
                <td colSpan={maxMonths + 3} className="py-8 text-center text-app-muted">No cohort data available yet. Cron job pending.</td>
              </tr>
            )}
            {cohorts.map(cohort => {
              const cohortRows = data.filter(d => d.cohort_month === cohort)
              const baseOrgs = cohortRows.find(d => d.months_since_signup === 0)?.total_orgs || cohortRows[0]?.total_orgs || 0
              
              return (
                <tr key={cohort} className="hover:bg-app-hover/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-app-fg">{cohort}</td>
                  <td className="py-2 px-3 text-app-muted">{baseOrgs}</td>
                  {Array.from({ length: maxMonths + 1 }).map((_, i) => {
                    const monthData = cohortRows.find(d => d.months_since_signup === i)
                    if (!monthData) return <td key={i} className="py-2 px-3 text-center text-app-muted/30">-</td>
                    
                    const rate = monthData.retention_rate
                    // Dynamic color based on rate
                    let bg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    if (rate < 80) bg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    if (rate < 60) bg = 'bg-red-500/10 text-red-600 dark:text-red-400'
                    if (rate === 100) bg = 'bg-emerald-500 text-white'

                    return (
                      <td key={i} className="py-1 px-1 text-center">
                        <div className={`py-1.5 px-1 rounded font-bold text-[10px] ${bg}`}>
                          {rate.toFixed(0)}%
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
