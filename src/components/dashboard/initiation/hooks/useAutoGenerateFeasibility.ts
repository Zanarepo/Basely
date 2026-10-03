import { useState, useTransition } from 'react'
import { autoGenerateFeasibilityStudy, FeasibilityAiSuggestion } from '@/lib/initiation/ai-actions'

interface UseAutoGenerateFeasibilityProps {
  organizationId: string
  onSuggestionReceived: (suggestion: FeasibilityAiSuggestion) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function useAutoGenerateFeasibility({
  organizationId,
  onSuggestionReceived,
  onShowToast
}: UseAutoGenerateFeasibilityProps) {
  const [isGenerating, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAutoGenerate = (businessCaseId: string) => {
    if (!businessCaseId) {
      onShowToast('error', 'Please select a Business Case first.')
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await autoGenerateFeasibilityStudy(businessCaseId, organizationId)
      
      if (res.success && res.data) {
        onSuggestionReceived(res.data)
        onShowToast('success', 'AI suggestions populated successfully.')
      } else {
        const errMsg = res.error || 'Failed to generate suggestions.'
        setError(errMsg)
        onShowToast('error', errMsg)
      }
    })
  }

  return {
    isGenerating,
    error,
    handleAutoGenerate
  }
}
