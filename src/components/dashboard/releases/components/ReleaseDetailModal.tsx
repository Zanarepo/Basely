'use client'

import React, { useState } from 'react'
import { Activity, X, Rocket, Layers, Flag, ShieldCheck, Edit, Calendar, CheckCircle2, RotateCcw, XCircle, AlertCircle, Clock, ExternalLink, CheckSquare } from 'lucide-react'
import { IterationBadge } from './IterationBadge'
import { ReleaseScopeSection } from './ReleaseScopeSection'
import { ReleaseExitCriteriaSection } from './ReleaseExitCriteriaSection'
import { ReleaseReadinessSection } from './ReleaseReadinessSection'
import { ReleaseDeploymentPlanSection } from './ReleaseDeploymentPlanSection'
import { ReleaseRollbackPlanSection } from './ReleaseRollbackPlanSection'
import { ReleasePromotionGate } from './ReleasePromotionGate'
import ReleaseMetricsTab from './metrics/ReleaseMetricsTab'
import { GtmRolloutPanel } from '@/components/dashboard/product/gtm/GtmRolloutPanel'
import { getTerminology } from '@/utils/terminology'
import { LessonsLearnedEditor } from '@/components/dashboard/documents/closure/LessonsLearnedEditor'
import type { Release, Iteration, ReleaseScopeItem, ReleaseStatus } from '@/lib/releases/types'

import { SimplifiedReleasePipeline } from './SimplifiedReleasePipeline'

interface ReleaseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  release: Release | null
  organizationId: string
  methodology?: string | null
  hasEditAccess: boolean
  scopeItems: ReleaseScopeItem[]
  availableWorkItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
  onOpenEditModal: (release: Release) => void
  onToggleCriterion: (id: string, releaseId: string, isMet: boolean) => Promise<any>
  onAddCriterion: (releaseId: string, criterionText: string) => Promise<any>
  onDeleteCriterion: (id: string, releaseId: string) => Promise<any>
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
  onDeleteManualScope: (id: string, releaseId: string) => Promise<any>
  onToggleReadinessItem: (id: string, releaseId: string, isChecked: boolean) => Promise<any>
  onAddReadinessItem: (releaseId: string, category: string, itemText: string) => Promise<any>
  onDeleteReadinessItem: (id: string, releaseId: string) => Promise<any>
  onLoadDefaultReadinessItems: (releaseId: string) => Promise<any>
  onToggleDeploymentStep: (id: string, releaseId: string, isCompleted: boolean) => Promise<any>
  onAddDeploymentStep: (releaseId: string, phase: 'Before' | 'During' | 'After', stepText: string, sortOrder: number) => Promise<any>
  onDeleteDeploymentStep: (id: string, releaseId: string) => Promise<any>
  onToggleRollbackStep: (id: string, releaseId: string, isCompleted: boolean) => Promise<any>
  onAddRollbackStep: (releaseId: string, stepText: string, sortOrder: number) => Promise<any>
  onDeleteRollbackStep: (id: string, releaseId: string) => Promise<any>
  onRefresh: () => void
}

const STATUS_ICONS: Record<ReleaseStatus, React.ReactNode> = {
  planned: <Clock className="h-4 w-4 text-blue-500" />,
  in_progress: <AlertCircle className="h-4 w-4 text-amber-500" />,
  released: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  rolled_back: <RotateCcw className="h-4 w-4 text-purple-500" />,
  canceled: <XCircle className="h-4 w-4 text-rose-500" />
}

export function ReleaseDetailModal({
  isOpen,
  onClose,
  release,
  organizationId,
  methodology,
  hasEditAccess,
  scopeItems,
  availableWorkItems,
  onOpenEditModal,
  onToggleCriterion,
  onAddCriterion,
  onDeleteCriterion,
  onAddManualScope,
  onDeleteManualScope,
  onToggleReadinessItem,
  onAddReadinessItem,
  onDeleteReadinessItem,
  onLoadDefaultReadinessItems,
  onToggleDeploymentStep,
  onAddDeploymentStep,
  onDeleteDeploymentStep,
  onToggleRollbackStep,
  onAddRollbackStep,
  onDeleteRollbackStep,
  onRefresh
}: ReleaseDetailModalProps) {
  const [activeView, setActiveView] = useState<'pipeline' | 'metrics' | 'gtm_rollouts' | 'retrospective'>('pipeline')
  const [gateOpen, setGateOpen] = useState(false)

  if (!isOpen || !release) return null

  const terms = getTerminology(methodology)

  const criteria = release.exitCriteria || []
  const metCount = criteria.filter(c => c.isMet).length
  const totalCriteria = criteria.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh] max-h-[800px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col border-b border-app-border bg-app-surface/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/25 uppercase tracking-wider shrink-0">
                    {terms.release} #{release.sequenceNumber}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-app-surface border border-app-border/80">
                    {STATUS_ICONS[release.status]}
                    <span className="ml-1 text-app-fg capitalize">{release.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <h2 className="text-xl font-black text-app-fg tracking-tight truncate mt-1" title={release.name}>
                  {release.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              {hasEditAccess && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenEditModal(release)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-app-border bg-app-card hover:bg-app-surface text-app-fg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Configure release"
                >
                  <Edit className="h-3.5 w-3.5 text-purple-400" />
                  <span>Configure {terms.release}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Simple Mode Toggle */}
          <div className="flex items-center justify-between px-6 py-2 border-t border-app-border/60 text-xs font-bold bg-app-surface/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('pipeline')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'pipeline'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                3-Step {terms.release} Pipeline
              </button>
              <button
                type="button"
                onClick={() => setActiveView('metrics')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'metrics'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                {terms.release} Metrics
              </button>
              <button
                type="button"
                onClick={() => setActiveView('gtm_rollouts')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'gtm_rollouts'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                {terms.gtmTerm}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('retrospective')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'retrospective'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                {terms.retroTerm}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-app-card/60 custom-scrollbar">
          {activeView === 'pipeline' && (
            <SimplifiedReleasePipeline
              release={release}
              projectId={release.projectId}
              methodology={methodology}
              hasEditAccess={hasEditAccess}
              scopeItems={scopeItems}
              availableWorkItems={availableWorkItems}
              onAddManualScope={onAddManualScope}
              onDeleteManualScope={onDeleteManualScope}
              onToggleCriterion={onToggleCriterion}
              onAddCriterion={onAddCriterion}
              onDeleteCriterion={onDeleteCriterion}
              onToggleReadinessItem={onToggleReadinessItem}
              onAddReadinessItem={onAddReadinessItem}
              onDeleteReadinessItem={onDeleteReadinessItem}
              onPromoteRelease={() => setGateOpen(true)}
            />
          )}

          {activeView === 'metrics' && (
            <ReleaseMetricsTab release={release} methodology={methodology || 'Agile'} />
          )}

          {activeView === 'gtm_rollouts' && (
            <GtmRolloutPanel releaseId={release.id} methodology={methodology} />
          )}

          {activeView === 'retrospective' && (
            <LessonsLearnedEditor
              projectId={release.projectId}
              organizationId={organizationId}
              hasEditAccess={hasEditAccess}
              currentLifecycle="Executing" // Bypass gating via releaseId
              releaseId={release.id}
              methodology={methodology}
            />
          )}
        </div>
      </div>

      <ReleasePromotionGate
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        releaseId={release.id}
        projectId={release.projectId}
        releaseName={release.name}
        currentStatus={release.status}
        unmetCriteriaCount={totalCriteria - metCount}
        onSuccess={() => {
          setGateOpen(false)
          onRefresh()
        }}
      />
    </div>
  )
}
