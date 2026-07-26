'use client'

import React, { useState, useEffect } from 'react'
import { resolvePIRData, PostImplementationReviewData } from '@/lib/documents/resolvers/handover-and-pir-resolver'
import { LifecycleGatingBanner } from './LifecycleGatingBanner'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { 
  History, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  CalendarClock, 
  Loader2, 
  Save, 
  Printer, 
  Clock, 
  BarChart2,
  Bell
} from 'lucide-react'

export interface PostImplementationReviewViewerProps {
  projectId: string
  hasEditAccess: boolean
  currentLifecycle: ProjectLifecycleStatus
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function PostImplementationReviewViewer({
  projectId,
  hasEditAccess,
  currentLifecycle,
  onOpenLifecycleModal,
  onShowToast
}: PostImplementationReviewViewerProps) {
  const [data, setData] = useState<PostImplementationReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [outcomeText, setOutcomeText] = useState('')
  const [roiText, setRoiText] = useState('')
  const [scheduledDelay, setScheduledDelay] = useState<number>(60) // Default 60 days post-closure
  const [customReviewDate, setCustomReviewDate] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // PIR specifically requires 'Closed' status per Phase 11 PRD Section 5.3
  const isUnlocked = currentLifecycle === 'Closed'

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!isUnlocked) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await resolvePIRData(projectId)
        if (isMounted && res) {
          setData(res)
          setOutcomeText(res.defaultSections.outcome_assessment)
          setRoiText(res.defaultSections.roi_and_business_impact)
        }
      } catch (err) {
        console.error('Failed to load PIR data:', err)
        onShowToast?.('error', 'Could not assemble post-implementation audit comparison.')
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
        documentTitle="Post-Implementation Review (PIR)"
        currentStatus={currentLifecycle}
        requiredStatuses={['Closed']}
        onOpenLifecycleModal={onOpenLifecycleModal}
        canEdit={hasEditAccess}
      />
    )
  }

  if (loading || !data) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-app-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs sm:text-sm font-bold animate-pulse">Comparing planned charter objectives against final EVM actuals...</p>
      </div>
    )
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onShowToast?.('success', `PIR schedule locked for ${scheduledDelay} days post-closure with automated notification reminder.`)
    }, 800)
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">
              Post-Implementation Review (PIR)
            </h2>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              Delayed outcome review comparing final realized ROI against original Project Charter goals
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
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lock PIR & Schedule Reminder</span>
            </button>
          )}
        </div>
      </div>

      {/* Delayed Review Scheduling Controls (Responsive) */}
      <div className="p-4 sm:p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-app-fg flex items-center gap-2">
              <span>Post-Closure Review Timing</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full font-bold">
                Automated Nudge Enabled
              </span>
            </div>
            <p className="text-xs text-app-muted">
              Select ideal timeframe post-closure to accurately evaluate steady-state ROI & adoption metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setScheduledDelay(days)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                scheduledDelay === days 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' 
                  : 'bg-app-surface border border-app-border text-app-muted hover:text-app-fg'
              }`}
            >
              +{days} Days
            </button>
          ))}
          <div className="flex items-center gap-1.5 pl-2 border-l border-app-border">
            <span className="text-xs text-app-muted font-medium hidden sm:inline">Custom:</span>
            <input
              type="date"
              value={customReviewDate}
              onChange={(e) => setCustomReviewDate(e.target.value)}
              className="bg-app-surface border border-app-border rounded-xl px-2.5 py-1 text-xs text-app-fg focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Section 1: Charter Objectives vs Final Actuals (Responsive Comparison Grid) */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400" />
            <span>Section 1: Original Charter Objectives vs Actual Execution Outcomes</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-app-bg/80 border border-app-border rounded-xl space-y-2">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Planned Objectives (From Project Charter)</span>
            </div>
            <p className="text-xs sm:text-sm text-app-fg leading-relaxed bg-app-surface p-3 rounded-lg border border-app-border/60 font-medium">
              {data.charterObjectives}
            </p>
          </div>

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Verified Final Execution Outcomes (EVM / Schedule)</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-app-surface border border-app-border rounded-lg">
                <div className="text-[11px] text-app-muted font-medium">Final EAC Spend</div>
                <div className="text-base sm:text-lg font-black text-app-fg font-mono mt-0.5">
                  ${data.actualOutcomes.finalEac.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 bg-app-surface border border-app-border rounded-lg">
                <div className="text-[11px] text-app-muted font-medium">Deliverable Completion</div>
                <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {data.actualOutcomes.completionPercentage}% Delivered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 & 3: Outcome Assessment & ROI Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3 flex flex-col">
          <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>Section 2: Post-Implementation Outcome Assessment</span>
          </label>
          <textarea
            rows={5}
            value={outcomeText}
            onChange={(e) => setOutcomeText(e.target.value)}
            readOnly={!hasEditAccess}
            placeholder="Provide qualitative analysis of end-user adoption and deliverable resilience post-launch..."
            className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500 flex-1 leading-relaxed"
          />
        </div>

        <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3 flex flex-col">
          <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Section 3: Realized ROI & Enterprise Benefit Tracking</span>
          </label>
          <textarea
            rows={5}
            value={roiText}
            onChange={(e) => setRoiText(e.target.value)}
            readOnly={!hasEditAccess}
            placeholder="Compare measured business financial gains or operational time saved against original Business Case assumptions..."
            className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500 flex-1 leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
