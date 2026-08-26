'use client'

import { Sparkles, Loader2, Users } from 'lucide-react'
import { useAiBulkAutoAssign } from './hooks/useAiBulkAutoAssign'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

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
    UpgradePromptModalProps
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
        disabled={isGenerating || wbsElementIds.length === 0}
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
      </button>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
