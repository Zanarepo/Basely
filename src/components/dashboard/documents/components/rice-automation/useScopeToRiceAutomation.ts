import { useState } from 'react'
import { GeneratedRiceItem } from '@/lib/documents/prd-to-rice-actions'
import { convertScopeToRiceBacklog } from '@/lib/documents/scope-to-rice-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

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
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerateRiceBacklog = async () => {
    if (isGenerating || isChecking) return

    if (!freeText || Object.keys(freeText).length === 0) {
      onShowToast('error', 'Scope Statement is empty. Generate or write it first.')
      return
    }

    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    try {
      const res = await convertScopeToRiceBacklog(projectId, organizationId, freeText)
      if (res.ok && res.items) {
        setGeneratedItems(res.items)
        setIsModalOpen(true)
        await recordUsage('generations')
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
    handleGenerateRiceBacklog,
    UpgradePromptModalProps
  }
}
