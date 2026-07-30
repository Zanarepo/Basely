'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Rocket, Flag, Layers, Plus, Trash2 } from 'lucide-react'
import { IterationBadge } from './IterationBadge'
import type { Release, Iteration, ReleaseStatus } from '@/lib/releases/types'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    name: string,
    objective: string | null,
    sequenceNumber: number,
    status: ReleaseStatus,
    iterationIds: string[],
    exitCriteriaTexts: string[]
  ) => Promise<any>
  releaseToEdit?: Release | null
  availableIterations: Iteration[]
  methodology?: string | null
  nextSequenceNumber: number
}

export function ReleaseModal({
  isOpen,
  onClose,
  onSave,
  releaseToEdit,
  availableIterations,
  methodology,
  nextSequenceNumber,
}: ReleaseModalProps) {
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')
  const [sequenceNumber, setSequenceNumber] = useState(1)
  const [status, setStatus] = useState<ReleaseStatus>('planned')
  const [selectedIterationIds, setSelectedIterationIds] = useState<string[]>([])
  const [criteriaTexts, setCriteriaTexts] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (releaseToEdit) {
      setName(releaseToEdit.name)
      setObjective(releaseToEdit.objective || '')
      setSequenceNumber(releaseToEdit.sequenceNumber)
      setStatus(releaseToEdit.status)
      setSelectedIterationIds(releaseToEdit.iterationIds || [])
      setCriteriaTexts([]) // Editing criteria is managed in detail modal or existing preserve
    } else {
      setName(`Release ${nextSequenceNumber}.0.0`)
      setObjective('')
      setSequenceNumber(nextSequenceNumber)
      setStatus('planned')
      setSelectedIterationIds([])
      setCriteriaTexts(['All critical bugs resolved', 'QA smoke testing signed off', 'Staging deployment verified'])
    }
    setError(null)
  }, [releaseToEdit, nextSequenceNumber, isOpen])

  if (!isOpen) return null

  const handleToggleIteration = (id: string) => {
    setSelectedIterationIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleCriterionChange = (index: number, val: string) => {
    const next = [...criteriaTexts]
    next[index] = val
    setCriteriaTexts(next)
  }

  const handleAddCriterionInput = () => {
    setCriteriaTexts(prev => [...prev, ''])
  }

  const handleRemoveCriterionInput = (index: number) => {
    setCriteriaTexts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Release name is required.')
      return
    }

    setLoading(true)
    setError(null)

    const cleanCriteria = criteriaTexts.map(t => t.trim()).filter(Boolean)
    const res = await onSave(name, objective ? objective.trim() : null, sequenceNumber, status, selectedIterationIds, cleanCriteria)
    
    setLoading(false)
    if (res.ok) {
      onClose()
    } else {
      setError(res.error || 'Failed to save release plan.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-extrabold text-app-fg">
              {releaseToEdit ? 'Edit Release Plan Properties' : 'Create New Release Plan'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-app-muted uppercase tracking-wider block">
                Release Name / Version
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. v2.1.0 - Alpha Milestone"
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm font-bold text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted uppercase tracking-wider block">
                Status
              </label>
              <EnterpriseSelect
                value={status}
                onChange={(val) => setStatus(val as ReleaseStatus)}
                options={[
                  { value: 'planned', label: 'Planned', description: 'Future milestone release' },
                  { value: 'in_progress', label: 'In Progress', description: 'Currently active release cycle' },
                  { value: 'released', label: 'Released', description: 'Completed and shipped' },
                  { value: 'rolled_back', label: 'Rolled Back', description: 'Reverted due to issues' },
                  { value: 'canceled', label: 'Canceled', description: 'Aborted release milestone' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-app-muted uppercase tracking-wider block">
              Strategic Objective / Scope Summary
            </label>
            <textarea
              rows={2}
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="Describe the key business goals or technical capabilities delivered in this release..."
              className="w-full bg-app-bg border border-app-border rounded-xl p-3 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Link Iterations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-teal-400" />
                Map to Sprints / Phases ({selectedIterationIds.length} Selected)
              </label>
            </div>

            {availableIterations.length === 0 ? (
              <p className="text-xs text-app-muted/60 italic p-3 bg-app-surface/50 rounded-xl border border-app-border/40">
                No iterations defined in this project yet. You can create iterations and link them anytime.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-3 bg-app-surface/40 rounded-xl border border-app-border/60">
                {availableIterations.map(iter => {
                  const isChecked = selectedIterationIds.includes(iter.id)
                  return (
                    <div
                      key={iter.id}
                      onClick={() => handleToggleIteration(iter.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                          : 'bg-app-card border-app-border/80 text-app-muted hover:border-app-border hover:text-app-fg'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div click
                        className="rounded border-app-border bg-app-bg text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <IterationBadge
                            methodology={methodology}
                            labelOverride={iter.labelOverride}
                            sequenceNumber={iter.sequenceNumber}
                            size="sm"
                          />
                        </div>
                        <span className="text-xs font-semibold text-app-fg truncate mt-1">
                          {iter.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-app-muted">
              Mapping an iteration automatically rolls up its tagged WBS elements and activities directly into this release&apos;s Scope Architecture.
            </p>
          </div>

          {/* Initial Exit Criteria for New Releases */}
          {!releaseToEdit && (
            <div className="space-y-3 pt-2 border-t border-app-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Flag className="h-4 w-4 text-amber-500" />
                  Initial Exit Criteria Checklist
                </label>
                <button
                  type="button"
                  onClick={handleAddCriterionInput}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {criteriaTexts.map((txt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={txt}
                      onChange={e => handleCriterionChange(idx, e.target.value)}
                      placeholder={`Exit criterion #${idx + 1} (e.g. UAT testing signed off)`}
                      className="flex-1 bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs font-semibold text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {criteriaTexts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterionInput(idx)}
                        className="p-1.5 text-app-muted hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Remove criterion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-surface/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-app-border text-sm font-semibold text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {releaseToEdit ? 'Save Properties' : 'Create Release Architecture'}
          </button>
        </div>
      </div>
    </div>
  )
}
