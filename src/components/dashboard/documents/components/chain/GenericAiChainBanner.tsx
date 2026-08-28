'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import { 
  draftProblemDiscoveryFromMarketResearch,
  draftCustomerResearchFromProblemDiscovery,
  draftProblemDefinitionFromCustomerResearch,
  draftProductStrategyFromProblemDefinition,
  draftOpportunityAssessmentFromStrategy,
  draftPrioritizationFromOpportunities,
  draftSolutionDesignFromPrioritization,
  draftValidationFromSolutionDesign,
  draftPrdFromValidation,
  draftRoadmapFromPrd
} from '@/lib/documents/ai-chain-actions'
import { generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'

interface GenericAiChainBannerProps {
  projectId: string
  organizationId: string
  documentType: string
  templateId?: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
}

export default function GenericAiChainBanner({
  projectId,
  organizationId,
  documentType,
  templateId,
  onShowToast,
  onGenerated,
}: GenericAiChainBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  // Map document type to the corresponding action and labels
  const chainMapping: Record<string, { title: string, desc: string, action: Function }> = {
    'problem_discovery_workspace': {
      title: 'Draft Problem Discovery',
      desc: 'Auto-generate from Market Research',
      action: draftProblemDiscoveryFromMarketResearch
    },
    'customer_research_strategy': {
      title: 'Draft Customer Research',
      desc: 'Auto-generate from Problem Discovery',
      action: draftCustomerResearchFromProblemDiscovery
    },
    'problem_definition_workspace': {
      title: 'Draft Problem Definition',
      desc: 'Auto-generate from Customer Research',
      action: draftProblemDefinitionFromCustomerResearch
    },
    'product_strategy_document': {
      title: 'Draft Product Strategy',
      desc: 'Auto-generate from Problem Definition',
      action: draftProductStrategyFromProblemDefinition
    },
    'opportunity_assessment_workspace': {
      title: 'Draft Opportunity Assessment',
      desc: 'Auto-generate from Product Strategy',
      action: draftOpportunityAssessmentFromStrategy
    },
    'prioritization_workspace': {
      title: 'Draft Prioritization',
      desc: 'Auto-generate from Opportunity Assessment',
      action: draftPrioritizationFromOpportunities
    },
    'solution_design_workspace': {
      title: 'Draft Solution Design',
      desc: 'Auto-generate from Prioritization',
      action: draftSolutionDesignFromPrioritization
    },
    'solution_validation_workspace': {
      title: 'Draft Validation & Experimentation',
      desc: 'Auto-generate from Solution Design',
      action: draftValidationFromSolutionDesign
    },
    'product_requirements_document': {
      title: 'Draft PRD',
      desc: 'Auto-generate from Validation Plan',
      action: draftPrdFromValidation
    },
    'product_roadmap_document': {
      title: 'Draft Product Roadmap',
      desc: 'Auto-generate from PRD',
      action: draftRoadmapFromPrd
    }
  }

  const mapping = chainMapping[documentType]

  if (!mapping) return null

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    setIsGenerating(true)
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
        await recordUsage('generations')
        onShowToast('success', `⚡ Successfully generated from upstream context!`)
      } else {
        onShowToast('error', res.error || 'Failed to generate from upstream document.')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during generation.')
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
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
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
          </div>
        </div>
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
