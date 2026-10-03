'use client'

import React, { useState, useTransition } from 'react'
import { Sparkles, Zap, RotateCcw, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateOrgAiLimits } from '@/lib/backoffice/ai-limit-actions'

interface AiLimitOverridePanelProps {
  organizationId: string
  tierDefault: { generations: number; basicActions: number }
  currentOverrides: {
    generationsLimit: number | null
    basicActionsLimit: number | null
  }
}

export function AiLimitOverridePanel({
  organizationId,
  tierDefault,
  currentOverrides,
}: AiLimitOverridePanelProps) {
  const [generationsInput, setGenerationsInput] = useState(
    currentOverrides.generationsLimit != null ? String(currentOverrides.generationsLimit) : ''
  )
  const [basicActionsInput, setBasicActionsInput] = useState(
    currentOverrides.basicActionsLimit != null ? String(currentOverrides.basicActionsLimit) : ''
  )
  const [justification, setJustification] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (!justification.trim()) {
      setStatus('error')
      setStatusMsg('A justification note is required before saving.')
      return
    }
    setStatus('idle')

    const generationsLimit = generationsInput.trim() !== '' ? parseInt(generationsInput, 10) : null
    const basicActionsLimit = basicActionsInput.trim() !== '' ? parseInt(basicActionsInput, 10) : null

    if ((generationsInput.trim() !== '' && isNaN(generationsLimit!)) ||
        (basicActionsInput.trim() !== '' && isNaN(basicActionsLimit!))) {
      setStatus('error')
      setStatusMsg('Limits must be valid numbers.')
      return
    }

    startTransition(async () => {
      const result = await updateOrgAiLimits(organizationId, {
        generationsLimit,
        basicActionsLimit,
        justification,
      })
      if (result.success) {
        setStatus('success')
        setStatusMsg('AI limits updated and logged to the audit trail.')
        setJustification('')
      } else {
        setStatus('error')
        setStatusMsg(result.error || 'An unknown error occurred.')
      }
    })
  }

  const handleClearOverrides = () => {
    setGenerationsInput('')
    setBasicActionsInput('')
  }

  return (
    <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
      <h3 className="font-bold text-app-fg mb-1 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        AI Limit Overrides
      </h3>
      <p className="text-xs text-app-muted mb-4">
        Set custom monthly AI limits for this organization. Leave blank to use the tier default. Changes are logged to the audit trail.
      </p>

      {/* Tier Defaults Info */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 p-3 bg-app-surface rounded-xl border border-app-border text-center">
          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Tier Default</p>
          <p className="text-lg font-black text-app-fg">{tierDefault.generations}</p>
          <p className="text-[10px] text-app-muted">AI Generations</p>
        </div>
        <div className="flex-1 p-3 bg-app-surface rounded-xl border border-app-border text-center">
          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Tier Default</p>
          <p className="text-lg font-black text-app-fg">{tierDefault.basicActions}</p>
          <p className="text-[10px] text-app-muted">Basic Actions</p>
        </div>
      </div>

      {/* Override Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">
            <Zap className="w-3 h-3 inline mr-1 text-violet-500" />
            AI Generations Override / mo
          </label>
          <input
            type="number"
            min="0"
            placeholder={`Tier default: ${tierDefault.generations} (blank = use default)`}
            value={generationsInput}
            onChange={(e) => setGenerationsInput(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 inline mr-1 text-violet-500" />
            AI Basic Actions Override / mo
          </label>
          <input
            type="number"
            min="0"
            placeholder={`Tier default: ${tierDefault.basicActions} (blank = use default)`}
            value={basicActionsInput}
            onChange={(e) => setBasicActionsInput(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">
            Justification <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Enterprise trial extension, special arrangement..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {/* Status Feedback */}
      {status !== 'idle' && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs mb-4 ${
          status === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
        }`}>
          {status === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClearOverrides}
          title="Clear both overrides (reset to tier default)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-app-border hover:bg-app-hover text-app-muted transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            : <><Save className="w-3.5 h-3.5" /> Save Overrides</>
          }
        </button>
      </div>

      {/* Current state summary */}
      <div className="mt-4 pt-4 border-t border-app-border">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2">Current Active Limits</p>
        <div className="flex gap-2">
          <div className={`flex-1 px-3 py-2 rounded-lg text-center text-xs ${
            currentOverrides.generationsLimit != null
              ? 'bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400'
              : 'bg-app-surface border border-app-border text-app-muted'
          }`}>
            <span className="font-black text-sm">
              {currentOverrides.generationsLimit ?? tierDefault.generations}
            </span>
            <span className="block text-[10px]">
              {currentOverrides.generationsLimit != null ? 'Custom Override' : 'Tier Default'}
            </span>
            <span className="block text-[10px] opacity-70">Generations</span>
          </div>
          <div className={`flex-1 px-3 py-2 rounded-lg text-center text-xs ${
            currentOverrides.basicActionsLimit != null
              ? 'bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400'
              : 'bg-app-surface border border-app-border text-app-muted'
          }`}>
            <span className="font-black text-sm">
              {currentOverrides.basicActionsLimit ?? tierDefault.basicActions}
            </span>
            <span className="block text-[10px]">
              {currentOverrides.basicActionsLimit != null ? 'Custom Override' : 'Tier Default'}
            </span>
            <span className="block text-[10px] opacity-70">Basic Actions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
