'use client'

import React, { useState, useMemo } from 'react'
import { CheckSquare, Square, Trash2, Plus, GripVertical, CheckCircle2, Loader2 } from 'lucide-react'
import { getTerminology } from '@/utils/terminology'
import type { Release, ReleaseDeploymentPlan } from '@/lib/releases/types'
import { formatDistanceToNow } from 'date-fns'

interface ReleaseDeploymentPlanSectionProps {
  release: Release
  methodology?: string | null
  hasEditAccess: boolean
  onToggleStep: (id: string, releaseId: string, isCompleted: boolean) => Promise<any>
  onAddStep: (releaseId: string, phase: 'Before' | 'During' | 'After', stepText: string, sortOrder: number) => Promise<any>
  onDeleteStep: (id: string, releaseId: string) => Promise<any>
}

export function ReleaseDeploymentPlanSection({
  release,
  methodology,
  hasEditAccess,
  onToggleStep,
  onAddStep,
  onDeleteStep
}: ReleaseDeploymentPlanSectionProps) {
  const terms = getTerminology(methodology)
  const [loading, setLoading] = useState(false)
  const [newStepTexts, setNewStepTexts] = useState<Record<string, string>>({
    'Before': '',
    'During': '',
    'After': ''
  })

  const plans = release.deploymentPlans || []
  
  const phases = ['Before', 'During', 'After'] as const

  const getPhasePlans = (phase: 'Before' | 'During' | 'After') => {
    return plans.filter(p => p.phase === phase).sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  const handleToggle = async (step: ReleaseDeploymentPlan) => {
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

  const handleAdd = async (phase: 'Before' | 'During' | 'After') => {
    const text = newStepTexts[phase]
    if (!text?.trim() || !hasEditAccess) return
    
    setLoading(true)
    const existingCount = getPhasePlans(phase).length
    await onAddStep(release.id, phase, text, existingCount)
    setNewStepTexts(prev => ({ ...prev, [phase]: '' }))
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {phases.map(phase => {
        const phasePlans = getPhasePlans(phase)
        const completedCount = phasePlans.filter(p => p.isCompleted).length

        return (
          <div key={phase} className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-app-muted flex items-center gap-2">
              Phase: {phase} {terms.deployment} 
              <span className="px-2 py-0.5 rounded-full bg-app-surface border border-app-border text-[10px]">
                {completedCount} / {phasePlans.length}
              </span>
            </h4>
            
            <div className="space-y-2">
              {phasePlans.map(step => (
                <div 
                  key={step.id} 
                  className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    step.isCompleted 
                      ? 'bg-indigo-500/5 border-indigo-500/20' 
                      : 'bg-app-card border-app-border hover:border-indigo-500/30'
                  }`}
                >
                  <div className="mt-1 cursor-move text-app-border group-hover:text-app-muted transition-colors">
                    <GripVertical className="h-4 w-4" />
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
                      <p className="text-[10px] text-indigo-500/70 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed {formatDistanceToNow(new Date(step.completedAt), { addSuffix: true })}
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
                    placeholder={`Add new step for ${phase.toLowerCase()} deployment...`}
                    value={newStepTexts[phase]}
                    onChange={e => setNewStepTexts(prev => ({ ...prev, [phase]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAdd(phase)}
                    className="flex-1 px-4 py-2 text-sm bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAdd(phase)}
                    disabled={!newStepTexts[phase]?.trim() || loading}
                    className="px-4 py-2 bg-app-surface hover:bg-indigo-500/10 text-app-muted hover:text-indigo-500 border border-app-border hover:border-indigo-500/30 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Step
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
