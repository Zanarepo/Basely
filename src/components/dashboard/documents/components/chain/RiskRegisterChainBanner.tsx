'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { synthesizeRiskRegisterFromCharterAndScope } from '@/lib/documents/ai-chain-actions'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface RiskRegisterChainBannerProps {
  projectId: string
  organizationId: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSuccess?: () => void
}

export default function RiskRegisterChainBanner({
  projectId,
  organizationId,
  onShowToast,
  onSuccess,
}: RiskRegisterChainBannerProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleSynthesize = async () => {
    if (isSynthesizing || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsSynthesizing(true)
    try {
      const res = await synthesizeRiskRegisterFromCharterAndScope(projectId)
      if (res.ok) {
        setIsDone(true)
        await recordUsage('generations')
        onShowToast(
          'success',
          '⚡ Risk Register generated! The document has been populated with intelligent threats and mitigations.'
        )
        if (onSuccess) {
          onSuccess()
        }
      } else {
        onShowToast('error', res.error || 'Failed to generate Risk Register')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during synthesis.')
    } finally {
      setIsSynthesizing(false)
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
                <span>Risk Register Generated!</span>
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
                  <span>Praz-AI Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isDone ? 'Re-generate' : 'Generate Risk Register'}</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="bg-gradient-to-r from-rose-500/10 via-red-500/10 to-white dark:to-slate-900 border border-rose-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          {/* Left Column: Title & Description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  CHARTER & SCOPE → RISK REGISTER AUTOMATION
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                  Praz-AI Module
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Read the Project Charter and Scope Statement simultaneously to auto-populate critical threats and mitigations.
              </p>
            </div>
          </div>
        </div>
      </AiHoverBannerWrapper>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
