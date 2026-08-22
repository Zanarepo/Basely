import { useState } from 'react'
import { generateScopeFromCharter } from '@/lib/documents/scope-actions'
import { DocumentTemplate } from '@/lib/documents/types'

interface UseAutoGenerateScopeProps {
  projectId: string
  organizationId: string
  template: DocumentTemplate
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onGenerated: (data: Record<string, string>) => void
}

export function useAutoGenerateScope({
  projectId,
  organizationId,
  template,
  onShowToast,
  onGenerated
}: UseAutoGenerateScopeProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    try {
      // Use the active template ID or fallback to standard
      const templateId = template?.id || 'standard_scope_statement'
      
      const res = await generateScopeFromCharter(projectId, organizationId, templateId)
      
      if (res.success && res.data) {
        onGenerated(res.data)
        onShowToast('success', 'Scope Statement successfully generated from Project Charter!')
      } else {
        onShowToast('error', res.error || 'Failed to auto-generate Scope Statement.')
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
