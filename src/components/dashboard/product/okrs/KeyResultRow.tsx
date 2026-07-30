'use client'

import React, { useState } from 'react'
import type { OkrKeyResult } from '@/lib/product-strategy/types'
import { updateOkrKeyResult, deleteOkrKeyResult } from '@/lib/product-strategy/actions'
import { Trash2, Edit3, Check, Loader2, Target, Sliders } from 'lucide-react'

interface KeyResultRowProps {
  keyResult: OkrKeyResult
  hasEditAccess: boolean
  onDeleted: (id: string, objectiveId: string) => void
  onUpdated: (kr: OkrKeyResult) => void
  onEdit: (kr: OkrKeyResult) => void
}

export function KeyResultRow({
  keyResult,
  hasEditAccess,
  onDeleted,
  onUpdated,
  onEdit
}: KeyResultRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)
  const [progressVal, setProgressVal] = useState(keyResult.progress || 0)
  const [currentVal, setCurrentVal] = useState(keyResult.current_value || '0')
  const [isQuickEditing, setIsQuickEditing] = useState(false)

  const statusBadges = {
    on_track: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    at_risk: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    behind: 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasEditAccess || isDeleting) return
    setIsDeleting(true)
    const { ok } = await deleteOkrKeyResult(keyResult.id)
    if (ok) {
      onDeleted(keyResult.id, keyResult.objective_id)
    } else {
      setIsDeleting(false)
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0
    setProgressVal(val)
    let newStatus: 'on_track' | 'at_risk' | 'behind' = 'on_track'
    if (val < 40) newStatus = 'behind'
    else if (val < 75) newStatus = 'at_risk'
    
    // Optimistic UI state update (<100ms)
    onUpdated({ ...keyResult, progress: val, status: newStatus })
  }

  const handleSaveProgress = async () => {
    setIsUpdatingProgress(true)
    let newStatus: 'on_track' | 'at_risk' | 'behind' = 'on_track'
    if (progressVal < 40) newStatus = 'behind'
    else if (progressVal < 75) newStatus = 'at_risk'

    const res = await updateOkrKeyResult(keyResult.id, {
      progress: progressVal,
      current_value: currentVal,
      status: newStatus
    })
    setIsUpdatingProgress(false)
    setIsQuickEditing(false)
    if (res.data) {
      onUpdated(res.data)
    }
  }

  return (
    <div className="group/kr relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/30 transition-all duration-200">
      {/* Title & Baseline/Target Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {keyResult.title}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusBadges[keyResult.status as keyof typeof statusBadges] || 'bg-slate-200 text-slate-700'}`}>
            {keyResult.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pl-4">
          <span>Baseline: <strong className="text-slate-700 dark:text-slate-300">{keyResult.baseline_value}</strong></span>
          <span>Target: <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{keyResult.target_value}</strong> {keyResult.unit !== 'numeric' ? `(${keyResult.unit})` : ''}</span>
          <span>Confidence: <strong className="text-purple-600 dark:text-purple-400 font-bold">{keyResult.confidence_score}%</strong></span>
        </div>
      </div>

      {/* Progress Bar & Interactive Slider */}
      <div className="w-full sm:w-64 flex items-center gap-3 shrink-0">
        {isQuickEditing && hasEditAccess ? (
          <div className="w-full space-y-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Val:</label>
              <input
                type="text"
                value={currentVal}
                onChange={(e) => setCurrentVal(e.target.value)}
                className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-500">
                <span>Progress: {progressVal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={handleSliderChange}
                style={{ cursor: 'pointer' }}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-1 pt-1">
              <button
                type="button"
                onClick={() => setIsQuickEditing(false)}
                style={{ cursor: 'pointer' }}
                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={isUpdatingProgress}
                style={{ cursor: 'pointer' }}
                className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-semibold inline-flex items-center"
              >
                {isUpdatingProgress ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                Sync
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{keyResult.current_value} / {keyResult.target_value}</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{keyResult.progress || 0}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${keyResult.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Hover-only actions */}
            {hasEditAccess && (
              <div className="flex items-center gap-1 opacity-0 group-hover/kr:opacity-100 focus-within:opacity-100 transition-opacity duration-200 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsQuickEditing(true)
                  }}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Quick update progress & value"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(keyResult)
                  }}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Key Result details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  title="Delete Key Result"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
