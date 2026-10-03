import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface GenerateOkrsButtonProps {
  isGenerating: boolean
  onGenerate: () => void
  disabled?: boolean
}

export function GenerateOkrsButton({ isGenerating, onGenerate, disabled }: GenerateOkrsButtonProps) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating || disabled}
      style={{ cursor: isGenerating || disabled ? 'not-allowed' : 'pointer' }}
      className="px-5 py-2.5 rounded-xl bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all border border-violet-200 dark:border-violet-800 disabled:opacity-50"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {isGenerating ? 'Synthesizing OKRs...' : 'Auto-Generate from Strategy'}
    </button>
  )
}
