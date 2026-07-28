'use client'

import React, { useState } from 'react'
import { SubPlanSummary } from '../hooks/useProjectManagementPlanData'
import { CheckCircle, AlertCircle, ExternalLink, FileText, Calendar, Copy, Check } from 'lucide-react'

interface SubPlanCardProps {
  plan: SubPlanSummary
  onNavigateToTab?: (tab: string) => void
}

export function SubPlanCard({ plan, onNavigateToTab }: SubPlanCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = window.location.href.split('#')[0] + `#${plan.tabTarget}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActionClick = () => {
    if (onNavigateToTab) {
      onNavigateToTab(plan.tabTarget)
    } else {
      // Dispatch custom navigation event or change hash
      window.location.hash = `#${plan.tabTarget}`
      const navEvent = new CustomEvent('document-tab-change', { detail: { tab: plan.tabTarget } })
      window.dispatchEvent(navEvent)
    }
  }

  return (
    <div className="group bg-white dark:bg-app-card border border-app-border hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md">
      <div>
        {/* Header and Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-app-muted block">
                {plan.category}
              </span>
              <h4 className="font-bold text-app-fg text-base leading-tight mt-0.5">{plan.title}</h4>
            </div>
          </div>

          {plan.isGenerated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex-shrink-0 shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5" /> Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex-shrink-0 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5" /> Draft / Not Generated
            </span>
          )}
        </div>

        <p className="text-xs text-app-muted leading-relaxed mb-4 font-sans">
          {plan.description}
        </p>

        {/* Highlight Metrics / Summarized references (No content duplication) */}
        <div className="bg-slate-50 dark:bg-app-surface border border-app-border rounded-xl p-3.5 space-y-2 mb-2 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-app-muted">Integrated Baseline Reference</p>
          {plan.keyHighlights.map((hl, idx) => (
            <p key={idx} className="text-xs text-app-fg font-medium truncate flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
              <span className="truncate">{hl}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Footer with Timestamp and Hover Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-app-border flex items-center justify-between text-xs">
        <span className="text-app-muted font-mono text-[11px] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-app-muted flex-shrink-0" />
          {plan.lastUpdated ? `Updated ${new Date(plan.lastUpdated).toLocaleDateString()}` : 'No saved revisions'}
        </span>

        {/* Interactive Action Buttons - Appear cleanly on hover with pointer cursor */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy deep link to sub-plan"
            className="p-1.5 text-app-muted hover:text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer shadow-2xs"
            style={{ cursor: 'pointer' }}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleActionClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <span>Open Sub-Plan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
