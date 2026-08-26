import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle2, ChevronDown, FileText, Target } from 'lucide-react'
import { useStrategyAiAutomation } from '../../hooks/useStrategyAiAutomation'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface StrategyChainBannerProps {
  projectId: string
  organizationId: string
  templateId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
}

export default function StrategyChainBanner({
  projectId,
  organizationId,
  templateId,
  freeText,
  onShowToast,
  onGenerated
}: StrategyChainBannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    isSynthesizingRoadmap,
    isDraftingStrategy,
    isDone,
    handleSynthesizeRoadmap,
    handleDraftStrategy,
    UpgradePromptModalProps
  } = useStrategyAiAutomation({
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
      <div className="flex items-center gap-2">
        {isDone && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed!</span>
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSynthesizingRoadmap || isDraftingStrategy}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
          >
            {isSynthesizingRoadmap || isDraftingStrategy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Strategy Tools</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-app-surface border border-app-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top-left">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2">
                  <span className="text-[10px] font-extrabold text-app-muted uppercase tracking-wider">Strategy Inputs</span>
                </div>
                <button
                  onClick={() => { setIsOpen(false); handleDraftStrategy(); }}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-app-hover transition-colors group"
                >
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-app-fg group-hover:text-blue-500 transition-colors">Draft Strategy</div>
                    <div className="text-[10px] text-app-muted mt-0.5 leading-snug">Generate from Charter & Scope Statement</div>
                  </div>
                </button>
                
                <div className="h-px bg-app-border my-1" />
                
                <div className="px-3 py-2">
                  <span className="text-[10px] font-extrabold text-app-muted uppercase tracking-wider">Strategy Outputs</span>
                </div>
                <button
                  onClick={() => { setIsOpen(false); handleSynthesizeRoadmap(); }}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-app-hover transition-colors group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-app-fg group-hover:text-emerald-500 transition-colors">Generate Roadmap</div>
                    <div className="text-[10px] text-app-muted mt-0.5 leading-snug">Synthesize current strategy into Now/Next/Later</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
