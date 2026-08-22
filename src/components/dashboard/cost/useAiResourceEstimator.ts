import { useState } from 'react'
import { generateResourceEstimates } from '@/lib/cost/ai-resource-actions'

export function useAiResourceEstimator(projectId: string, onComplete?: () => void) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async () => {
    setIsGenerating(true)
    try {
      const res = await generateResourceEstimates(projectId)
      if (res.success) {
        if (onComplete) onComplete()
      } else {
        alert(res.error || 'Automation Failed')
      }
    } catch (error: any) {
      alert(error.message || 'Automation Failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
