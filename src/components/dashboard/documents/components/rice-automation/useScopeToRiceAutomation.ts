import { useState } from 'react'
import { GeneratedRiceItem } from '@/lib/documents/prd-to-rice-actions'
import { convertScopeToRiceBacklog } from '@/lib/documents/scope-to-rice-actions'

interface UseScopeToRiceAutomationProps {
  projectId: string
  organizationId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function useScopeToRiceAutomation({
  projectId,
  organizationId,
  freeText,
  onShowToast,
}: UseScopeToRiceAutomationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<GeneratedRiceItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleGenerateRiceBacklog = async () => {
    if (!freeText || Object.keys(freeText).length === 0) {
      onShowToast('error', 'Scope Statement is empty. Generate or write it first.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await convertScopeToRiceBacklog(projectId, organizationId, freeText)
      if (res.ok && res.items) {
        setGeneratedItems(res.items)
        setIsModalOpen(true)
        onShowToast('success', `Successfully generated ${res.items.length} backlog epics/features!`)
      } else {
        onShowToast('error', res.error || 'Failed to generate RICE backlog items.')
      }
    } catch (err: any) {
      console.error(err)
      onShowToast('error', err.message || 'An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    generatedItems,
    isModalOpen,
    setIsModalOpen,
    handleGenerateRiceBacklog
  }
}
