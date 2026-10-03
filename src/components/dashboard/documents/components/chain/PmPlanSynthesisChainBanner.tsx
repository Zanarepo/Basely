'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Loader2, CheckCircle2, FileStack } from 'lucide-react'
import { generateProjectManagementPlan } from '@/lib/documents/ai-pm-plan-actions'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface PmPlanSynthesisChainBannerProps {
  projectId: string
  organizationId: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSuccess?: () => void
}

export default function PmPlanSynthesisChainBanner({
  projectId,
  organizationId,
  onShowToast,
  onSuccess,
}: PmPlanSynthesisChainBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    setIsDone(false)
    try {
      const res = await generateProjectManagementPlan(projectId)
      if (res.success) {
        setIsDone(true)
        await recordUsage('generations')
        onShowToast('success', 'Master Project Management Plan compiled successfully!')
        if (onSuccess) onSuccess()
      } else {
        onShowToast('error', res.error || 'Automation Failed')
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Automation Failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <AiHoverBannerWrapper
        widthClass="w-[420px]"
        trigger={
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 rounded-md text-xs font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Plan Compiled</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compile PM Plan</span>
              </>
            )}
          </button>
        }
      >
        <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-white dark:to-slate-900 border border-indigo-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <FileStack className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  MASTER PM PLAN SYNTHESIS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                  Praz-AI Module
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Multi-Document Synthesis: Praz-AI will gather your Charter, Scope, Baselines, and Risks, and synthesize them into the final Master Project Management Plan to officially close out the Planning Phase.
              </p>
            </div>
          </div>
        </div>
      </AiHoverBannerWrapper>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
