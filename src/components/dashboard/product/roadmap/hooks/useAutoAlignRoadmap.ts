import { useState } from 'react'
import { autoAlignRoadmapToOkrs } from '@/lib/documents/ai-chain-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

export function useAutoAlignRoadmap(
  projectId: string,
  organizationId: string,
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [isAligning, setIsAligning] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleAlign = async () => {
    if (isAligning || isChecking) return

    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsAligning(true)
    showToast('Praz-AI is mapping Orphaned Initiatives to Strategic OKRs...', 'info')
    
    try {
      const { ok, alignedCount, error } = await autoAlignRoadmapToOkrs(projectId)
      
      if (ok) {
        await recordUsage('generations')
        if (alignedCount && alignedCount > 0) {
          showToast(`Successfully aligned ${alignedCount} initiatives!`, 'success')
        } else {
          showToast('All items are already aligned or no logical matches were found.', 'info')
        }
        onSuccess()
      } else {
        showToast(error || 'Failed to align roadmap', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setIsAligning(false)
    }
  }

  return { isAligning, handleAlign, UpgradePromptModalProps }
}
