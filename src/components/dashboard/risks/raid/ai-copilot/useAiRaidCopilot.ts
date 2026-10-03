import { useState } from 'react'
import { predictRaidRisks, PredictedRaidEntry } from '@/lib/raid/ai-raid-actions'
import { upsertRaidEntry } from '@/lib/raid/actions'

interface UseAiRaidCopilotProps {
  projectId: string
  organizationId: string
  onComplete: () => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function useAiRaidCopilot({ projectId, organizationId, onComplete, onShowToast }: UseAiRaidCopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [predictions, setPredictions] = useState<PredictedRaidEntry[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  const handleOpen = async () => {
    setIsPredicting(true)
    setPredictions([])
    setSelectedIndices(new Set())
    
    try {
      const res = await predictRaidRisks(projectId, organizationId)
      if (res.ok && res.data) {
        setPredictions(res.data)
        // Auto-select all by default
        setSelectedIndices(new Set(res.data.map((_, i) => i)))
        onShowToast('success', 'Analysis complete. Review predictions.')
        setIsOpen(true) // Open modal only on success
      } else {
        onShowToast('error', res.error || 'Failed to predict RAID risks.')
      }
    } catch (e: any) {
      onShowToast('error', e.message || 'An error occurred during prediction.')
    } finally {
      setIsPredicting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCommit = async () => {
    if (selectedIndices.size === 0) return
    setIsSaving(true)
    
    const selectedPredictions = Array.from(selectedIndices).map(i => predictions[i])
    
    try {
      // Use Promise.all to save concurrently for instant feel
      await Promise.all(
        selectedPredictions.map(pred => 
          upsertRaidEntry({
            organization_id: organizationId,
            project_id: projectId,
            category: pred.category,
            title: pred.title,
            description: pred.description,
            status: 'open',
            priority: pred.priority,
            impact_rating: pred.impact_rating,
            probability_rating: pred.probability_rating,
            mitigation_plan: pred.mitigation_plan,
            linked_wbs_element_id: pred.linked_wbs_element_id
          })
        )
      )
      
      onShowToast('success', `Added ${selectedPredictions.length} predictive items to the RAID log.`)
      setIsOpen(false)
      onComplete()
    } catch (error: any) {
      onShowToast('error', 'Failed to save some predictions.')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isOpen,
    isPredicting,
    isSaving,
    predictions,
    selectedIndices,
    handleOpen,
    handleClose,
    toggleSelection,
    handleCommit
  }
}
