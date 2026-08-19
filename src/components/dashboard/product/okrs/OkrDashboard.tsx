'use client'

import React, { useState, useEffect } from 'react'
import type { OkrObjective, OkrKeyResult } from '@/lib/product-strategy/types'
import { getOkrObjectives } from '@/lib/product-strategy/actions'
import { OkrObjectiveCard } from './OkrObjectiveCard'
import { OkrBuilderModal } from './OkrBuilderModal'
import { Target, Plus, Loader2, RefreshCw, Layers } from 'lucide-react'
import { useGenerateOkrs } from './hooks/useGenerateOkrs'
import { GenerateOkrsButton } from './components/GenerateOkrsButton'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

interface OkrDashboardProps {
  organizationId: string
  projectId: string
  hasEditAccess?: boolean
}

export function OkrDashboard({
  organizationId,
  projectId,
  hasEditAccess = true
}: OkrDashboardProps) {
  const [objectives, setObjectives] = useState<OkrObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, message }])
  }

  const { isGenerating, handleGenerate } = useGenerateOkrs(
    organizationId,
    projectId,
    () => fetchOkrs(true),
    showToast
  )

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'objective' | 'key_result'>('objective')
  const [selectedObjective, setSelectedObjective] = useState<OkrObjective | null>(null)
  const [selectedKeyResult, setSelectedKeyResult] = useState<OkrKeyResult | null>(null)
  const [targetObjectiveIdForKr, setTargetObjectiveIdForKr] = useState<string>('')

  const fetchOkrs = async (isRef = false) => {
    if (isRef) setRefreshing(true)
    else setLoading(true)
    const data = await getOkrObjectives(organizationId, projectId)
    setObjectives(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (organizationId) {
      fetchOkrs()
    }
  }, [organizationId, projectId])

  const handleCreateObjective = (e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedObjective(null)
    setModalMode('objective')
    setIsModalOpen(true)
  }

  const handleEditObjective = (obj: OkrObjective) => {
    setSelectedObjective(obj)
    setModalMode('objective')
    setIsModalOpen(true)
  }

  const handleAddKeyResult = (objId: string) => {
    setSelectedKeyResult(null)
    setTargetObjectiveIdForKr(objId)
    setModalMode('key_result')
    setIsModalOpen(true)
  }

  const handleEditKeyResult = (kr: OkrKeyResult) => {
    setSelectedKeyResult(kr)
    setModalMode('key_result')
    setIsModalOpen(true)
  }

  // Optimistic event callbacks (<100ms UI reactivity)
  const handleDeletedObjective = (id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id))
  }

  const handleUpdatedObjective = (obj: OkrObjective) => {
    setObjectives(prev => prev.map(o => o.id === obj.id ? obj : o))
  }

  const handleSavedObjective = (savedObj: OkrObjective) => {
    setObjectives(prev => {
      const exists = prev.some(o => o.id === savedObj.id)
      if (exists) {
        return prev.map(o => o.id === savedObj.id ? { ...savedObj, key_results: o.key_results } : o)
      } else {
        return [savedObj, ...prev]
      }
    })
  }

  const handleDeletedKeyResult = (krId: string, objId: string) => {
    setObjectives(prev => prev.map(o => {
      if (o.id === objId) {
        const remaining = (o.key_results || []).filter(k => k.id !== krId)
        const avg = remaining.length > 0 ? Math.round(remaining.reduce((s, x) => s + (x.progress || 0), 0) / remaining.length) : 0
        return { ...o, key_results: remaining, progress: avg }
      }
      return o
    }))
  }

  const handleUpdatedKeyResult = (updatedKr: OkrKeyResult) => {
    setObjectives(prev => prev.map(o => {
      if (o.id === updatedKr.objective_id) {
        const krs = (o.key_results || []).map(k => k.id === updatedKr.id ? updatedKr : k)
        const avg = krs.length > 0 ? Math.round(krs.reduce((s, x) => s + (x.progress || 0), 0) / krs.length) : 0
        return { ...o, key_results: krs, progress: avg }
      }
      return o
    }))
  }

  const handleSavedKeyResult = (savedKr: OkrKeyResult) => {
    setObjectives(prev => prev.map(o => {
      if (o.id === savedKr.objective_id) {
        const krs = o.key_results || []
        const exists = krs.some(k => k.id === savedKr.id)
        const updatedKrs = exists ? krs.map(k => k.id === savedKr.id ? savedKr : k) : [...krs, savedKr]
        const avg = updatedKrs.length > 0 ? Math.round(updatedKrs.reduce((s, x) => s + (x.progress || 0), 0) / updatedKrs.length) : 0
        return { ...o, key_results: updatedKrs, progress: avg }
      }
      return o
    }))
  }

  return (
    <div className="space-y-8 pb-12">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Objectives & Key Results
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              fetchOkrs(true)
            }}
            disabled={refreshing || loading}
            style={{ cursor: 'pointer' }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-violet-500' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync'}
          </button>

          {hasEditAccess && (
            <>
              <GenerateOkrsButton
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                disabled={loading || refreshing}
              />
              <button
                type="button"
                onClick={handleCreateObjective}
                style={{ cursor: 'pointer' }}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Register Objective
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Tree */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading hierarchical Objectives and Key Results...
          </span>
        </div>
      ) : objectives.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto my-10 space-y-4">
          <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-500">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Strategic OKRs Established Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Create your quarterly objectives (e.g., Expand Mid-Market Presence) and append quantifiable key results with interactive sliders and target completion dates.
          </p>
          {hasEditAccess && (
            <button
              type="button"
              onClick={handleCreateObjective}
              style={{ cursor: 'pointer' }}
              className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register First Objective
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {objectives.map((obj) => (
            <OkrObjectiveCard
              key={obj.id}
              objective={obj}
              hasEditAccess={hasEditAccess}
              onEditObjective={handleEditObjective}
              onDeletedObjective={handleDeletedObjective}
              onAddKeyResult={handleAddKeyResult}
              onEditKeyResult={handleEditKeyResult}
              onDeletedKeyResult={handleDeletedKeyResult}
              onUpdatedKeyResult={handleUpdatedKeyResult}
              onUpdatedObjective={handleUpdatedObjective}
            />
          ))}
        </div>
      )}

      {/* OKR Builder Modal */}
      <OkrBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        organizationId={organizationId}
        projectId={projectId}
        targetObjectiveId={targetObjectiveIdForKr}
        existingObjective={selectedObjective}
        existingKeyResult={selectedKeyResult}
        onSavedObjective={handleSavedObjective}
        onSavedKeyResult={handleSavedKeyResult}
      />
    </div>
  )
}
