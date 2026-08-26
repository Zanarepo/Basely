'use client'

import React from 'react'
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { usePrdToRiceAutomation } from './usePrdToRiceAutomation'
import PrdToRiceModal from '../PrdToRiceModal'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

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
    UpgradePromptModalProps,
  } = usePrdToRiceAutomation({
    projectId,
    organizationId,
    freeText,
    onShowToast,
  })

  if (isSnapshot) return null

  return (
    <>
      <AiHoverBannerWrapper
        widthClass="w-[420px]"
        trigger={
          <div className="flex items-center gap-2">
            {generatedItems.length > 0 && (
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Generated ({generatedItems.length})</span>
              </button>
            )}

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              disabled={isGenerating}
              onClick={handleGenerateRiceBacklog}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Building Backlog...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convert PRD to RICE Backlog</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
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
        </div>
      </AiHoverBannerWrapper>

      {/* Generated Backlog Preview Modal */}
      <PrdToRiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={generatedItems}
        projectId={projectId}
      />

      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
