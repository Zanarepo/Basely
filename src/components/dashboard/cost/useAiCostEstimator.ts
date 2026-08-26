import { useState } from 'react'
import { generateCostEstimates } from '@/lib/cost/ai-estimation-actions'
import { toast } from 'sonner'

export function useAiCostEstimator(projectId: string, onComplete?: () => void) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async () => {
    setIsGenerating(true)
    try {
      const res = await generateCostEstimates(projectId)
      if (res.success) {
        toast.success('Cost estimates generated successfully.')
        if (onComplete) onComplete()
      } else {
        toast.error(res.error || 'Automation Failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Automation Failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return { generate, isGenerating }
}
