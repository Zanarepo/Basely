'use client'

import { useState } from 'react'
import { convertPrdToRiceBacklog, GeneratedRiceItem } from '@/lib/documents/prd-to-rice-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

interface UsePrdToRiceAutomationProps {
  projectId: string
  organizationId: string
  freeText: Record<string, string>
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function usePrdToRiceAutomation({
  projectId,
  organizationId,
  freeText,
  onShowToast,
}: UsePrdToRiceAutomationProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<GeneratedRiceItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { checkFeature, checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerateRiceBacklog = async () => {
    if (isGenerating || isChecking) return
    setIsGenerating(true)
    try {
      const allowed = await checkFeature('ai.advanced_prioritization')
      if (!allowed) return

      const withinLimit = await checkLimit('max_ai_generations')
      if (!withinLimit) return

      const res = await convertPrdToRiceBacklog(projectId, organizationId, freeText)

      if (res.ok && res.items) {
        await recordUsage('generations')
        setGeneratedItems(res.items)
        setIsModalOpen(true)
        onShowToast('success', `Praz-AI generated ${res.count} RICE Backlog items!`)
      } else {
        onShowToast('error', res.error || 'Failed to convert PRD to RICE backlog.')
      }
    } catch (err: any) {
      console.error('[PRD to RICE Hook Error]:', err)
      onShowToast('error', err.message || 'An error occurred during backlog generation.')
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
    UpgradePromptModalProps,
  }
}
