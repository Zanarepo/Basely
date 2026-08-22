'use client'

import { Sparkles, Loader2, Users } from 'lucide-react'
import { useAiBulkAutoAssign } from './hooks/useAiBulkAutoAssign'

export type AiBulkAutoAssignButtonProps = {
  organizationId: string
  projectId: string
  wbsElementIds: string[]
  tier: string
  aiEnabled: boolean
  onAssignmentsCompleted?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function AiBulkAutoAssignButton({
  organizationId,
  projectId,
  wbsElementIds,
  tier,
  aiEnabled,
  onAssignmentsCompleted,
  onShowToast
}: AiBulkAutoAssignButtonProps) {
  const {
    isGenerating,
    handleBulkAiSuggest,
    isAllowed,
    isFree,
    isPremium
  } = useAiBulkAutoAssign({
    organizationId,
    projectId,
    wbsElementIds,
    tier,
    aiEnabled,
    onAssignmentsCompleted,
    onShowToast
  })

  return (
    <div className="relative group flex">
      <button
        type="button"
        onClick={handleBulkAiSuggest}
        disabled={isGenerating || !isAllowed || wbsElementIds.length === 0}
        className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        title={wbsElementIds.length === 0 ? "All tasks are assigned" : "Draft RACI for unassigned tasks"}
      >
        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {isGenerating ? 'Drafting RACI...' : 'Auto-Draft RACI'}
        {wbsElementIds.length > 0 && !isGenerating && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-600/20 text-[10px] leading-none flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {wbsElementIds.length}
          </span>
        )}
        {isFree && <span className="ml-1 bg-violet-600/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-violet-700 dark:text-violet-300">Premium</span>}
        {isPremium && !aiEnabled && <span className="ml-1 bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Locked</span>}
      </button>
      {isFree ? (
        <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Praz-AI Auto-Assignment is available on Premium and Enterprise plans.
        </div>
      ) : isPremium && !aiEnabled ? (
        <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Praz-AI Features are currently locked for this workspace. Contact platform support to enable them.
        </div>
      ) : null}
    </div>
  )
}
