'use client'

import React from 'react'
import { ChevronRight, ChevronLeft, Rocket } from 'lucide-react'
import type { Release, ReleaseScopeItem } from '@/lib/releases/types'
import { 
  useSimplifiedReleasePipeline, 
  isStatusCompleted, 
  isStatusInProgress, 
  isStatusBlocked 
} from '../hooks/useSimplifiedReleasePipeline'

import { StepScopeEpics } from './pipeline-steps/StepScopeEpics'
import { StepQualityReadiness } from './pipeline-steps/StepQualityReadiness'
import { StepShipReleaseNotes } from './pipeline-steps/StepShipReleaseNotes'

interface SimplifiedReleasePipelineProps {
  release: Release
  projectId: string
  methodology?: string | null
  hasEditAccess: boolean
  scopeItems: ReleaseScopeItem[]
  availableWorkItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string }[]
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
  onDeleteManualScope: (id: string, releaseId: string) => Promise<any>
  onToggleCriterion: (id: string, releaseId: string, isMet: boolean) => Promise<any>
  onAddCriterion: (releaseId: string, criterionText: string) => Promise<any>
  onDeleteCriterion: (id: string, releaseId: string) => Promise<any>
  onToggleReadinessItem: (id: string, releaseId: string, isChecked: boolean) => Promise<any>
  onAddReadinessItem: (releaseId: string, category: string, itemText: string) => Promise<any>
  onDeleteReadinessItem: (id: string, releaseId: string) => Promise<any>
  onPromoteRelease: () => void
}

// Re-export helpers for backwards compatibility if needed elsewhere
export { isStatusCompleted, isStatusInProgress, isStatusBlocked }

export function SimplifiedReleasePipeline({
  release,
  projectId,
  methodology = 'Agile',
  hasEditAccess,
  scopeItems,
  onAddManualScope,
  onToggleCriterion,
  onAddCriterion,
  onDeleteCriterion,
  onToggleReadinessItem,
  onAddReadinessItem,
  onDeleteReadinessItem,
  onPromoteRelease,
}: SimplifiedReleasePipelineProps) {
  
  const {
    currentStep, setCurrentStep,
    newCriterion, setNewCriterion,
    newReadiness, setNewReadiness,
    addingCriterion,
    addingReadiness,
    generatingNotes,
    releaseNotes,
    copied,
    error,
    localExitCriteria,
    localReadinessItems,
    labels,
    activeScopeItems,
    completedScopeCount,
    inProgressScopeCount,
    notStartedScopeCount,
    scopeCompletionPercent,
    scopeByEpic,
    totalQualityChecks,
    completedQualityChecks,
    readinessPercent,
    isPublishEligible,
    handleToggleCriterionOptimistic,
    handleDeleteCriterionOptimistic,
    handleToggleReadinessOptimistic,
    handleDeleteReadinessOptimistic,
    handleAddExitCriterionSubmit,
    handleAddReadinessItemSubmit,
    handleGenerateNotes,
    handleCopyNotes
  } = useSimplifiedReleasePipeline({
    release,
    projectId,
    methodology,
    scopeItems,
    onToggleCriterion,
    onAddCriterion,
    onDeleteCriterion,
    onToggleReadinessItem,
    onAddReadinessItem,
    onDeleteReadinessItem
  })

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 3-STEP VISUAL PIPELINE HEADER */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 1
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                currentStep === 1
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              1
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold truncate">1. Scope & {labels.epicsTerm}</div>
              <div
                className={`text-[10px] truncate font-semibold ${
                  currentStep === 1 ? 'text-purple-100' : 'text-purple-600 dark:text-purple-300'
                }`}
              >
                {scopeCompletionPercent}% Done ({completedScopeCount}/{activeScopeItems.length})
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 2
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                currentStep === 2
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              2
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold truncate">2. Quality & Readiness</div>
              <div
                className={`text-[10px] truncate font-semibold ${
                  currentStep === 2 ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-300'
                }`}
              >
                {readinessPercent}% Quality Score
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 3
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                currentStep === 3
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              3
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold truncate">3. Ship & {labels.releaseNotesTerm}</div>
              <div className="text-[10px] opacity-80 truncate">
                {!isPublishEligible ? '🔒 Locked (<90%)' : 'Generate Notes & Launch'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* STEP BODY */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-[350px]">
        {currentStep === 1 && (
          <StepScopeEpics
            scopeCompletionPercent={scopeCompletionPercent}
            completedScopeCount={completedScopeCount}
            inProgressScopeCount={inProgressScopeCount}
            notStartedScopeCount={notStartedScopeCount}
            activeScopeItemsLength={activeScopeItems.length}
            labels={labels as any}
            scopeByEpic={scopeByEpic as any}
            hasEditAccess={hasEditAccess}
            releaseId={release.id}
            onAddManualScope={onAddManualScope}
          />
        )}

        {currentStep === 2 && (
          <StepQualityReadiness
            readinessPercent={readinessPercent}
            completedQualityChecks={completedQualityChecks}
            totalQualityChecks={totalQualityChecks}
            localExitCriteria={localExitCriteria}
            localReadinessItems={localReadinessItems}
            hasEditAccess={hasEditAccess}
            newCriterion={newCriterion}
            setNewCriterion={setNewCriterion}
            addingCriterion={addingCriterion}
            handleAddExitCriterionSubmit={handleAddExitCriterionSubmit}
            handleToggleCriterionOptimistic={handleToggleCriterionOptimistic}
            handleDeleteCriterionOptimistic={handleDeleteCriterionOptimistic}
            newReadiness={newReadiness}
            setNewReadiness={setNewReadiness}
            addingReadiness={addingReadiness}
            handleAddReadinessItemSubmit={handleAddReadinessItemSubmit}
            handleToggleReadinessOptimistic={handleToggleReadinessOptimistic}
            handleDeleteReadinessOptimistic={handleDeleteReadinessOptimistic}
          />
        )}

        {currentStep === 3 && (
          <StepShipReleaseNotes
            isPublishEligible={isPublishEligible}
            scopeCompletionPercent={scopeCompletionPercent}
            completedScopeCount={completedScopeCount}
            activeScopeItemsLength={activeScopeItems.length}
            labels={labels as any}
            generatingNotes={generatingNotes}
            handleGenerateNotes={handleGenerateNotes}
            error={error}
            releaseNotes={releaseNotes}
            handleCopyNotes={handleCopyNotes}
            copied={copied}
            releaseName={release.name}
            readinessPercent={readinessPercent}
            hasEditAccess={hasEditAccess}
            releaseStatus={release.status}
            onPromoteRelease={onPromoteRelease}
          />
        )}
      </div>

      {/* FOOTER STEPPER CONTROLS */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 bg-slate-50 dark:bg-slate-950/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as any)}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          Step {currentStep} of 3
        </div>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1) as any)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPromoteRelease}
            disabled={!isPublishEligible}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black transition-all ${
              !isPublishEligible
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer'
            }`}
          >
            {!isPublishEligible ? (
              <span>🔒 Locked (&lt;90% Done)</span>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Publish & Ship</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
