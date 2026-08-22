import { useState } from 'react'
import { generateRisksFromDocuments } from '@/lib/risks/ai-risk-actions'

interface UseAiGenerateRisksProps {
  organizationId: string
  projectId: string
  tier: string
  aiEnabled: boolean
  onSuccess?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useAiGenerateRisks({
  organizationId,
  projectId,
  tier,
  aiEnabled,
  onSuccess,
  onShowToast
}: UseAiGenerateRisksProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateRisks = async () => {
    setIsGenerating(true)
    onShowToast('info', 'Praz-AI is cross-referencing your Charter and Scope Statement...')

    try {
      const res = await generateRisksFromDocuments(projectId, organizationId)
      if (!res.ok || !res.data) {
        onShowToast('error', res.error || 'Failed to detect risks.')
        setIsGenerating(false)
        return
      }
      
      onShowToast('success', `Praz-AI identified and added ${res.data.length} potential risks!`)
      if (onSuccess) onSuccess()
      
    } catch (err: any) {
      onShowToast('error', err.message || 'Unknown error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Tier gating logic
  const isEnterprise = tier === 'enterprise'
  const isPremium = tier === 'premium'
  const isAllowed = isEnterprise || (isPremium && aiEnabled)
  const isFree = tier === 'free'

  return {
    isGenerating,
    handleGenerateRisks,
    isAllowed,
    isFree,
    isPremium
  }
}
