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
import { getTerminology } from '@/utils/terminology'
import type { Release, Iteration, ReleaseScopeItem, ReleaseStatus } from '@/lib/releases/types'

interface ReleaseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  release: Release | null
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
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'scope' | 'criteria' | 'readiness' | 'deployment' | 'rollback'>('overview')
  const [gateOpen, setGateOpen] = useState(false)

  if (!isOpen || !release) return null

  const terms = getTerminology(methodology)

  const criteria = release.exitCriteria || []
  const metCount = criteria.filter(c => c.isMet).length
  const totalCriteria = criteria.length
  const completionPercent = totalCriteria > 0 ? Math.round((metCount / totalCriteria) * 100) : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] max-h-[750px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col border-b border-app-border bg-app-surface/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                <Rocket className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/25 uppercase tracking-wider shrink-0">
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
                  title="Edit release parameters and linked iterations"
                >
                  <Edit className="h-3.5 w-3.5 text-indigo-400" />
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

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 px-6 border-t border-app-border/60 text-sm font-bold bg-app-card/30">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>Architecture Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'metrics'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Health & Metrics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scope')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'scope'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Scope Derivation</span>
              <span className="px-2 py-0.5 rounded-full bg-app-surface text-xs font-extrabold text-app-fg">
                {scopeItems.filter(s => s.source !== 'excluded').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('criteria')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'criteria'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Flag className="h-4 w-4" />
              <span>Exit Criteria & Quality Gate</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                completionPercent === 100 && totalCriteria > 0
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-app-surface text-app-fg'
              }`}>
                {metCount}/{totalCriteria}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('readiness')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'readiness'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>{terms.readiness}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('deployment')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'deployment'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>{terms.deployment} Plan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rollback')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'rollback'
                  ? 'border-indigo-500 text-indigo-500 font-extrabold'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{terms.rollback} Plan</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-app-card/60">
          {activeTab === 'metrics' && (
            <ReleaseMetricsTab release={release} methodology={methodology || 'Agile'} />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Strategic Objective */}
              <div className="p-5 bg-app-surface/40 border border-app-border rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted">Strategic Objective & Scope Purpose</h4>
                <p className="text-sm font-medium text-app-fg leading-relaxed">
                  {release.objective || `No specific objective documented for this ${terms.release.toLowerCase()} architecture yet. Use the configure button to describe the key business goals.`}
                </p>
              </div>

              {/* Linked Iterations Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-400" />
                  Mapped Iterations (Sprints / Phases)
                </h4>
                {(release.iterations || []).length === 0 ? (
                  <div className="p-6 bg-app-surface/30 border border-app-border rounded-2xl text-center text-sm text-app-muted italic">
                    No iterations linked to this release. Configure this release to attach Agile sprints or Waterfall phases.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(release.iterations || []).map(iter => {
                      return (
                        <div key={iter.id} className="p-4 bg-app-card border border-app-border rounded-2xl shadow-sm hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <IterationBadge
                              methodology={methodology}
                              labelOverride={iter.labelOverride}
                              sequenceNumber={iter.sequenceNumber}
                            />
                          </div>
                          <h5 className="text-base font-bold text-app-fg truncate mb-1" title={iter.name}>
                            {iter.name}
                          </h5>
                          <div className="text-xs text-app-muted font-medium">
                            {new Date(iter.startDate).toLocaleDateString()} &rarr; {new Date(iter.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Governance Gate Snapshot */}
              <div className="p-5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-app-fg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <span>Readiness Governance Gate</span>
                  </h4>
                  <p className="text-xs text-app-muted font-medium mt-1">
                    {completionPercent === 100 && totalCriteria > 0
                      ? 'All required quality gates and testing criteria have been successfully verified.'
                      : `${totalCriteria - metCount} criteria remaining before delivery sign-off can be authorized.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('criteria')}
                  className="px-4 py-2 rounded-xl bg-app-surface hover:bg-app-card border border-app-border text-xs font-bold text-app-fg transition-all cursor-pointer shadow-sm shrink-0"
                >
                  Review Checklist &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab === 'scope' && (
            <ReleaseScopeSection
              releaseId={release.id}
              scopeItems={scopeItems}
              availableWorkItems={availableWorkItems}
              hasEditAccess={hasEditAccess}
              onAddManualScope={onAddManualScope}
              onDeleteManualScope={onDeleteManualScope}
            />
          )}

          {activeTab === 'criteria' && (
            <ReleaseExitCriteriaSection
              releaseId={release.id}
              criteria={criteria}
              hasEditAccess={hasEditAccess}
              onToggleCriterion={onToggleCriterion}
              onAddCriterion={onAddCriterion}
              onDeleteCriterion={onDeleteCriterion}
            />
          )}

          {activeTab === 'readiness' && (
            <ReleaseReadinessSection
              release={release}
              hasEditAccess={hasEditAccess}
              onToggleItem={onToggleReadinessItem}
              onAddItem={onAddReadinessItem}
              onDeleteItem={onDeleteReadinessItem}
              onLoadDefaults={onLoadDefaultReadinessItems}
            />
          )}

          {activeTab === 'deployment' && (
            <ReleaseDeploymentPlanSection
              release={release}
              methodology={methodology}
              hasEditAccess={hasEditAccess}
              onToggleStep={onToggleDeploymentStep}
              onAddStep={onAddDeploymentStep}
              onDeleteStep={onDeleteDeploymentStep}
            />
          )}

          {activeTab === 'rollback' && (
            <ReleaseRollbackPlanSection
              release={release}
              methodology={methodology}
              hasEditAccess={hasEditAccess}
              onToggleStep={onToggleRollbackStep}
              onAddStep={onAddRollbackStep}
              onDeleteStep={onDeleteRollbackStep}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-app-border bg-app-surface/50 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-app-muted font-bold">
            {totalCriteria > 0 && completionPercent < 100 ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Exit Criteria block promotion</span>
              </>
            ) : totalCriteria > 0 && completionPercent === 100 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">All Quality Gates cleared</span>
              </>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-app-card text-app-fg text-sm font-bold transition-all cursor-pointer"
            >
              Close Window
            </button>
            {hasEditAccess && release.status !== 'released' && release.status !== 'rolled_back' && release.status !== 'canceled' && (
              <button
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <Rocket className="h-4 w-4" />
                Promote {terms.release}
              </button>
            )}
          </div>
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
