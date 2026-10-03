import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generatePrdFromRoadmapItem, generateWbsFromPrd } from '@/lib/product-roadmap/ai-generation-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

export function useAiGeneration(
  projectId: string,
  organizationId: string,
  onGenerationComplete: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null)
  const router = useRouter()
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGeneratePrd = useCallback(async (itemId: string) => {
    if (generatingItemId || isChecking) return
    
    // 1. Check Limits
    const hasLimit = await checkLimit('max_ai_generations')
    if (!hasLimit) return // checkLimit will show the UpgradeModal internally

    setGeneratingItemId(itemId)
    showToast('AI is generating the Solution Design from the Roadmap...', 'info')
    
    try {
      const { success, error } = await generatePrdFromRoadmapItem(projectId, itemId)
      if (success) {
        // 2. Record Usage
        await recordUsage('generations')
        showToast('Solution Design successfully generated!', 'success')
        router.refresh()
        onGenerationComplete()
      } else {
        showToast('Failed to generate Solution Design: ' + error, 'error')
      }
    } catch (e: any) {
      showToast('An unexpected error occurred.', 'error')
    } finally {
      setGeneratingItemId(null)
    }
  }, [projectId, generatingItemId, isChecking, checkLimit, recordUsage, onGenerationComplete, showToast])

  return {
    generatingItemId,
    handleGeneratePrd,
    UpgradePromptModalProps
  }
}
