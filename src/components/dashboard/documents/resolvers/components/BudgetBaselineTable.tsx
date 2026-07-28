'use client'

import React, { useState } from 'react'
import { WorkPackageCostItem } from '../hooks/useBudgetBaselineData'
import { DollarSign, ShieldAlert, FileText, Copy, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface BudgetBaselineTableProps {
  workPackages: WorkPackageCostItem[]
  contingencyAmount: number
  totalProjectBudget: number
  latestBaseline?: { id: string; name: string; saved_at: string } | null
}

export function BudgetBaselineTable({
  workPackages,
  contingencyAmount,
  totalProjectBudget,
  latestBaseline
}: BudgetBaselineTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleCopy = (item: WorkPackageCostItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `WBS ${item.wbs_code}: ${item.name} - $${item.budget.toLocaleString()} (${item.estimation_method})`
    navigator.clipboard.writeText(text)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Total Baseline Budget</p>
            <p className="text-xl font-bold text-app-fg mt-1">${totalProjectBudget.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Contingency Reserve</p>
            <p className="text-xl font-bold text-app-fg mt-1">${contingencyAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 flex items-center gap-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">Active Baseline Stamp</p>
            <p className="text-sm font-semibold text-app-fg mt-1 truncate">
              {latestBaseline ? `${latestBaseline.name} (${new Date(latestBaseline.saved_at).toLocaleDateString()})` : 'Live Dynamic Baseline'}
            </p>
          </div>
        </div>
      </div>

      {workPackages.length === 0 ? (
        <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted shadow-sm">
          No budgeted work packages found for this project WBS structure.
        </div>
      ) : (
        <>
          {/* Desktop Responsive Table View (Hidden on mobile/tablet) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app-border text-xs uppercase tracking-wider text-app-muted bg-slate-50 dark:bg-app-surface">
                  <th className="py-3 px-4 font-semibold">WBS Code</th>
                  <th className="py-3 px-4 font-semibold">Work Package / Deliverable</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold text-right">Rate & Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Budget Total</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-sm text-app-fg">
                {workPackages.map(pkg => {
                  const isExpanded = expandedId === pkg.id
                  const hasPhases = (pkg.time_phases || []).length > 0

                  return (
                    <React.Fragment key={pkg.id}>
                      <tr className="group hover:bg-slate-50 dark:hover:bg-app-hover/50 transition-colors duration-150">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {pkg.wbs_code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-app-fg max-w-xs truncate">
                          {pkg.name}
                        </td>
                        <td className="py-3 px-4 text-xs text-app-muted capitalize whitespace-nowrap">
                          {pkg.estimation_method?.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-app-muted whitespace-nowrap">
                          {pkg.rate && pkg.quantity ? `$${pkg.rate} × ${pkg.quantity}` : 'Lump Sum'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                          ${pkg.budget.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {/* Action buttons appear only on row hover */}
                          <div className="inline-flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              type="button"
                              onClick={(e) => handleCopy(pkg, e)}
                              title="Copy package details"
                              className="p-1.5 text-app-muted hover:text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer"
                              style={{ cursor: 'pointer' }}
                            >
                              {copiedId === pkg.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>

                            {hasPhases && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(pkg.id)}
                                title={isExpanded ? 'Hide Time Phases' : 'View Time Phases'}
                                className="p-1.5 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-500/20 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold px-2.5"
                                style={{ cursor: 'pointer' }}
                              >
                                <span>Phases</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Time Phased S-Curve Breakdown */}
                      {isExpanded && hasPhases && (
                        <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-app-border">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-4 shadow-sm">
                              <p className="text-xs font-semibold uppercase tracking-wide text-app-muted mb-3">
                                Time-Phased Cost Distribution ({pkg.wbs_code})
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {(pkg.time_phases || []).map(tp => (
                                  <div key={tp.id} className="bg-slate-50 dark:bg-app-surface p-2.5 rounded-lg text-xs border border-app-border shadow-2xs">
                                    <p className="text-app-muted font-mono text-[11px] truncate">
                                      {new Date(tp.period_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                                      {new Date(tp.period_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-1 text-sm">${tp.planned_amount.toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Responsive Card Layout (Visible below md) */}
          <div className="md:hidden space-y-3">
            {workPackages.map(pkg => {
              const isExpanded = expandedId === pkg.id
              const hasPhases = (pkg.time_phases || []).length > 0

              return (
                <div key={pkg.id} className="group bg-white dark:bg-app-card border border-app-border rounded-xl p-4 transition-all hover:border-indigo-500/50 shadow-sm relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-1.5">
                        WBS {pkg.wbs_code}
                      </span>
                      <h4 className="font-semibold text-app-fg text-base">{pkg.name}</h4>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      ${pkg.budget.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-app-muted flex items-center justify-between">
                    <span>Method: <strong className="text-app-fg capitalize">{pkg.estimation_method?.replace('_', ' ')}</strong></span>
                    <span>{pkg.rate && pkg.quantity ? `Rate: $${pkg.rate} (Qty ${pkg.quantity})` : 'Lump Sum Package'}</span>
                  </div>

                  {/* Action buttons appear on hover in card view */}
                  <div className="mt-3 pt-3 border-t border-app-border flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(pkg, e)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer shadow-2xs"
                      style={{ cursor: 'pointer' }}
                    >
                      {copiedId === pkg.id ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>

                    {hasPhases && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(pkg.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-500/20 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{isExpanded ? 'Hide Phases' : 'Show Phases'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Mobile Expanded Phase Breakdown */}
                  {isExpanded && hasPhases && (
                    <div className="mt-3 bg-slate-50 dark:bg-app-surface border border-app-border rounded-xl p-3 shadow-2xs">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted mb-2">Time-Phased Distribution</p>
                      <div className="space-y-2">
                        {(pkg.time_phases || []).map(tp => (
                          <div key={tp.id} className="flex justify-between items-center bg-white dark:bg-app-card p-2.5 rounded-lg text-xs border border-app-border shadow-2xs">
                            <span className="text-app-muted font-mono text-[11px]">
                              {new Date(tp.period_start_date).toLocaleDateString()} — {new Date(tp.period_end_date).toLocaleDateString()}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">${tp.planned_amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
