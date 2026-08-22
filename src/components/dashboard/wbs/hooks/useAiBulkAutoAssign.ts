import { useState } from 'react'
import { bulkSuggestRaciAssignments } from '@/lib/wbs/ai-assignment-actions'
import { replaceResponsibleRole, replaceAccountableRole, assignRaciRole } from '@/lib/wbs/raci-actions'

interface UseAiBulkAutoAssignProps {
  organizationId: string
  projectId: string
  wbsElementIds: string[]
  tier: string
  aiEnabled: boolean
  onAssignmentsCompleted?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useAiBulkAutoAssign({
  organizationId,
  projectId,
  wbsElementIds,
  tier,
  aiEnabled,
  onAssignmentsCompleted,
  onShowToast
}: UseAiBulkAutoAssignProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleBulkAiSuggest = async () => {
    if (wbsElementIds.length === 0) {
      onShowToast('info', 'No unassigned work packages to process.')
      return
    }

    setIsGenerating(true)
    onShowToast('info', `Praz-AI is analyzing skills for ${wbsElementIds.length} tasks...`)

    try {
      const res = await bulkSuggestRaciAssignments(organizationId, projectId, wbsElementIds)
      if (!res.ok || !res.data) {
        onShowToast('error', res.error || 'Failed to generate bulk Praz-AI assignments.')
        setIsGenerating(false)
        return
      }

      onShowToast('info', 'Applying RACI assignments to the matrix...')

      let successCount = 0
      // Apply the generated assignments
      for (const suggestion of res.data) {
        if (suggestion.suggestedResponsibleId) {
          const applyRes = await replaceResponsibleRole(projectId, suggestion.wbsElementId, suggestion.suggestedResponsibleId)
          if (applyRes.ok) successCount++
        }
        if (suggestion.suggestedAccountableId && suggestion.suggestedAccountableId !== suggestion.suggestedResponsibleId) {
          await replaceAccountableRole(projectId, suggestion.wbsElementId, suggestion.suggestedAccountableId)
        }
        if (suggestion.suggestedConsultedIds) {
          for (const id of suggestion.suggestedConsultedIds) {
            await assignRaciRole(projectId, suggestion.wbsElementId, id, 'Consulted')
          }
        }
        if (suggestion.suggestedInformedIds) {
          for (const id of suggestion.suggestedInformedIds) {
            await assignRaciRole(projectId, suggestion.wbsElementId, id, 'Informed')
          }
        }
      }
      
      onShowToast('success', `Praz-AI successfully auto-assigned ${successCount} tasks!`)
      if (onAssignmentsCompleted) onAssignmentsCompleted()
      
    } catch (err: any) {
      onShowToast('error', err.message || 'Unknown error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Same gating logic as ADR
  const isEnterprise = tier === 'enterprise'
  const isPremium = tier === 'premium'
  const isAllowed = isEnterprise || (isPremium && aiEnabled)
  const isFree = tier === 'free'

  return {
    isGenerating,
    handleBulkAiSuggest,
    isAllowed,
    isFree,
    isPremium
  }
}
