import { useState } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'

export function useWbsHistory(
  elements: WbsElement[],
  setElements: React.Dispatch<React.SetStateAction<WbsElement[]>>,
  recalculateClientCodes: (list: WbsElement[]) => WbsElement[],
  syncStateToDatabase: (list: WbsElement[]) => void,
  showToast: (type: 'info', msg: string) => void
) {
  const [undoStack, setUndoStack] = useState<WbsElement[][]>([])
  const [redoStack, setRedoStack] = useState<WbsElement[][]>([])

  const saveSnapshot = (currentState: WbsElement[]) => {
    const clone = JSON.parse(JSON.stringify(currentState))
    setUndoStack((prev) => [...prev.slice(-19), clone]) // limit to 20 states
    setRedoStack([])
  }

  const saveSnapshotForRedo = (currentState: WbsElement[]) => {
    const clone = JSON.parse(JSON.stringify(currentState))
    setRedoStack((prev) => [...prev, clone])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]!
    const nextUndo = undoStack.slice(0, -1)

    saveSnapshotForRedo(elements)
    setUndoStack(nextUndo)

    const updated = recalculateClientCodes(prev)
    setElements(updated)
    syncStateToDatabase(updated)
    showToast('info', 'Undo completed')
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]!
    const nextRedo = redoStack.slice(0, -1)

    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(elements))])
    setRedoStack(nextRedo)

    const updated = recalculateClientCodes(next)
    setElements(updated)
    syncStateToDatabase(updated)
    showToast('info', 'Redo completed')
  }

  return {
    undoStack,
    redoStack,
    saveSnapshot,
    handleUndo,
    handleRedo
  }
}
