'use client'

import React from 'react'
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { usePrdToRiceAutomation } from './usePrdToRiceAutomation'
import PrdToRiceModal from '../PrdToRiceModal'

interface PrdToRiceAutomationBannerProps {
  projectId: string
  organizationId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
}

export default function PrdToRiceAutomationBanner({
  projectId,
  organizationId,
  freeText,
  onShowToast,
  isSnapshot = false,
}: PrdToRiceAutomationBannerProps) {
  const {
    isGenerating,
    generatedItems,
    isModalOpen,
    setIsModalOpen,
    handleGenerateRiceBacklog,
  } = usePrdToRiceAutomation({
    projectId,
    organizationId,
    freeText,
    onShowToast,
  })

  if (isSnapshot) return null

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
                PRD → RICE Backlog Automation Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Praz-AI Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Extract user stories, estimate RICE parameters (Reach, Impact, Confidence, Effort), and insert product backlog items automatically.
            </p>
          </div>
        </div>

        {/* Right Column: Action Button */}
        <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
          {generatedItems.length > 0 && (
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 text-xs hover:bg-emerald-500/25 transition-all cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>View Generated ({generatedItems.length})</span>
            </button>
          )}

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            disabled={isGenerating}
            onClick={handleGenerateRiceBacklog}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Praz-AI Building Backlog...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-violet-200" />
                <span>Convert PRD to RICE Backlog</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Backlog Preview Modal */}
      <PrdToRiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={generatedItems}
        projectId={projectId}
      />
    </div>
  )
}
