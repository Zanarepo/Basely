import { useState } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'

export function useWbsNodeRename(element: WbsElement, onRename: (id: string, newName: string) => void) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(element.name)

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(element.name)
  }

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== element.name) {
      onRename(element.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(element.name)
    }
  }

  return {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    handleStartRename,
    handleSaveRename,
    handleKeyDown
  }
}
