'use client'

import { useState } from 'react'
import { Sparkles, Loader2, DollarSign } from 'lucide-react'
import { useAiCostEstimator } from './useAiCostEstimator'
import { AiHoverBannerWrapper } from '../documents/components/AiHoverBannerWrapper'

interface AiCostEstimatorBannerProps {
  projectId: string
  onComplete?: () => void
}

export function AiCostEstimatorBanner({ projectId, onComplete }: AiCostEstimatorBannerProps) {
  const { generate, isGenerating } = useAiCostEstimator(projectId, onComplete)

  return (
    <AiHoverBannerWrapper
      widthClass="w-[420px]"
      trigger={
        <button
          onClick={generate}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 rounded-md text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Estimating Budgets...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Auto-Estimate Budgets</span>
            </>
          )}
        </button>
      }
    >
      <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                AUTO-ESTIMATE BUDGETS
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Praz-AI Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Praz-AI will analyze your Work Breakdown Structure and project scope to automatically generate analogous, parametric, or bottom-up cost estimates for each work package.
            </p>
          </div>
        </div>
      </div>
    </AiHoverBannerWrapper>
  )
}
