import React from 'react'
import { Link, Loader2 } from 'lucide-react'

interface AutoAlignButtonProps {
  isAligning: boolean
  onAlign: () => void
  disabled?: boolean
}

export function AutoAlignButton({ isAligning, onAlign, disabled }: AutoAlignButtonProps) {
  return (
    <button
      type="button"
      onClick={onAlign}
      disabled={isAligning || disabled}
      style={{ cursor: isAligning || disabled ? 'not-allowed' : 'pointer' }}
      className="px-4 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all border border-violet-200 dark:border-violet-800 disabled:opacity-50"
    >
      {isAligning ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Link className="w-4 h-4" />
      )}
      {isAligning ? 'Aligning...' : 'Auto-Align OKRs'}
    </button>
  )
}
