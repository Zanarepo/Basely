import { useState } from 'react'
import { draftMarketResearchFromBusinessCase, synthesizeStrategyFromResearch, draftCompetitiveSpecFromMatrix } from '@/lib/documents/ai-chain-actions'

interface UseMarketResearchAiAutomationProps {
  projectId: string
  organizationId: string
  templateId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
}

export function useMarketResearchAiAutomation({
  projectId,
  organizationId,
  templateId,
  freeText,
  onShowToast,
  onGenerated,
}: UseMarketResearchAiAutomationProps) {
  const [isSynthesizingStrategy, setIsSynthesizingStrategy] = useState(false)
  const [isDraftingMarketResearch, setIsDraftingMarketResearch] = useState(false)
  const [isStrategyDone, setIsStrategyDone] = useState(false)
  const [isMarketResearchDone, setIsMarketResearchDone] = useState(false)
  const [isDraftingCompetitiveSpec, setIsDraftingCompetitiveSpec] = useState(false)
  const [isCompetitiveSpecDone, setIsCompetitiveSpecDone] = useState(false)

  const handleSynthesizeStrategy = async () => {
    setIsSynthesizingStrategy(true)
    try {
      const res = await synthesizeStrategyFromResearch(projectId, freeText)
      if (res.ok) {
        setIsStrategyDone(true)
        onShowToast(
          'success',
          '⚡ Product Strategy synthesized! Switch to Product Strategy in the sidebar to review.'
        )
      } else {
        onShowToast('error', res.error || 'Failed to synthesize Product Strategy')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during synthesis.')
    } finally {
      setIsSynthesizingStrategy(false)
    }
  }

  const handleDraftMarketResearch = async () => {
    setIsDraftingMarketResearch(true)
    try {
      const res = await draftMarketResearchFromBusinessCase(projectId, organizationId, templateId)
      if (res.ok && res.data) {
        if (onGenerated) {
          onGenerated(res.data)
        }
        setIsMarketResearchDone(true)
        onShowToast('success', '⚡ Market Research drafted from Business Case/Feasibility Study!')
      } else {
        onShowToast('error', res.error || 'Failed to draft Market Research')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during drafting.')
    } finally {
      setIsDraftingMarketResearch(false)
    }
  }

  const handleDraftCompetitiveSpec = async () => {
    setIsDraftingCompetitiveSpec(true)
    try {
      const res = await draftCompetitiveSpecFromMatrix(projectId, organizationId)
      if (res.ok && res.data) {
        if (onGenerated) {
          onGenerated(res.data)
        }
        setIsCompetitiveSpecDone(true)
        onShowToast('success', '⚡ Competitive Spec drafted from Matrix!')
      } else {
        onShowToast('error', res.error || 'Failed to draft Competitive Spec')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during drafting.')
    } finally {
      setIsDraftingCompetitiveSpec(false)
    }
  }

  return {
    isSynthesizingStrategy,
    isDraftingMarketResearch,
    isStrategyDone,
    isMarketResearchDone,
    isDraftingCompetitiveSpec,
    isCompetitiveSpecDone,
    handleSynthesizeStrategy,
    handleDraftMarketResearch,
    handleDraftCompetitiveSpec,
  }
}
