import { useState } from 'react'
import { generateNorthStarFromStrategy } from '@/lib/documents/ai-chain-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

export function useGenerateNorthStar(
  organizationId: string, 
  projectId: string, 
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerate = async () => {
    if (isGenerating || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    showToast('Praz-AI is analyzing Strategy Canvas to generate North Star metrics...', 'info')
    
    try {
      const { ok, error } = await generateNorthStarFromStrategy(projectId, organizationId)
      
      if (ok) {
        await recordUsage('generations')
        showToast('North Star Metrics & Growth Levers successfully generated!', 'success')
        onSuccess()
      } else {
        showToast(error || 'Failed to generate metrics', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, handleGenerate, UpgradePromptModalProps }
}
