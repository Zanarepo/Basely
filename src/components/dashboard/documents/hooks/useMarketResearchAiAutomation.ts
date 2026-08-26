import { useState } from 'react'
import { draftMarketResearchFromBusinessCase, synthesizeStrategyFromResearch, draftCompetitiveSpecFromMatrix } from '@/lib/documents/ai-chain-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

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
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleSynthesizeStrategy = async () => {
    if (isSynthesizingStrategy || isChecking) return
    setIsSynthesizingStrategy(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const res = await synthesizeStrategyFromResearch(projectId, freeText)
      if (res.ok) {
        setIsStrategyDone(true)
        await recordUsage('generations')
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
    if (isDraftingMarketResearch || isChecking) return
    setIsDraftingMarketResearch(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const res = await draftMarketResearchFromBusinessCase(projectId, organizationId, templateId)
      if (res.ok && res.data) {
        if (onGenerated) {
          onGenerated(res.data)
        }
        setIsMarketResearchDone(true)
        await recordUsage('generations')
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
    if (isDraftingCompetitiveSpec || isChecking) return
    setIsDraftingCompetitiveSpec(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const res = await draftCompetitiveSpecFromMatrix(projectId, organizationId)
      if (res.ok && res.data) {
        if (onGenerated) {
          onGenerated(res.data)
        }
        setIsCompetitiveSpecDone(true)
        await recordUsage('generations')
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
    UpgradePromptModalProps,
  }
}
