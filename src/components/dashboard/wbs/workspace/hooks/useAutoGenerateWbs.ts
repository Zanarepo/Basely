import { useState } from 'react'
import { generateWbsFromScope, generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'

interface UseAutoGenerateWbsProps {
  projectId: string
  organizationId: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSuccess: () => void
}

export function useAutoGenerateWbs({
  projectId,
  organizationId,
  onShowToast,
  onSuccess
}: UseAutoGenerateWbsProps) {
  const [isGeneratingWbs, setIsGeneratingWbs] = useState(false)

  const handleAutoGenerateWbs = async () => {
    setIsGeneratingWbs(true)
    try {
      const res = await generateWbsFromScope(projectId, organizationId)
      
      if (res.success) {
        onSuccess()
        onShowToast('success', 'WBS successfully generated from Scope Statement!')
      } else {
        onShowToast('error', res.error || 'Failed to auto-generate WBS.')
      }
    } catch (error: any) {
      console.error(error)
      onShowToast('error', error.message || 'An unexpected error occurred.')
    } finally {
      setIsGeneratingWbs(false)
    }
  }

  const handleAutoGenerateBacklogFromPrd = async () => {
    setIsGeneratingWbs(true)
    try {
      const res = await generateBacklogFromPrdAndRoadmap(projectId, organizationId)
      
      if (res.success) {
        onSuccess()
        onShowToast('success', 'Execution Backlog successfully generated from PRD!')
      } else {
        onShowToast('error', res.error || 'Failed to auto-generate Backlog.')
      }
    } catch (error: any) {
      console.error(error)
      onShowToast('error', error.message || 'An unexpected error occurred.')
    } finally {
      setIsGeneratingWbs(false)
    }
  }

  return {
    isGeneratingWbs,
    handleAutoGenerateWbs,
    handleAutoGenerateBacklogFromPrd
  }
}
