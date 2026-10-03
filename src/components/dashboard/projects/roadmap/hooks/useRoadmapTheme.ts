import { useState } from 'react'
import { updateRoadmapTheme } from '@/lib/product-roadmap/actions'
import { RoadmapItem } from '@/lib/product-roadmap/types'

export function useRoadmapTheme(
  items: RoadmapItem[],
  setItems: React.Dispatch<React.SetStateAction<RoadmapItem[]>>,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) {
  const [updatingThemeId, setUpdatingThemeId] = useState<string | null>(null)

  const handleThemeChange = async (itemId: string, newTheme: string) => {
    // Optimistic update
    const previousItems = [...items]
    const updatedTheme = newTheme === 'Uncategorized' ? null : newTheme
    
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, theme: updatedTheme } : i))
    setUpdatingThemeId(itemId)
    
    const { success, error } = await updateRoadmapTheme(itemId, updatedTheme)
    
    if (success) {
      showToast(`Theme updated to ${newTheme}`, 'success')
    } else {
      showToast('Failed to update theme: ' + error, 'error')
      setItems(previousItems)
    }
    
    setUpdatingThemeId(null)
  }

  return {
    updatingThemeId,
    handleThemeChange
  }
}
