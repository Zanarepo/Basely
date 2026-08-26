'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle2, ChevronDown, FileText, Target } from 'lucide-react'
import { useMarketResearchAiAutomation } from '@/components/dashboard/documents/hooks/useMarketResearchAiAutomation'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface MarketResearchChainBannerProps {
  projectId: string
  organizationId: string
  templateId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
}

export default function MarketResearchChainBanner({
  projectId,
  organizationId,
  templateId,
  freeText,
  onShowToast,
  onGenerated,
}: MarketResearchChainBannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    isSynthesizingStrategy,
    isDraftingMarketResearch,
    isStrategyDone,
    isMarketResearchDone,
    isDraftingCompetitiveSpec,
    isCompetitiveSpecDone,
    handleSynthesizeStrategy,
    handleDraftMarketResearch,
    handleDraftCompetitiveSpec,
    UpgradePromptModalProps
  } = useMarketResearchAiAutomation({
    projectId,
    organizationId,
    templateId,
    freeText,
    onShowToast,
    onGenerated
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <div className="mb-6 p-4 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 shadow-2xs transition-all relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Column: Title & Description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  MARKET RESEARCH CO-PILOT
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                  Praz-AI Chain
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Generate high-quality customer research insights and draft target market segments automatically.
              </p>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="shrink-0 w-full sm:w-auto flex items-center gap-2" ref={dropdownRef}>
            {/* Status indicators */}
            {isMarketResearchDone && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Market Research Done
              </span>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isDraftingMarketResearch || isSynthesizingStrategy || isDraftingCompetitiveSpec}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
              >
                {isDraftingMarketResearch || isSynthesizingStrategy || isDraftingCompetitiveSpec ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Praz-AI Working...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                    <span>Trigger AI Action</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-app-card border border-app-border rounded-xl shadow-2xl z-50 p-1 animate-fade-in origin-top-right">
                  <div className="px-3 py-2">
                    <span className="text-[10px] font-extrabold text-app-muted uppercase tracking-wider">Research Operations</span>
                  </div>
                  <button
                    onClick={() => { setIsOpen(false); handleDraftMarketResearch(); }}
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-app-hover transition-colors group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-500 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-fg group-hover:text-violet-500 transition-colors">Draft Research Report</div>
                      <div className="text-[10px] text-app-muted mt-0.5 leading-snug">Generate from Business Case & Feasibility Study</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); handleSynthesizeStrategy(); }}
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-app-hover transition-colors group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-fg group-hover:text-emerald-500 transition-colors">Generate Strategy</div>
                      <div className="text-[10px] text-app-muted mt-0.5 leading-snug">Synthesize current research into Product Strategy</div>
                    </div>
                  </button>

                  {/* Competitive Spec Option */}
                  {(templateId === 'competitive_analysis_workspace' || templateId === 'competitive_benchmarking_matrix') && (
                    <>
                      <div className="h-px bg-app-border my-1" />
                      <div className="px-3 py-2">
                        <span className="text-[10px] font-extrabold text-app-muted uppercase tracking-wider">Matrix Outputs</span>
                      </div>
                      <button
                        onClick={() => { setIsOpen(false); handleDraftCompetitiveSpec(); }}
                        className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-app-hover transition-colors group cursor-pointer"
                      >
                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-app-fg group-hover:text-purple-500 transition-colors">Draft Document Spec</div>
                          <div className="text-[10px] text-app-muted mt-0.5 leading-snug">Generate from structured Competitive Matrix</div>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
