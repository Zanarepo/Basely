'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Loader2, Compass, CheckCircle2 } from 'lucide-react'
import { synthesizeRoadmapFromStrategy } from '@/lib/documents/ai-chain-actions'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'

interface StrategyChainBannerProps {
  projectId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function StrategyChainBanner({
  projectId,
  freeText,
  onShowToast,
}: StrategyChainBannerProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSynthesize = async () => {
    setIsSynthesizing(true)
    try {
      const res = await synthesizeRoadmapFromStrategy(projectId, freeText)
      if (res.ok) {
        setIsDone(true)
        onShowToast(
          'success',
          '⚡ Product Roadmap generated! Switch to Product Roadmap in the sidebar to view Now/Next/Later horizons.'
        )
      } else {
        onShowToast('error', res.error || 'Failed to generate Product Roadmap')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during synthesis.')
    } finally {
      setIsSynthesizing(false)
    }
  }

  return (
    <AiHoverBannerWrapper
      widthClass="w-[420px]"
      trigger={
        <div className="flex items-center gap-2">
          {isDone && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Roadmap Generated!</span>
            </div>
          )}

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            disabled={isSynthesizing}
            onClick={handleSynthesize}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Praz-AI Generating Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isDone ? 'Re-generate' : 'Generate Product Roadmap'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        {/* Left Column: Title & Description */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                PRODUCT STRATEGY → ROADMAP AUTOMATION ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Praz-AI Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Translate strategic bets, value propositions, and defensibility moats into a structured Now / Next / Later Roadmap automatically.
            </p>
          </div>
        </div>
      </div>
    </AiHoverBannerWrapper>
  )
}
