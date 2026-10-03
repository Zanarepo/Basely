'use client'

import React, { useState, useTransition } from 'react'
import { Rocket, Layers, RotateCcw, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateOrgProjectLimits } from '@/lib/backoffice/project-limit-actions'

interface ProjectLimitOverridePanelProps {
  organizationId: string
  tierDefault: { sprints: number; releases: number }
  currentOverrides: {
    sprintsLimit: number | null
    releasesLimit: number | null
  }
}

export function ProjectLimitOverridePanel({
  organizationId,
  tierDefault,
  currentOverrides,
}: ProjectLimitOverridePanelProps) {
  const [sprintsInput, setSprintsInput] = useState(
    currentOverrides.sprintsLimit != null ? String(currentOverrides.sprintsLimit) : ''
  )
  const [releasesInput, setReleasesInput] = useState(
    currentOverrides.releasesLimit != null ? String(currentOverrides.releasesLimit) : ''
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

    const sprintsLimit = sprintsInput.trim() !== '' ? parseInt(sprintsInput, 10) : null
    const releasesLimit = releasesInput.trim() !== '' ? parseInt(releasesInput, 10) : null

    if ((sprintsInput.trim() !== '' && isNaN(sprintsLimit!)) ||
        (releasesInput.trim() !== '' && isNaN(releasesLimit!))) {
      setStatus('error')
      setStatusMsg('Limits must be valid numbers (-1 for unlimited).')
      return
    }

    startTransition(async () => {
      const result = await updateOrgProjectLimits(organizationId, {
        sprintsLimit,
        releasesLimit,
        justification,
      })
      if (result.success) {
        setStatus('success')
        setStatusMsg('Project limits updated and logged to the audit trail.')
        setJustification('')
      } else {
        setStatus('error')
        setStatusMsg(result.error || 'An unknown error occurred.')
      }
    })
  }

  const handleClearOverrides = () => {
    setSprintsInput('')
    setReleasesInput('')
  }

  return (
    <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
      <h3 className="font-bold text-app-fg mb-1 flex items-center gap-2">
        <Rocket className="w-4 h-4 text-emerald-500" />
        Sprints & Releases Overrides
      </h3>
      <p className="text-xs text-app-muted mb-4">
        Set custom Sprints/Releases limits for this organization (-1 for unlimited). Leave blank to use the tier default. Changes are logged to the audit trail.
      </p>

      {/* Tier Defaults Info */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 p-3 bg-app-surface rounded-xl border border-app-border text-center">
          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Tier Default</p>
          <p className="text-lg font-black text-app-fg">{tierDefault.sprints === -1 ? '∞' : tierDefault.sprints}</p>
          <p className="text-[10px] text-app-muted">Max Sprints</p>
        </div>
        <div className="flex-1 p-3 bg-app-surface rounded-xl border border-app-border text-center">
          <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Tier Default</p>
          <p className="text-lg font-black text-app-fg">{tierDefault.releases === -1 ? '∞' : tierDefault.releases}</p>
          <p className="text-[10px] text-app-muted">Max Releases</p>
        </div>
      </div>

      {/* Override Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">
            <Layers className="w-3 h-3 inline mr-1 text-emerald-500" />
            Max Sprints Override
          </label>
          <input
            type="number"
            min="-1"
            placeholder={`Tier default: ${tierDefault.sprints === -1 ? 'Unlimited' : tierDefault.sprints} (blank = use default)`}
            value={sprintsInput}
            onChange={(e) => setSprintsInput(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">
            <Rocket className="w-3 h-3 inline mr-1 text-emerald-500" />
            Max Releases Override
          </label>
          <input
            type="number"
            min="-1"
            placeholder={`Tier default: ${tierDefault.releases === -1 ? 'Unlimited' : tierDefault.releases} (blank = use default)`}
            value={releasesInput}
            onChange={(e) => setReleasesInput(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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
            currentOverrides.sprintsLimit != null
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-app-surface border border-app-border text-app-muted'
          }`}>
            <span className="font-black text-sm">
              {currentOverrides.sprintsLimit != null 
                ? (currentOverrides.sprintsLimit === -1 ? '∞' : currentOverrides.sprintsLimit)
                : (tierDefault.sprints === -1 ? '∞' : tierDefault.sprints)}
            </span>
            <span className="block text-[10px]">
              {currentOverrides.sprintsLimit != null ? 'Custom Override' : 'Tier Default'}
            </span>
            <span className="block text-[10px] opacity-70">Sprints</span>
          </div>
          <div className={`flex-1 px-3 py-2 rounded-lg text-center text-xs ${
            currentOverrides.releasesLimit != null
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-app-surface border border-app-border text-app-muted'
          }`}>
            <span className="font-black text-sm">
              {currentOverrides.releasesLimit != null 
                ? (currentOverrides.releasesLimit === -1 ? '∞' : currentOverrides.releasesLimit)
                : (tierDefault.releases === -1 ? '∞' : tierDefault.releases)}
            </span>
            <span className="block text-[10px]">
              {currentOverrides.releasesLimit != null ? 'Custom Override' : 'Tier Default'}
            </span>
            <span className="block text-[10px] opacity-70">Releases</span>
          </div>
        </div>
      </div>
    </div>
  )
}
