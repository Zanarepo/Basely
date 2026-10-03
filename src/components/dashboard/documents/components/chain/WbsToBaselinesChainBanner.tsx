'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, CalendarDays } from 'lucide-react'
import { generateWbsBaselines } from '@/lib/documents/ai-baseline-actions'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface WbsToBaselinesChainBannerProps {
  projectId: string
  organizationId: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSuccess?: () => void
}

export default function WbsToBaselinesChainBanner({
  projectId,
  organizationId,
  onShowToast,
  onSuccess,
}: WbsToBaselinesChainBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    try {
      const res = await generateWbsBaselines(projectId)
      if (res.success) {
        setIsDone(true)
        await recordUsage('generations')
        onShowToast(
          'success',
          '⚡ Baselines generated! The Budget Baseline and Schedule Document have been populated in your Document Suite.'
        )
        if (onSuccess) {
          onSuccess()
        }
      } else {
        onShowToast('error', res.error || 'Failed to generate baselines')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during baseline generation.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <AiHoverBannerWrapper
        widthClass="w-[420px]"
        trigger={
          <div className="flex items-center gap-2">
            {isDone && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Baselines Generated!</span>
              </div>
            )}

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              disabled={isGenerating}
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Praz-AI Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isDone ? 'Re-generate' : 'Generate Baselines'}</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-white dark:to-slate-900 border border-sky-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          {/* Left Column: Title & Description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  WBS → BUDGET & SCHEDULE BASELINES
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-600 text-white uppercase tracking-wider">
                  Praz-AI Module
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Read the Work Breakdown Structure to auto-calculate the Schedule and Budget Baselines.
              </p>
            </div>
          </div>
        </div>
      </AiHoverBannerWrapper>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
