import { useState, useCallback } from 'react'
import { updateRoadmapHorizon } from '@/lib/product-roadmap/actions'
import { Horizon } from '@/lib/product-roadmap/constants'

export function useRoadmapDnD(
  items: any[], 
  setItems: React.Dispatch<React.SetStateAction<any[]>>,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverHorizon, setDragOverHorizon] = useState<Horizon | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, horizon: Horizon | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverHorizon !== horizon) setDragOverHorizon(horizon)
  }

  const handleDragLeave = () => {
    setDragOverHorizon(null)
  }

  const handleDrop = async (e: React.DragEvent, targetHorizon: Horizon) => {
    e.preventDefault()
    setDragOverHorizon(null)
    
    if (!draggedItemId) return
    const itemId = draggedItemId
    setDraggedItemId(null)
    
    const itemToMove = items.find(i => i.id === itemId)
    if (!itemToMove || itemToMove.horizon === targetHorizon) return
    
    // Optimistic update
    const previousItems = [...items]
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, horizon: targetHorizon } : i))
    
    // Background API call
    const { success, error } = await updateRoadmapHorizon(itemId, targetHorizon)
    if (success) {
      showToast(`Moved to ${targetHorizon}`, 'success')
    } else {
      showToast('Failed to move item: ' + error, 'error')
      setItems(previousItems) // Revert on failure
    }
  }

  return {
    draggedItemId,
    dragOverHorizon,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
