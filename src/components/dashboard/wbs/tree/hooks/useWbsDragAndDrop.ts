import { useState, useRef } from 'react'

export type DropPosition = 'before' | 'after' | 'inside' | null

interface UseWbsDragAndDropProps {
  elementId: string
  hasEditAccess: boolean
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
  onMove: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
}

export function useWbsDragAndDrop({
  elementId,
  hasEditAccess,
  draggedNodeId,
  setDraggedNodeId,
  onMove
}: UseWbsDragAndDropProps) {
  const [dropPosition, setDropPosition] = useState<DropPosition>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent) => {
    if (!hasEditAccess) {
      e.preventDefault()
      return
    }
    setDraggedNodeId(elementId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', elementId)
  }

  const handleDragEnd = () => {
    setDraggedNodeId(null)
    setDropPosition(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasEditAccess || !draggedNodeId || draggedNodeId === elementId) {
      return
    }

    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (!rowRef.current) return

    const rect = rowRef.current.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const height = rect.height

    if (relativeY < height / 4) {
      setDropPosition('before')
    } else if (relativeY > (height * 3) / 4) {
      setDropPosition('after')
    } else {
      setDropPosition('inside')
    }
  }

  const handleDragLeave = () => {
    setDropPosition(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!hasEditAccess || !draggedNodeId || draggedNodeId === elementId || !dropPosition) {
      return
    }

    onMove(draggedNodeId, elementId, dropPosition)
    setDropPosition(null)
    setDraggedNodeId(null)
  }

  return {
    dropPosition,
    rowRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
