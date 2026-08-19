import { useState } from 'react'
import { generateOkrsFromStrategy } from '@/lib/documents/ai-chain-actions'

export function useGenerateOkrs(
  organizationId: string, 
  projectId: string, 
  onSuccess: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    showToast('Praz-AI is analyzing Strategy Canvas to generate OKRs...', 'info')
    
    try {
      const { ok, error } = await generateOkrsFromStrategy(projectId, organizationId)
      
      if (ok) {
        showToast('Strategic OKRs successfully generated!', 'success')
        onSuccess()
      } else {
        showToast(error || 'Failed to generate OKRs', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, handleGenerate }
}
