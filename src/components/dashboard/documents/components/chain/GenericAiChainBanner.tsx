'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, HelpCircle, Info, AlertCircle, X, ChevronDown } from 'lucide-react'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import { 
  draftProblemDiscoveryFromMarketResearch,
  draftCustomerResearchFromProblemDiscovery,
  draftProblemDefinitionFromCustomerResearch,
  draftOpportunityAssessmentFromProblemDefinition,
  draftProductStrategyFromOpportunityAssessment,
  draftPrioritizationFromStrategy,
  draftRoadmapFromPrioritization,
  draftSolutionDesignFromRoadmap,
  draftValidationFromSolutionDesign,
  draftPrdFromValidation,
} from '@/lib/documents/ai-chain-actions'
import { generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'

interface GenericAiChainBannerProps {
  projectId: string
  organizationId: string
  documentType: string
  templateId?: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
  onSaveSuccess?: () => void
  secondaryActions?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    isGenerating?: boolean
    isDone?: boolean
    doneLabel?: string
  }[]
}

export default function GenericAiChainBanner({
  projectId,
  organizationId,
  documentType,
  templateId,
  onShowToast,
  onGenerated,
  onSaveSuccess,
  secondaryActions,
}: GenericAiChainBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  // Map document type to the corresponding action, labels, and info tooltip
  const chainMapping: Record<string, { title: string, desc: string, info: string, action: Function }> = {
    'problem_discovery_workspace': {
      title: 'Draft Problem Discovery',
      desc: 'Auto-generate from Market Research',
      info: 'Extracts core customer pain points, unmet needs, and market opportunities from your Market Research.',
      action: draftProblemDiscoveryFromMarketResearch
    },
    'customer_research_strategy': {
      title: 'Draft Customer Research',
      desc: 'Auto-generate from Problem Discovery',
      info: 'Synthesizes Voice of Customer (VoC) methodology, cohort sampling, and interview guides from Problem Discovery.',
      action: draftCustomerResearchFromProblemDiscovery
    },
    'problem_definition_workspace': {
      title: 'Draft Problem Definition',
      desc: 'Auto-generate from Customer Research',
      info: 'Synthesizes target customer personas, Jobs-to-be-Done (JTBD), and problem framing from Customer Research.',
      action: draftProblemDefinitionFromCustomerResearch
    },
    'opportunity_assessment_workspace': {
      title: 'Draft Opportunity Assessment',
      desc: 'Auto-generate from Problem Definition',
      info: 'Sizes market demand, business value, technical feasibility, and risks before Strategy commits.',
      action: draftOpportunityAssessmentFromProblemDefinition
    },
    'product_strategy_document': {
      title: 'Draft Product Strategy',
      desc: 'Auto-generate from Opportunity Assessment',
      info: 'Drafts strategic pillars, target outcomes, and competitive advantage from the Opportunity Assessment.',
      action: draftProductStrategyFromOpportunityAssessment
    },
    'prioritization_workspace': {
      title: 'Draft Prioritization',
      desc: 'Auto-generate from Product Strategy',
      info: 'Generates RICE scoring matrices and strategic alignment evaluations against your Product Strategy.',
      action: draftPrioritizationFromStrategy
    },
    'product_roadmap_document': {
      title: 'Draft Product Roadmap',
      desc: 'Auto-generate from Prioritization',
      info: 'Sequences prioritized initiatives into Now-Next-Later strategic horizons and quarterly milestone themes.',
      action: (pId: string, tId?: string) => draftRoadmapFromPrioritization(pId, 'product_roadmap_document', tId)
    },
    'roadmap_workspace': {
      title: 'Draft Product Roadmap',
      desc: 'Auto-generate from Prioritization',
      info: 'Sequences prioritized initiatives into Now-Next-Later strategic horizons and quarterly milestone themes.',
      action: (pId: string, tId?: string) => draftRoadmapFromPrioritization(pId, 'roadmap_workspace', tId)
    },
    'product_roadmap': {
      title: 'Draft Product Roadmap',
      desc: 'Auto-generate from Prioritization',
      info: 'Sequences prioritized initiatives into Now-Next-Later strategic horizons and quarterly milestone themes.',
      action: (pId: string, tId?: string) => draftRoadmapFromPrioritization(pId, 'product_roadmap', tId)
    },
    'solution_design_workspace': {
      title: 'Draft Solution Design',
      desc: 'Auto-generate from Roadmap (NOW Horizon)',
      info: 'Requires active cards in the "NOW" column of your Roadmap Kanban board. Drag prioritized items from Backlog into NOW to auto-generate UX user flows, wireframe specs, and system architectures.',
      action: draftSolutionDesignFromRoadmap
    },
    'solution_validation_workspace': {
      title: 'Draft Validation & Experimentation',
      desc: 'Auto-generate from Solution Design',
      info: 'Synthesizes testable hypotheses, fake-door / prototype experiments, and validation metrics from Solution Design.',
      action: draftValidationFromSolutionDesign
    },
    'product_requirements_document': {
      title: 'Draft PRD',
      desc: 'Auto-generate from Validation Plan',
      info: 'Drafts engineering-ready user stories, functional acceptance criteria, and success metrics from the validated Solution Design.',
      action: draftPrdFromValidation
    }
  }

  const mapping = chainMapping[documentType]

  if (!mapping) return null

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    setIsGenerating(true)
    setInlineError(null)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) {
        setIsGenerating(false)
        return
      }

      const res = await mapping.action(projectId, templateId)
      if (res.ok && res.data) {
        if (onGenerated) onGenerated(res.data)
        setIsDone(true)
        setInlineError(null)
        await recordUsage('generations')
        onShowToast('success', `⚡ Successfully generated from upstream context!`)
        if (onSaveSuccess) onSaveSuccess()
      } else {
        const errorMsg = res.error || 'Failed to generate from upstream document.'
        setInlineError(errorMsg)
        onShowToast('error', errorMsg)
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = 'An unexpected error occurred during generation.'
      setInlineError(errorMsg)
      onShowToast('error', errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="mb-6 p-4 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 shadow-2xs transition-all relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  PRAZ-AI CO-PILOT
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                  Auto-Chain
                </span>
                
                {/* Interactive Info Tooltip */}
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Generation requirements info"
                    className="p-1 rounded-full text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200 hover:bg-violet-500/10 transition-colors cursor-help"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-72 p-3 bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 rounded-xl text-xs font-normal shadow-2xl border border-slate-700/80 backdrop-blur-md pointer-events-none animate-in fade-in duration-150">
                    <p className="font-bold text-violet-400 mb-1 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" /> Requirements & Output
                    </p>
                    <p className="leading-relaxed text-slate-200 text-[11px]">{mapping.info}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {mapping.desc}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex items-center gap-2">
            {isDone && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Generated
              </span>
            )}
            {secondaryActions?.some(a => a.isDone) && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {secondaryActions.find(a => a.isDone)?.doneLabel || 'Generated'}
              </span>
            )}
            
            <div className="relative inline-flex items-stretch shadow-md shadow-violet-500/20 rounded-xl">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all ${
                  secondaryActions && secondaryActions.length > 0 ? 'rounded-l-xl border-r border-violet-700' : 'rounded-xl'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {mapping.title}
                  </>
                )}
              </button>

              {secondaryActions && secondaryActions.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-2.5 bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center rounded-r-xl shadow-sm transition-all cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1">
                      {secondaryActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            action.onClick()
                            setIsDropdownOpen(false)
                          }}
                          disabled={action.isGenerating}
                          className="w-full px-3 py-2.5 flex items-center justify-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {action.isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500 shrink-0" />
                          ) : action.icon ? (
                            <div className="text-violet-500 shrink-0">{action.icon}</div>
                          ) : (
                            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                          )}
                          <span className="text-left leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inline Error / Requirement Alert Banner */}
        {inlineError && (
          <div className="mt-3.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="font-bold text-rose-800 dark:text-rose-200">Action Required Before Generating</p>
                <p className="leading-relaxed text-slate-700 dark:text-slate-200 text-xs">{inlineError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInlineError(null)}
              className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 shrink-0 transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
