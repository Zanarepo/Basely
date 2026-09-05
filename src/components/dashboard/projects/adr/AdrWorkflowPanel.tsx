'use client'

/**
 * AdrWorkflowPanel — Slide-in workflow panel
 * Appears when user clicks "⚡ Activate Workflows" on an accepted ADR card.
 * Contains all 3 ADR integrations without needing to open the edit modal.
 */

import { useState } from 'react'
import { X, Zap, ShieldCheck, AlertTriangle, Users, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { AdrRaidExtractor } from './workflow/AdrRaidExtractor'
import { AdrSkillGapPanel } from './workflow/AdrSkillGapPanel'
import { useAdrWorkflow } from './hooks/useAdrWorkflow'
import type { ArchitectureDecisionRecord } from '@/lib/adr/actions'
import { getTerminology } from '@/utils/terminology'

interface AdrWorkflowPanelProps {
  adr: ArchitectureDecisionRecord
  projectId: string
  organizationId: string
  tier: string
  onClose: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  onRaidSuccess?: () => void
  methodology?: string
}

export function AdrWorkflowPanel({
  adr,
  projectId,
  organizationId,
  tier,
  onClose,
  onShowToast,
  onRaidSuccess,
  methodology,
}: AdrWorkflowPanelProps) {
  const [activeSection, setActiveSection] = useState<'raid' | 'skill' | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const terms = getTerminology(methodology)

  const adrWorkflow = useAdrWorkflow({
    projectId,
    organizationId,
    tier,
    onShowToast,
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full max-w-3xl' : 'w-full max-w-lg'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-app-fg text-base">Workflow Integrations</h3>
              <p className="text-xs text-app-muted mt-0.5 max-w-xs truncate">{adr.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(v => !v)}
              title={isExpanded ? 'Minimize panel' : 'Expand panel'}
              className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            >
              {isExpanded
                ? <Minimize2 className="w-4 h-4" />
                : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Intro Banner */}
        <div className="px-6 py-4 bg-violet-500/5 border-b border-app-border shrink-0">
          <p className="text-sm text-app-muted leading-relaxed">
            This ADR is <span className="font-bold text-emerald-500">Accepted</span>. Use these AI-powered workflows to propagate
            its impact across your project — no manual tracking required.
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Card 1: RAID Extraction ── */}
          <div className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'raid' ? null : 'raid')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-app-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-app-fg">Extract Risks to RAID</p>
                  <p className="text-xs text-app-muted mt-0.5">AI mines risks, assumptions & dependencies from this ADR</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Enterprise
                </span>
                <ChevronRight className={`w-4 h-4 text-app-muted transition-transform duration-200 ${activeSection === 'raid' ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {activeSection === 'raid' && (
              <div className="px-5 pb-5 border-t border-app-border bg-app-surface-solid/50">
                <AdrRaidExtractor
                  adrId={adr.id}
                  projectId={projectId}
                  organizationId={organizationId}
                  tier={tier}
                  onSuccess={onRaidSuccess}
                  onShowToast={onShowToast}
                />
              </div>
            )}
          </div>

          {/* ── Card 2: Skill Gap ── */}
          <div className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'skill' ? null : 'skill')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-app-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-app-fg">Check Team Skill Gaps</p>
                  <p className="text-xs text-app-muted mt-0.5">AI checks if your team has the skills this decision requires</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Premium
                </span>
                <ChevronRight className={`w-4 h-4 text-app-muted transition-transform duration-200 ${activeSection === 'skill' ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {activeSection === 'skill' && (
              <div className="px-5 pb-5 border-t border-app-border bg-app-surface-solid/50">
                <AdrSkillGapPanel
                  result={adrWorkflow.skillGapResult}
                  isLoading={adrWorkflow.isCheckingSkillGap}
                  error={adrWorkflow.skillGapError}
                  onRunCheck={() => adrWorkflow.runSkillGapCheck(adr.id)}
                  tier={tier}
                />
              </div>
            )}
          </div>

          {/* ── Card 3: WBS Compliance info ── */}
          <div className="rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-app-fg">{terms.wbsShortTab} Architecture Compliance</p>
                <p className="text-xs text-app-muted mt-0.5">Enforce this ADR at the task level</p>
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                Premium
              </span>
            </div>
            <p className="text-xs text-app-muted leading-relaxed">
              Open any <strong className="text-app-fg">{terms.wbsShortTab} {terms.workPackage}</strong> in the side panel and link this ADR to it.
              Then click <strong className="text-app-fg">Verify Architecture Compliance</strong> to check if the task's
              implementation approach violates this decision.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-app-border text-app-muted text-sm font-semibold hover:bg-app-hover hover:text-app-fg transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  )
}
