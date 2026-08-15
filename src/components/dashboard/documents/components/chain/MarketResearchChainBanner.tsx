'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Loader2, Target, CheckCircle2 } from 'lucide-react'
import { synthesizeStrategyFromResearch } from '@/lib/documents/ai-chain-actions'

interface MarketResearchChainBannerProps {
  projectId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function MarketResearchChainBanner({
  projectId,
  freeText,
  onShowToast,
}: MarketResearchChainBannerProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSynthesize = async () => {
    setIsSynthesizing(true)
    try {
      const res = await synthesizeStrategyFromResearch(projectId, freeText)
      if (res.ok) {
        setIsDone(true)
        onShowToast(
          'success',
          '⚡ Product Strategy synthesized! Switch to Product Strategy in the sidebar to review.'
        )
      } else {
        onShowToast('error', res.error || 'Failed to synthesize Product Strategy')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during synthesis.')
    } finally {
      setIsSynthesizing(false)
    }
  }

  return (
    <div className="mb-6 p-4 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 shadow-2xs transition-all relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Column: Title & Description */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                MARKET RESEARCH → PRODUCT STRATEGY AUTOMATION ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Praz-AI Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Analyze your TAM sizing, ICP discovery notes, competitor matrix, and customer verbatims to generate a full Product Strategy spec automatically.
            </p>
          </div>
        </div>

        {/* Right Column: Action Button */}
        <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
          {isDone && (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 text-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Strategy Created!</span>
            </div>
          )}

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            disabled={isSynthesizing}
            onClick={handleSynthesize}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Praz-AI Synthesizing Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-violet-200" />
                <span>{isDone ? 'Synthesize Again' : 'Synthesize Product Strategy'}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
