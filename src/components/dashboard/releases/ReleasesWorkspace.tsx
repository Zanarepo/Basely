'use client'

import React, { useState } from 'react'
import { Rocket, Layers, Plus, Loader2, Award, Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { useReleases } from './hooks/useReleases'
import { IterationCard } from './components/IterationCard'
import { IterationModal } from './components/IterationModal'
import { ReleaseCard } from './components/ReleaseCard'
import { ReleaseModal } from './components/ReleaseModal'
import { ReleaseDetailModal } from './components/ReleaseDetailModal'
import { getTerminology } from '@/utils/terminology'
import type { Iteration, Release, ReleaseStatus } from '@/lib/releases/types'

interface ReleasesWorkspaceProps {
  projectId: string
  hasEditAccess: boolean
  methodology?: string | null
}

export function ReleasesWorkspace({
  projectId,
  hasEditAccess,
  methodology = 'Agile',
}: ReleasesWorkspaceProps) {
  const {
    loading,
    error,
    iterations,
    releases,
    scopeItemsMap,
    availableWorkItems,
    refetch: loadData,
    createIteration,
    updateIteration,
    deleteIteration,
    createRelease,
    updateRelease,
    deleteRelease,
    toggleExitCriterion,
    addExitCriterion,
    deleteExitCriterion,
    addManualScopeOverride,
    deleteManualScopeOverride,
    handleToggleReadinessItem,
    handleAddReadinessItem,
    handleDeleteReadinessItem,
    handleLoadDefaultReadinessItems,
    handleToggleDeploymentStep,
    handleAddDeploymentStep,
    handleDeleteDeploymentStep,
    handleToggleRollbackStep,
    handleAddRollbackStep,
    handleDeleteRollbackStep,
  } = useReleases(projectId)

  const [activeTab, setActiveTab] = useState<'releases' | 'iterations'>('releases')
  
  // Modals state
  const [iterationModalOpen, setIterationModalOpen] = useState(false)
  const [editingIteration, setEditingIteration] = useState<Iteration | null>(null)

  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState<Release | null>(null)

  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const terms = getTerminology(methodology)

  // Calculate high level KPI stats
  const totalReleases = releases.length
  const releasedCount = releases.filter(r => r.status === 'released').length
  const totalIterations = iterations.length
  
  // Calculate average exit criteria progress across all planned/in-progress releases
  const activeReleases = releases.filter(r => r.status === 'planned' || r.status === 'in_progress')
  const avgReadiness = activeReleases.length > 0 ? Math.round(
    activeReleases.reduce((acc, r) => {
      const criteria = r.exitCriteria || []
      if (criteria.length === 0) return acc + 100
      return acc + (criteria.filter(c => c.isMet).length / criteria.length) * 100
    }, 0) / activeReleases.length
  ) : 100

  // Handler helpers
  const handleOpenNewIteration = () => {
    setEditingIteration(null)
    setIterationModalOpen(true)
  }

  const handleOpenEditIteration = (iter: Iteration) => {
    setEditingIteration(iter)
    setIterationModalOpen(true)
  }

  const handleDeleteIteration = async (id: string) => {
    if (confirm(`Are you sure you want to delete this ${terms.iteration.toLowerCase()}? Work item tags will be automatically unlinked.`)) {
      await deleteIteration(id)
    }
  }

  const handleSaveIteration = async (name: string, sequenceNumber: number, startDate: string, endDate: string, labelOverride?: 'sprint' | 'phase' | null) => {
    if (editingIteration) {
      return await updateIteration(editingIteration.id, name, sequenceNumber, startDate, endDate, labelOverride)
    } else {
      return await createIteration(name, sequenceNumber, startDate, endDate, labelOverride)
    }
  }

  const handleOpenNewRelease = () => {
    setEditingRelease(null)
    setReleaseModalOpen(true)
  }

  const handleOpenEditRelease = (release: Release, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingRelease(release)
    setReleaseModalOpen(true)
  }

  const handleDeleteRelease = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (confirm(`Are you sure you want to delete this ${terms.releasePlan.toLowerCase()}? This action will remove all exit criteria and manual scope overrides.`)) {
      if (selectedRelease?.id === id) setDetailModalOpen(false)
      await deleteRelease(id)
    }
  }

  const handleSaveRelease = async (name: string, objective: string | null, sequenceNumber: number, status: ReleaseStatus, iterationIds: string[], exitCriteriaTexts: string[]) => {
    if (editingRelease) {
      return await updateRelease(editingRelease.id, name, objective, sequenceNumber, status, iterationIds)
    } else {
      return await createRelease(name, objective, sequenceNumber, status, iterationIds, exitCriteriaTexts)
    }
  }

  const handleSelectRelease = (release: Release) => {
    setSelectedRelease(release)
    setDetailModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-app-muted">Loading release architecture & schedule windows...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Methodology Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-black text-app-fg tracking-tight">{terms.releasePlan} & {terms.iterations}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider ml-2">
              {methodology || 'Agile'} Unified Engine
            </span>
          </div>
          <p className="text-sm text-app-muted font-medium max-w-3xl">
            Unify WBS engineering and scheduling milestones into structured deliverable horizons. Seamlessly map Agile Sprints or Waterfall Phases without schema division or data replication.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            className="p-2.5 rounded-xl border border-app-border bg-app-surface/60 text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            title={`Refresh ${terms.release} Architecture Data`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {hasEditAccess && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNewIteration}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-app-card text-app-fg font-extrabold text-xs transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4 text-indigo-400" />
                <span>Add {terms.iteration}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewRelease}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>New {terms.releasePlan}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* High Level KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-app-card border border-app-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-1">{terms.release} Architectures</span>
            <div className="text-2xl font-black text-app-fg">
              {totalReleases} <span className="text-xs font-extrabold text-emerald-500 font-normal ml-1.5">({releasedCount} Shipped)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Rocket className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 bg-app-card border border-app-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-1">Schedule Windows</span>
            <div className="text-2xl font-black text-app-fg">
              {totalIterations} <span className="text-xs font-semibold text-app-muted ml-1">({terms.iterations})</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 bg-app-card border border-app-border rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-1">Active Readiness Gate Avg</span>
            <div className="text-2xl font-black text-emerald-500">
              {avgReadiness}% <span className="text-xs font-semibold text-app-muted ml-1">(Exit Criteria)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-4 border-b border-app-border">
        <button
          type="button"
          onClick={() => setActiveTab('releases')}
          className={`py-3 px-2 font-extrabold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'releases'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-app-muted hover:text-app-fg'
          }`}
        >
          <Rocket className="h-4 w-4" />
          <span>{terms.releases} ({totalReleases})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('iterations')}
          className={`py-3 px-2 font-extrabold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'iterations'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-app-muted hover:text-app-fg'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{terms.iterations} & Schedule Windows ({totalIterations})</span>
        </button>
      </div>

      {/* Main Content Grid */}
      {activeTab === 'releases' && (
        <div>
          {releases.length === 0 ? (
            <div className="p-16 bg-app-card/60 border border-app-border rounded-2xl text-center space-y-4">
              <Rocket className="h-12 w-12 text-indigo-500/50 mx-auto" />
              <div>
                <h3 className="text-base font-extrabold text-app-fg">No {terms.releases} Configured</h3>
                <p className="text-xs text-app-muted font-medium max-w-md mx-auto mt-1">
                  Create your first {terms.release.toLowerCase()} architecture to link engineering {terms.iterations.toLowerCase()}, automate scope rollup from your WBS repository, and monitor governance exit criteria.
                </p>
              </div>
              {hasEditAccess && (
                <button
                  type="button"
                  onClick={handleOpenNewRelease}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create {terms.releasePlan}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {releases.map(release => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  methodology={methodology}
                  hasEditAccess={hasEditAccess}
                  onSelect={handleSelectRelease}
                  onEdit={handleOpenEditRelease}
                  onDelete={handleDeleteRelease}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'iterations' && (
        <div>
          {iterations.length === 0 ? (
            <div className="p-16 bg-app-card/60 border border-app-border rounded-2xl text-center space-y-4">
              <Layers className="h-12 w-12 text-teal-500/50 mx-auto" />
              <div>
                <h3 className="text-base font-extrabold text-app-fg">No {terms.iterations} Established Yet</h3>
                <p className="text-xs text-app-muted font-medium max-w-md mx-auto mt-1">
                  Create timebox schedule windows ({terms.iterations.toLowerCase()}) to categorize your Work Breakdown Structure elements and CPM schedule activities.
                </p>
              </div>
              {hasEditAccess && (
                <button
                  type="button"
                  onClick={handleOpenNewIteration}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Establish First {terms.iteration}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {iterations.map(iter => (
                <IterationCard
                  key={iter.id}
                  iteration={iter}
                  methodology={methodology}
                  hasEditAccess={hasEditAccess}
                  onEdit={handleOpenEditIteration}
                  onDelete={handleDeleteIteration}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popup Modals (Zero full page reloads) */}
      <IterationModal
        isOpen={iterationModalOpen}
        onClose={() => setIterationModalOpen(false)}
        onSave={handleSaveIteration}
        iterationToEdit={editingIteration}
        projectMethodology={methodology}
        nextSequenceNumber={iterations.length > 0 ? Math.max(...iterations.map(i => i.sequenceNumber)) + 1 : 1}
      />

      <ReleaseModal
        isOpen={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        onSave={handleSaveRelease}
        releaseToEdit={editingRelease}
        availableIterations={iterations}
        methodology={methodology}
        nextSequenceNumber={releases.length > 0 ? Math.max(...releases.map(r => r.sequenceNumber)) + 1 : 1}
      />

      <ReleaseDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        release={selectedRelease ? releases.find(r => r.id === selectedRelease.id) || selectedRelease : null}
        methodology={methodology}
        hasEditAccess={hasEditAccess}
        scopeItems={selectedRelease ? (scopeItemsMap[selectedRelease.id] || []) : []}
        availableWorkItems={availableWorkItems}
        onOpenEditModal={handleOpenEditRelease}
        onToggleCriterion={toggleExitCriterion}
        onAddCriterion={addExitCriterion}
        onDeleteCriterion={deleteExitCriterion}
        onAddManualScope={addManualScopeOverride}
        onDeleteManualScope={deleteManualScopeOverride}
        onToggleReadinessItem={handleToggleReadinessItem}
        onAddReadinessItem={handleAddReadinessItem}
        onDeleteReadinessItem={handleDeleteReadinessItem}
        onLoadDefaultReadinessItems={handleLoadDefaultReadinessItems}
        onToggleDeploymentStep={handleToggleDeploymentStep}
        onAddDeploymentStep={handleAddDeploymentStep}
        onDeleteDeploymentStep={handleDeleteDeploymentStep}
        onToggleRollbackStep={handleToggleRollbackStep}
        onAddRollbackStep={handleAddRollbackStep}
        onDeleteRollbackStep={handleDeleteRollbackStep}
        onRefresh={loadData}
      />
    </div>
  )
}
