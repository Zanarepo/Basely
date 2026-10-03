'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { useAiGenerateRisks } from '../hooks/useAiGenerateRisks'

export type AiGenerateRisksButtonProps = {
  organizationId: string
  projectId: string
  tier: string
  aiEnabled: boolean
  onSuccess?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function AiGenerateRisksButton({
  organizationId,
  projectId,
  tier,
  aiEnabled,
  onSuccess,
  onShowToast
}: AiGenerateRisksButtonProps) {
  const {
    isGenerating,
    handleGenerateRisks,
    isAllowed,
    isFree,
    isPremium
  } = useAiGenerateRisks({
    organizationId,
    projectId,
    tier,
    aiEnabled,
    onSuccess,
    onShowToast
  })

  return (
    <div className="relative group flex cursor-pointer">
      <button
        type="button"
        onClick={handleGenerateRisks}
        disabled={isGenerating || !isAllowed}
        className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        title="Analyze Charter and Scope to detect risks"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin cursor-pointer" /> : <Sparkles className="w-4 h-4 cursor-pointer" />}
        {isGenerating ? 'Analyzing Documents...' : 'Auto-Detect Risks'}
        {isFree && <span className="ml-1 bg-violet-600/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300 cursor-pointer">Premium</span>}
        {isPremium && !aiEnabled && <span className="ml-1 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 cursor-pointer">Locked</span>}
      </button>
      {isFree ? (
        <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 cursor-pointer">
          Praz-AI Document Synthesis is available on Premium and Enterprise plans.
        </div>
      ) : isPremium && !aiEnabled ? (
        <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 cursor-pointer">
          Praz-AI Features are currently locked for this workspace. Contact platform support to enable them.
        </div>
      ) : null}
    </div>
  )
}
