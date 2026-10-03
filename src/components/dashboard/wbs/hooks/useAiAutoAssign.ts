import { useState } from 'react'
import { suggestAssigneeWithAiAction } from '@/lib/wbs/ai-assignment-actions'
import { assignRaciRole } from '@/lib/wbs/raci-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'

interface UseAiAutoAssignProps {
  organizationId: string
  projectId: string
  wbsElementId: string
  tier: string
  aiEnabled: boolean
  onAssignmentChanged?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useAiAutoAssign({
  organizationId,
  projectId,
  wbsElementId,
  tier,
  aiEnabled,
  onAssignmentChanged,
  onShowToast
}: UseAiAutoAssignProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<{ rationale: string; id: string } | null>(null)
  
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleAiSuggest = async () => {
    if (isGenerating || isChecking) return
    
    setIsGenerating(true)
    setSuggestion(null)

    const allowed = await checkLimit('max_ai_basic_actions')
    if (!allowed) {
      setIsGenerating(false)
      return
    }
    try {
      const res = await suggestAssigneeWithAiAction(organizationId, projectId, wbsElementId)
      if (!res.ok || !res.data) {
        onShowToast('error', res.error || 'Failed to generate Praz-AI suggestion.')
        setIsGenerating(false)
        return
      }

      setSuggestion({ rationale: res.data.rationale, id: res.data.suggestedResponsibleId })
      
      // Auto apply as Responsible
      const applyRes = await assignRaciRole(projectId, wbsElementId, res.data.suggestedResponsibleId, 'Responsible')
      if (!applyRes.ok) {
        onShowToast('error', applyRes.error || 'Failed to apply the suggested role.')
      } else {
        // Also apply others if provided
        if (res.data.suggestedAccountableId && res.data.suggestedAccountableId !== res.data.suggestedResponsibleId) {
          await assignRaciRole(projectId, wbsElementId, res.data.suggestedAccountableId, 'Accountable')
        }
        if (res.data.suggestedConsultedIds) {
          for (const id of res.data.suggestedConsultedIds) {
            await assignRaciRole(projectId, wbsElementId, id, 'Consulted')
          }
        }
        if (res.data.suggestedInformedIds) {
          for (const id of res.data.suggestedInformedIds) {
            await assignRaciRole(projectId, wbsElementId, id, 'Informed')
          }
        }

        onShowToast('success', 'Praz-AI successfully suggested and applied RACI assignments.')
        await recordUsage('basic_actions')
        if (onAssignmentChanged) onAssignmentChanged()
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'Unknown error occurred.')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    suggestion,
    handleAiSuggest,
    UpgradePromptModalProps
  }
}
