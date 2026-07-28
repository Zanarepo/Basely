'use client'

import React, { useState } from 'react'
import { Check, Plus, Trash2, ShieldAlert, CheckCircle2, Loader2, Award } from 'lucide-react'
import type { ReleaseExitCriterion } from '@/lib/releases/types'

interface ReleaseExitCriteriaSectionProps {
  releaseId: string
  criteria: ReleaseExitCriterion[]
  hasEditAccess: boolean
  onToggleCriterion: (id: string, releaseId: string, isMet: boolean) => Promise<any>
  onAddCriterion: (releaseId: string, criterionText: string) => Promise<any>
  onDeleteCriterion: (id: string, releaseId: string) => Promise<any>
}

export function ReleaseExitCriteriaSection({
  releaseId,
  criteria,
  hasEditAccess,
  onToggleCriterion,
  onAddCriterion,
  onDeleteCriterion,
}: ReleaseExitCriteriaSectionProps) {
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const metCount = criteria.filter(c => c.isMet).length
  const totalCount = criteria.length
  const completionPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 100

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return

    setAdding(true)
    const res = await onAddCriterion(releaseId, newText.trim())
    setAdding(false)
    if (res.ok) {
      setNewText('')
    }
  }

  const handleToggle = async (c: ReleaseExitCriterion) => {
    if (!hasEditAccess || togglingId === c.id) return
    setTogglingId(c.id)
    await onToggleCriterion(c.id, releaseId, !c.isMet)
    setTogglingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!hasEditAccess) return
    setTogglingId(id)
    await onDeleteCriterion(id, releaseId)
    setTogglingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 bg-app-card border border-app-border rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${completionPercent === 100 && totalCount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-app-fg">Exit Criteria & Readiness Gate</h4>
            <p className="text-xs text-app-muted font-medium mt-0.5">
              Strict governance checks required before this release can transition to production or delivery sign-off.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end shrink-0 min-w-[200px]">
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-extrabold mb-1.5 w-full">
            <span className="text-app-muted">Readiness Progress:</span>
            <span className={completionPercent === 100 && totalCount > 0 ? 'text-emerald-500 font-extrabold' : 'text-indigo-400'}>
              {metCount} / {totalCount} Met ({completionPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full md:w-56 bg-app-surface rounded-full overflow-hidden border border-app-border">
            <div
              className={`h-full transition-all duration-300 ${
                completionPercent === 100
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="border border-app-border rounded-xl overflow-hidden divide-y divide-app-border bg-app-card shadow-sm">
        {criteria.length === 0 ? (
          <div className="p-8 text-center text-sm text-app-muted/70 italic">
            No exit criteria documented yet. Add verification items below.
          </div>
        ) : (
          criteria.map(c => {
            return (
              <div
                key={c.id}
                onClick={() => handleToggle(c)}
                className={`group relative flex items-center justify-between p-4 transition-colors cursor-pointer select-none ${
                  c.isMet ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-app-surface/50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                      c.isMet
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'border-app-border/80 bg-app-surface group-hover:border-indigo-500'
                    }`}
                  >
                    {togglingId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-app-muted" />
                    ) : (
                      c.isMet && <Check className="h-3.5 w-3.5 stroke-[3]" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold text-app-fg transition-all truncate ${
                    c.isMet ? 'line-through text-app-muted' : ''
                  }`}>
                    {c.criterionText}
                  </span>
                </div>

                {hasEditAccess && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 ml-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={togglingId === c.id}
                      className="p-1.5 text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete criterion"
                    >
                      {togglingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add New Criterion Input */}
      {hasEditAccess && (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Add new quality gate or exit requirement (e.g. All critical CVEs remediated)..."
            className="flex-1 bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-semibold text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={adding || !newText.trim()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Add Criterion</span>
          </button>
        </form>
      )}
    </div>
  )
}
