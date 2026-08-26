import { useState } from 'react'
import { synthesizeRoadmapFromStrategy, synthesizeStrategyFromCharterAndScope } from '@/lib/documents/ai-chain-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

interface UseStrategyAiAutomationProps {
  projectId: string
  organizationId: string
  templateId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated?: (data: any) => void
}

export function useStrategyAiAutomation({
  projectId,
  organizationId,
  templateId,
  freeText,
  onShowToast,
  onGenerated
}: UseStrategyAiAutomationProps) {
  const [isSynthesizingRoadmap, setIsSynthesizingRoadmap] = useState(false)
  const [isDraftingStrategy, setIsDraftingStrategy] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleSynthesizeRoadmap = async () => {
    if (isSynthesizingRoadmap || isChecking) return
    setIsSynthesizingRoadmap(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const res = await synthesizeRoadmapFromStrategy(projectId, freeText)
      if (res.ok) {
        setIsDone(true)
        await recordUsage('generations')
        onShowToast(
          'success',
          '⚡ Product Roadmap generated! Switch to Product Roadmap in the sidebar to view Now/Next/Later horizons.'
        )
      } else {
        onShowToast('error', res.error || 'Failed to generate Product Roadmap')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred during synthesis.')
    } finally {
      setIsSynthesizingRoadmap(false)
    }
  }

  const handleDraftStrategy = async () => {
    if (isDraftingStrategy || isChecking) return
    setIsDraftingStrategy(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const res = await synthesizeStrategyFromCharterAndScope(projectId, organizationId, templateId)
      if (res.ok && res.data) {
        setIsDone(true)
        if (onGenerated) {
          onGenerated(res.data)
        }
        await recordUsage('generations')
        onShowToast(
          'success',
          '✨ Product Strategy drafted successfully! Please review and save.'
        )
      } else {
        onShowToast('error', res.error || 'Failed to draft Product Strategy.')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', 'An unexpected error occurred while drafting strategy.')
    } finally {
      setIsDraftingStrategy(false)
    }
  }

  return {
    isSynthesizingRoadmap,
    isDraftingStrategy,
    isDone,
    handleSynthesizeRoadmap,
    handleDraftStrategy,
    UpgradePromptModalProps
  }
}
