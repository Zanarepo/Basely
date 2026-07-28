'use client'

import React, { useState } from 'react'
import { CheckSquare, Square, Trash2, Plus, GripVertical, CheckCircle2, RotateCcw, Loader2, ShieldAlert } from 'lucide-react'
import { getTerminology } from '@/utils/terminology'
import type { Release, ReleaseRollbackPlan } from '@/lib/releases/types'
import { formatDistanceToNow } from 'date-fns'

interface ReleaseRollbackPlanSectionProps {
  release: Release
  methodology?: string | null
  hasEditAccess: boolean
  onToggleStep: (id: string, releaseId: string, isCompleted: boolean) => Promise<any>
  onAddStep: (releaseId: string, stepText: string, sortOrder: number) => Promise<any>
  onDeleteStep: (id: string, releaseId: string) => Promise<any>
}

export function ReleaseRollbackPlanSection({
  release,
  methodology,
  hasEditAccess,
  onToggleStep,
  onAddStep,
  onDeleteStep
}: ReleaseRollbackPlanSectionProps) {
  const terms = getTerminology(methodology)
  const [loading, setLoading] = useState(false)
  const [newStepText, setNewStepText] = useState('')

  const plans = (release.rollbackPlans || []).sort((a, b) => a.sortOrder - b.sortOrder)
  const completedCount = plans.filter(p => p.isCompleted).length

  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  const handleToggle = async (step: ReleaseRollbackPlan) => {
    if (!hasEditAccess) return
    setTogglingItemId(step.id)
    await onToggleStep(step.id, release.id, !step.isCompleted)
    setTogglingItemId(null)
  }

  const handleDelete = async (id: string) => {
    if (!hasEditAccess) return
    setTogglingItemId(id)
    await onDeleteStep(id, release.id)
    setTogglingItemId(null)
  }

  const handleAdd = async () => {
    if (!newStepText.trim() || !hasEditAccess) return
    
    setLoading(true)
    await onAddStep(release.id, newStepText, plans.length)
    setNewStepText('')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-app-surface/50 border border-app-border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-app-fg">{terms.rollback} Protocol</h4>
            <p className="text-xs text-app-muted mt-0.5">Sequential steps to revert the {terms.deployment.toLowerCase()} in an emergency.</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-app-card border border-app-border rounded-full text-xs font-bold text-app-fg flex items-center gap-2">
          <span>{completedCount} / {plans.length} Steps</span>
        </div>
      </div>

      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-app-border rounded-xl bg-app-surface/30">
          <ShieldAlert className="h-10 w-10 text-app-muted mb-3" />
          <h3 className="text-sm font-bold text-app-fg">No {terms.rollback} Steps</h3>
          <p className="text-xs text-app-muted max-w-sm mt-1 mb-4">
            Document the sequence of actions to safely reverse the {terms.deployment.toLowerCase()} if critical issues occur in production.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {plans.map((step, index) => (
          <div 
            key={step.id} 
            className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
              step.isCompleted 
                ? 'bg-purple-500/5 border-purple-500/20' 
                : 'bg-app-card border-app-border hover:border-purple-500/30'
            }`}
          >
            <div className="mt-1 flex items-center gap-1.5 shrink-0">
              <span className="w-5 text-right text-xs font-bold text-app-muted">
                {index + 1}.
              </span>
              <div className="cursor-move text-app-border group-hover:text-app-muted transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(step)}
              disabled={togglingItemId === step.id || loading || !hasEditAccess}
              className="mt-0.5 shrink-0 text-app-muted hover:text-indigo-500 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {togglingItemId === step.id ? (
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              ) : step.isCompleted ? (
                <CheckSquare className="h-5 w-5 text-indigo-500" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium transition-all ${step.isCompleted ? 'text-app-muted' : 'text-app-fg'}`}>
                {step.stepText}
              </p>
              {step.isCompleted && step.completedAt && (
                <p className="text-[10px] text-purple-500/70 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Executed {formatDistanceToNow(new Date(step.completedAt), { addSuffix: true })}
                </p>
              )}
            </div>
            {hasEditAccess && (
              <button
                type="button"
                onClick={() => handleDelete(step.id)}
                disabled={togglingItemId === step.id || loading}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {togglingItemId === step.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}

        {hasEditAccess && (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Add new rollback step..."
              value={newStepText}
              onChange={e => setNewStepText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 px-4 py-2 text-sm bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newStepText.trim() || loading}
              className="px-4 py-2 bg-app-surface hover:bg-purple-500/10 text-app-muted hover:text-purple-500 border border-app-border hover:border-purple-500/30 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Step
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
