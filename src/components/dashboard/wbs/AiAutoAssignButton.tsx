'use client'

import { Sparkles, Loader2, Info } from 'lucide-react'
import { useAiAutoAssign } from './hooks/useAiAutoAssign'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

export type AiAutoAssignButtonProps = {
  organizationId: string
  projectId: string
  wbsElementId: string
  tier: string
  aiEnabled: boolean
  onAssignmentChanged?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function AiAutoAssignButton({
  organizationId,
  projectId,
  wbsElementId,
  tier,
  aiEnabled,
  onAssignmentChanged,
  onShowToast
}: AiAutoAssignButtonProps) {
  const {
    isGenerating,
    suggestion,
    handleAiSuggest,
    UpgradePromptModalProps
  } = useAiAutoAssign({
    organizationId,
    projectId,
    wbsElementId,
    tier,
    aiEnabled,
    onAssignmentChanged,
    onShowToast
  })

  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <div className="relative group w-full flex">
        <button
          type="button"
          onClick={handleAiSuggest}
          disabled={isGenerating}
          className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isGenerating ? 'Analyzing Requirements...' : 'Suggest Assignee with Praz-AI'}
        </button>
      </div>
      
      {suggestion && (
        <div className="p-3 bg-violet-600/5 border border-violet-600/20 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div className="text-xs text-app-fg leading-relaxed">
            <span className="font-bold text-violet-600 block mb-0.5">Praz-AI Suggestion Rationale:</span>
            {suggestion.rationale}
          </div>
        </div>
      )}
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
