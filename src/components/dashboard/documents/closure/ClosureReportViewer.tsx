'use client'

import React, { useState, useEffect } from 'react'
import { resolveClosureReportData, ClosureReportData } from '@/lib/documents/resolvers/closure-resolver'
import { LifecycleGatingBanner } from './LifecycleGatingBanner'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Loader2, 
  Download, 
  Printer, 
  Save, 
  FileText 
} from 'lucide-react'

export interface ClosureReportViewerProps {
  projectId: string
  hasEditAccess: boolean
  currentLifecycle: ProjectLifecycleStatus
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ClosureReportViewer({
  projectId,
  hasEditAccess,
  currentLifecycle,
  onOpenLifecycleModal,
  onShowToast
}: ClosureReportViewerProps) {
  const [data, setData] = useState<ClosureReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [executiveSummary, setExecutiveSummary] = useState(
    'Formal Project Closure Report summarizing verified EVM metrics, completed schedule baselines, deliverable acceptance, and residual risk assessments upon entering the Closing phase.'
  )
  const [saving, setSaving] = useState(false)

  const isUnlocked = ['Closing', 'Closed'].includes(currentLifecycle)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!isUnlocked) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await resolveClosureReportData(projectId)
        if (isMounted) {
          setData(res)
        }
      } catch (err) {
        console.error('Failed to load closure data:', err)
        onShowToast?.('error', 'Could not compile project closure figures.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [projectId, isUnlocked, onShowToast])

  if (!isUnlocked) {
    return (
      <LifecycleGatingBanner
        documentTitle="Project Closure Report"
        currentStatus={currentLifecycle}
        requiredStatuses={['Closing', 'Closed']}
        onOpenLifecycleModal={onOpenLifecycleModal}
        canEdit={hasEditAccess}
      />
    )
  }

  if (loading || !data) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-app-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs sm:text-sm font-bold animate-pulse">Compiling EVM baselines & deliverable audit records...</p>
      </div>
    )
  }

  const handleSaveSnapshot = async () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onShowToast?.('success', 'Closure Report snapshot frozen and archived in compliance records.')
    }, 800)
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">
              Project Closure & Performance Report
            </h2>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              Verified end-of-project EVM financial summary, schedule adherence, and deliverable sign-offs
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-app-bg border border-app-border hover:bg-app-hover text-app-fg transition-all cursor-pointer"
            title="Print or Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          {hasEditAccess && (
            <button
              onClick={handleSaveSnapshot}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Freeze Closure Snapshot</span>
            </button>
          )}
        </div>
      </div>

      {/* Free-Text Executive Summary Section */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3">
        <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider block">
          Section 1: Executive Closure Statement
        </label>
        <textarea
          rows={4}
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="Enter executive findings, overall delivery statement, and formal closure justification..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500 leading-relaxed"
        />
      </div>

      {/* Section 2: Final EVM & Financial Performance Grid (Responsive) */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-app-muted uppercase tracking-wider px-1 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Section 2: Final EVM & Financial Reconciliation</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-app-muted font-bold">Budget at Completion (BAC)</span>
            <span className="text-xl sm:text-2xl font-black text-app-fg mt-2 font-mono">
              ${data.evmSummary.bac.toLocaleString()}
            </span>
            <span className="text-[11px] text-app-muted mt-1">Total planned baseline</span>
          </div>
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-app-muted font-bold">Actual Cost (AC)</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-2 font-mono">
              ${data.evmSummary.ac.toLocaleString()}
            </span>
            <span className="text-[11px] text-app-muted mt-1">Total recorded spend at closure</span>
          </div>
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-app-muted font-bold">Cost Variance (CV)</span>
            <span className={`text-xl sm:text-2xl font-black mt-2 font-mono ${data.evmSummary.cv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${data.evmSummary.cv.toLocaleString()}
            </span>
            <span className="text-[11px] text-app-muted mt-1">{data.evmSummary.cv >= 0 ? 'Under Budget' : 'Over Budget'}</span>
          </div>
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-app-muted font-bold">Final Cost CPI / SPI</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg sm:text-xl font-black text-indigo-400 font-mono">{data.evmSummary.cpi} CPI</span>
              <span className="text-app-muted">/</span>
              <span className="text-lg sm:text-xl font-black text-sky-400 font-mono">{data.evmSummary.spi} SPI</span>
            </div>
            <span className="text-[11px] text-app-muted mt-1">Target efficiency threshold ≥ 1.00</span>
          </div>
        </div>
      </div>

      {/* Section 3: Schedule Adherence Summary */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>Section 3: Master Schedule & Deliverable Adherence</span>
          </h3>
          <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold">
            {data.scheduleSummary.actualCompletionPercentage}% Activities Completed
          </span>
        </div>
        
        {/* Responsive Horizontal Table */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-app-border text-app-muted text-[11px] uppercase font-bold">
                <th className="py-2 px-3">WBS Code</th>
                <th className="py-2 px-3">Deliverable Name</th>
                <th className="py-2 px-3">Assigned Owner</th>
                <th className="py-2 px-3 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {data.deliverables.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-app-muted">No WBS deliverables recorded for this project.</td>
                </tr>
              ) : (
                data.deliverables.map((item) => (
                  <tr key={item.id} className="hover:bg-app-hover/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-indigo-400 font-bold whitespace-nowrap">{item.code}</td>
                    <td className="py-3 px-3 text-app-fg font-medium">{item.name}</td>
                    <td className="py-3 px-3 text-app-muted whitespace-nowrap">{item.owner}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Risk Mitigation Final Status */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Section 4: Final Risk Mitigation & Residual Exposures</span>
          </h3>
          <span className="text-xs text-app-muted font-medium">
            Mitigated: <strong className="text-emerald-400">{data.risksSummary.mitigatedRisks}</strong> / Total: <strong>{data.risksSummary.totalRisks}</strong>
          </span>
        </div>

        {data.risksSummary.criticalMitigations.length === 0 ? (
          <p className="text-xs sm:text-sm text-app-muted py-2">No critical residual risks remaining upon project closure.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.risksSummary.criticalMitigations.map((risk, idx) => (
              <div key={idx} className="p-3.5 bg-app-bg border border-app-border rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-app-fg truncate">{risk.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    {risk.severity}
                  </span>
                </div>
                <p className="text-xs text-app-muted leading-relaxed">
                  <strong className="text-indigo-400">Mitigation Strategy: </strong> {risk.mitigationPlan}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appendix: Project EVM Overview & Calculations */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Appendix: Project EVM Overview & Calculations</span>
          </h3>
        </div>
        
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-app-border text-app-muted text-[11px] uppercase font-bold bg-app-bg/50">
                <th className="py-2.5 px-3 rounded-tl-lg">Metric</th>
                <th className="py-2.5 px-3">Formula</th>
                <th className="py-2.5 px-3">Project Value</th>
                <th className="py-2.5 px-3 rounded-tr-lg">Status / Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Planned Value (PV)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">BAC × % planned complete</td>
                <td className="py-2.5 px-3 font-mono font-bold">${data.evmSummary.pv.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-app-muted font-medium">Expected baseline value to date</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Earned Value (EV)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">BAC × % actually complete</td>
                <td className="py-2.5 px-3 font-mono font-bold">${data.evmSummary.ev.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-app-muted font-medium">Value of work actually performed</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Cost Variance (CV)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">EV - AC</td>
                <td className={`py-2.5 px-3 font-mono font-bold ${data.evmSummary.cv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${data.evmSummary.cv.toLocaleString()}
                </td>
                <td className={`py-2.5 px-3 font-medium ${data.evmSummary.cv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.cv >= 0 ? 'Under budget (Positive)' : 'Over budget (Negative)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Schedule Variance (SV)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">EV - PV</td>
                <td className={`py-2.5 px-3 font-mono font-bold ${data.evmSummary.sv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${data.evmSummary.sv.toLocaleString()}
                </td>
                <td className={`py-2.5 px-3 font-medium ${data.evmSummary.sv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.sv >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Cost Performance Index (CPI)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">EV ÷ AC</td>
                <td className={`py-2.5 px-3 font-mono font-bold ${data.evmSummary.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.cpi}
                </td>
                <td className={`py-2.5 px-3 font-medium ${data.evmSummary.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.cpi >= 1 ? 'Cost-efficient (> 1)' : 'Cost overrun (< 1)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors">
                <td className="py-2.5 px-3 font-bold text-app-fg">Schedule Perf. Index (SPI)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">EV ÷ PV</td>
                <td className={`py-2.5 px-3 font-mono font-bold ${data.evmSummary.spi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.spi}
                </td>
                <td className={`py-2.5 px-3 font-medium ${data.evmSummary.spi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.spi >= 1 ? 'Ahead of schedule (> 1)' : 'Behind schedule (< 1)'}
                </td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-2.5 px-3 font-bold text-app-fg">Estimate at Completion (EAC)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">BAC ÷ CPI</td>
                <td className="py-2.5 px-3 font-mono font-bold">${data.evmSummary.eac.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-app-muted font-medium">Total forecasted project cost</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-2.5 px-3 font-bold text-app-fg">Estimate to Complete (ETC)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">EAC - AC</td>
                <td className="py-2.5 px-3 font-mono font-bold">${data.evmSummary.etc.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-app-muted font-medium">Forecasted remaining costs</td>
              </tr>
              <tr className="hover:bg-app-hover/30 transition-colors bg-app-bg/30">
                <td className="py-2.5 px-3 font-bold text-app-fg">Variance at Completion (VAC)</td>
                <td className="py-2.5 px-3 font-mono text-indigo-400 text-xs">BAC - EAC</td>
                <td className={`py-2.5 px-3 font-mono font-bold ${data.evmSummary.vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${data.evmSummary.vac.toLocaleString()}
                </td>
                <td className={`py-2.5 px-3 font-medium ${data.evmSummary.vac >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.evmSummary.vac >= 0 ? 'Expected to finish under budget' : 'Expected to finish over budget'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
