import { useState } from 'react'
import { generateNorthStarFromStrategy } from '@/lib/documents/ai-chain-actions'

export function useGenerateNorthStar(
  organizationId: string, 
  projectId: string, 
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    showToast('Praz-AI is analyzing Strategy Canvas to generate North Star metrics...', 'info')
    
    try {
      const { ok, error } = await generateNorthStarFromStrategy(projectId, organizationId)
      
      if (ok) {
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

  return { isGenerating, handleGenerate }
}
