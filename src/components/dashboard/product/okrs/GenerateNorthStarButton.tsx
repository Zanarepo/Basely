'use client'

import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useGenerateNorthStar } from './hooks/useGenerateNorthStar'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
interface GenerateNorthStarButtonProps {
  organizationId: string
  projectId: string
  onGenerated: () => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function GenerateNorthStarButton({ organizationId, projectId, onGenerated, showToast }: GenerateNorthStarButtonProps) {
  const { isGenerating, handleGenerate, UpgradePromptModalProps } = useGenerateNorthStar(
    organizationId,
    projectId,
    onGenerated,
    showToast
  )

  return (
    <>
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      style={{ cursor: 'pointer' }}
      className="px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
      ) : (
        <Sparkles className="w-4 h-4 text-violet-500" />
      )}
      {isGenerating ? 'Generating...' : 'Auto-Generate from Strategy'}
    </button>
    <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
