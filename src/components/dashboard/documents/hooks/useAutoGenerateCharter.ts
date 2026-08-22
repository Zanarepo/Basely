import { useState } from 'react'
import { generateCharterFromInitiation } from '@/lib/documents/charter-actions'
import { DocumentTemplate } from '@/lib/documents/types'

interface UseAutoGenerateCharterProps {
  projectId: string
  organizationId: string
  template: DocumentTemplate
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated: (data: Record<string, string>) => void
}

export function useAutoGenerateCharter({
  projectId,
  organizationId,
  template,
  onShowToast,
  onGenerated
}: UseAutoGenerateCharterProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    try {
      // Use the active template ID or fallback to the enterprise default
      const templateId = template?.id || 'enterprise_project_charter'
      
      const res = await generateCharterFromInitiation(projectId, organizationId, templateId)
      
      if (res.success && res.data) {
        onGenerated(res.data)
        onShowToast('success', 'Project Charter successfully generated from Initiation documents!')
      } else {
        onShowToast('error', res.error || 'Failed to auto-generate charter.')
      }
    } catch (error: any) {
      console.error(error)
      onShowToast('error', error.message || 'An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    handleAutoGenerate
  }
}
