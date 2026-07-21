import { useState } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'

interface UseBoardDragAndDropProps {
  elements: WbsElement[]
  taskOrders: Record<string, string[]>
  hasEditAccess: boolean
  callerRole?: string
  callerUserId?: string
  reorderColumn: (sourceIndex: number, targetIndex: number) => void
  moveTask: (taskId: string, sourceCol: string, targetCol: string, targetIndex: number) => void
  onStatusChange: (id: string, newStatus: string) => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useBoardDragAndDrop({
  elements,
  taskOrders,
  hasEditAccess,
  callerRole,
  callerUserId,
  reorderColumn,
  moveTask,
  onStatusChange,
  onShowToast
}: UseBoardDragAndDropProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null)
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null)

  // Column Drag Handlers
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    if (!hasEditAccess) return
    setDraggedColIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('colIndex', index.toString())
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    if (!hasEditAccess || draggedColIndex === null) return
    e.preventDefault()
    if (draggedColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverColIndex(null)
    setDraggedColIndex(null)
    const sourceStr = e.dataTransfer.getData('colIndex')
    if (sourceStr) {
      const sourceIndex = parseInt(sourceStr, 10)
      if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
        reorderColumn(sourceIndex, targetIndex)
      }
    }
  }

  // Task Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceCol: string) => {
    const task = elements.find((el) => el.id === taskId)
    const isResponsible = callerRole === 'Team Member' && task?.raciAssignments?.some((a) => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId)
    const canDragTask = hasEditAccess || isResponsible

    if (!canDragTask) {
      e.preventDefault()
      return
    }

    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.setData('sourceCol', sourceCol)
  }

  const handleDragOverColumn = (e: React.DragEvent) => {
    if (!draggedTaskId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOverTask = (e: React.DragEvent, targetTaskId: string) => {
    if (!draggedTaskId) return
    e.preventDefault()
    e.stopPropagation() // Prevent column drag over
    e.dataTransfer.dropEffect = 'move'
    if (draggedTaskId !== targetTaskId) {
      setDragOverTaskId(targetTaskId)
    }
  }

  const handleDragLeaveTask = (e: React.DragEvent) => {
    setDragOverTaskId(null)
  }

  const handleDropOnColumn = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDragOverTaskId(null)
    if (!draggedTaskId) return
    
    const sourceCol = e.dataTransfer.getData('sourceCol')
    const task = elements.find((t) => t.id === draggedTaskId)
    
    if (task) {
      const hasResponsible = task.raciAssignments?.some((a) => a.roleType === 'Responsible')
      if (!hasResponsible && sourceCol === 'Not Started' && targetStatus !== 'Not Started') {
        onShowToast?.('info', 'Please assign a Responsible person before starting work.')
        setDraggedTaskId(null)
        return
      }

      const targetIndex = taskOrders[targetStatus] ? taskOrders[targetStatus].length : 0
      moveTask(draggedTaskId, sourceCol, targetStatus, targetIndex)
      
      if (task.status !== targetStatus) {
        onStatusChange(draggedTaskId, targetStatus)
      }
    }
    setDraggedTaskId(null)
  }

  const handleDropOnTask = (e: React.DragEvent, targetTaskId: string, targetStatus: string) => {
    e.preventDefault()
    e.stopPropagation() // Prevent column drop
    setDragOverTaskId(null)
    if (!draggedTaskId) return
    
    const sourceCol = e.dataTransfer.getData('sourceCol')
    const task = elements.find((t) => t.id === draggedTaskId)
    
    if (task) {
      const hasResponsible = task.raciAssignments?.some((a) => a.roleType === 'Responsible')
      if (!hasResponsible && sourceCol === 'Not Started' && targetStatus !== 'Not Started') {
        onShowToast?.('info', 'Please assign a Responsible person before starting work.')
        setDraggedTaskId(null)
        return
      }

      const targetColOrder = taskOrders[targetStatus] || []
      let targetIndex = targetColOrder.indexOf(targetTaskId)
      if (targetIndex === -1) targetIndex = targetColOrder.length

      moveTask(draggedTaskId, sourceCol, targetStatus, targetIndex)
      
      if (task.status !== targetStatus) {
        onStatusChange(draggedTaskId, targetStatus)
      }
    }
    setDraggedTaskId(null)
  }

  return {
    dragStates: {
      draggedTaskId,
      dragOverTaskId,
      draggedColIndex,
      dragOverColIndex,
    },
    setDragStates: {
      setDraggedTaskId,
      setDragOverTaskId,
      setDraggedColIndex,
      setDragOverColIndex,
    },
    handlers: {
      handleColumnDragStart,
      handleColumnDragOver,
      handleColumnDrop,
      handleDragStart,
      handleDragOverColumn,
      handleDragOverTask,
      handleDragLeaveTask,
      handleDropOnColumn,
      handleDropOnTask,
    }
  }
}
