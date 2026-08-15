'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Info } from 'lucide-react'
import { suggestAssigneeWithAiAction } from '@/lib/wbs/ai-assignment-actions'
import { assignRaciRole } from '@/lib/wbs/actions'

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<{ rationale: string; id: string } | null>(null)

  const handleAiSuggest = async () => {
    setIsGenerating(true)
    setSuggestion(null)
    try {
      const res = await suggestAssigneeWithAiAction(organizationId, projectId, wbsElementId)
      if (!res.ok || !res.data) {
        onShowToast('error', res.error || 'Failed to generate Praz-AI suggestion.')
        setIsGenerating(false)
        return
      }

      setSuggestion({ rationale: res.data.rationale, id: res.data.suggestedStakeholderId })
      
      // Auto apply as Responsible
      const applyRes = await assignRaciRole(projectId, wbsElementId, res.data.suggestedStakeholderId, 'Responsible')
      if (!applyRes.ok) {
        onShowToast('error', applyRes.error || 'Failed to apply the suggested role.')
      } else {
        onShowToast('success', 'Praz-AI successfully suggested and applied a Responsible assignee.')
        if (onAssignmentChanged) onAssignmentChanged()
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Unknown error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Same gating logic as ADR
  const isEnterprise = tier === 'enterprise'
  const isPremium = tier === 'premium'
  const isAllowed = isEnterprise || (isPremium && aiEnabled)
  const isFree = tier === 'free'
  
  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <div className="relative group w-full flex">
        <button
          type="button"
          onClick={handleAiSuggest}
          disabled={isGenerating || !isAllowed}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isGenerating ? 'Analyzing Requirements...' : 'Suggest Assignee with Praz-AI'}
          {isFree && <span className="ml-1 bg-violet-600/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-violet-700 dark:text-violet-300">Premium</span>}
          {isPremium && !aiEnabled && <span className="ml-1 bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Locked</span>}
        </button>
        {isFree ? (
          <div className="absolute top-full left-0 mt-2 w-full p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Praz-AI Auto-Assignment is available on Premium and Enterprise plans.
          </div>
        ) : isPremium && !aiEnabled ? (
          <div className="absolute top-full left-0 mt-2 w-full p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Praz-AI Features are currently locked for this workspace. Contact platform support to enable them.
          </div>
        ) : null}
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
    </div>
  )
}
