'use client'

import { useState } from 'react'
import { Sparkles, BarChart, CheckCircle2 } from 'lucide-react'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { generateStatusReport } from '@/lib/documents/ai-execution-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface AiStatusReportBannerProps {
  projectId: string
  organizationId: string
  onGenerated: (data: Record<string, string>) => void
  onShowToast?: (type: 'success' | 'error', msg: string) => void
}

export function AiStatusReportBanner({ projectId, organizationId, onGenerated, onShowToast }: AiStatusReportBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    onShowToast?.('success', 'Praz-AI is synthesizing your execution data...')

    const res = await generateStatusReport(projectId, 'openai')

    setIsGenerating(false)
    if (res.ok && res.data) {
      await recordUsage('generations')
      onShowToast?.('success', 'Status Report generated successfully!')
      onGenerated(res.data)
    } else {
      onShowToast?.('error', res.error || 'Failed to generate status report')
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
                STATUS REPORT AUTOMATION ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Praz-AI Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Praz-AI will automatically scan your WBS, Active Issues, and Risks to draft a comprehensive, executive-ready Status Report.
            </p>
          </div>
        </div>

        {/* Right Column: Action Button */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-300 ${
              isGenerating
                ? 'bg-violet-100 text-violet-400 dark:bg-violet-900/30 dark:text-violet-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 hover:shadow-violet-500/25 hover:shadow-lg text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-violet-400 dark:border-violet-500 border-t-transparent animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Generate Status Report</span>
              </>
            )}
          </button>
        </div>
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
