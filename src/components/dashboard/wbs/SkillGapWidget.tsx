'use client'

import React, { useState, useTransition } from 'react'
import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, BrainCircuit, Users } from 'lucide-react'
import { analyzeSkillGaps, SkillGapAnalysisResult } from '@/lib/wbs/skill-gap-logic'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface SkillGapWidgetProps {
  projectId: string
  organizationId: string
}

export function SkillGapWidget({ projectId, organizationId }: SkillGapWidgetProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SkillGapAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleAnalyze = async () => {
    if (isChecking || isAnalyzing || isPending) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) {
        setIsAnalyzing(false)
        return
      }

      startTransition(async () => {
        const res = await analyzeSkillGaps(projectId, organizationId)
        if (res.ok && res.data) {
          setResult(res.data)
          setIsExpanded(true)
          await recordUsage('generations')
        } else {
          setError(res.error || 'Failed to analyze skill gaps.')
        }
        setIsAnalyzing(false)
      })
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setIsAnalyzing(false)
    }
  }

  const hasIssues = result?.hasGaps || (result?.warnings && result.warnings.length > 0)

  return (
    <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-app-fg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-500" />
            AI Skill Gap Analysis
          </h3>
          <p className="text-sm text-app-muted mt-1">
            Proactively scan upcoming WBS phases against your team's Capacity Matrix.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isChecking || isPending}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isAnalyzing || isPending ? (
            <span className="animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Analyzing Matrix...
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Run Analysis
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {result && isExpanded && (
        <div className="mt-6 pt-6 border-t border-app-border animate-in slide-in-from-top-2 fade-in duration-300">
          {!hasIssues ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="font-bold text-app-fg text-lg">No Skill Gaps Detected</h4>
              <p className="text-sm text-app-muted max-w-md mt-1">
                Your current team has the required skills and available capacity to handle all upcoming planned WBS elements.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {result.gaps.length > 0 && (
                <div>
                  <h4 className="font-bold text-app-fg flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Critical Skill Deficits ({result.gaps.length})
                  </h4>
                  <div className="space-y-3">
                    {result.gaps.map((gap, i) => (
                      <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-app-fg text-sm">{gap.wbsElementName}</h5>
                            <p className="text-xs text-app-muted mt-0.5">Missing Skills: <span className="font-semibold text-rose-500">{gap.missingSkills.join(', ')}</span></p>
                          </div>
                          <span className="px-2 py-1 bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Blocker
                          </span>
                        </div>
                        <p className="text-sm text-app-fg mt-3">{gap.description}</p>
                        <div className="mt-3 pt-3 border-t border-rose-500/10 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                            AI Recommendation: {gap.recommendedAction}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div>
                  <h4 className="font-bold text-app-fg flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Capacity Warnings ({result.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    {result.warnings.map((warn, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-amber-700 dark:text-amber-400">{warn.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-xs font-bold text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            >
              Hide Results
            </button>
          </div>
        </div>
      )}
      
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
