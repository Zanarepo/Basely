import { useState, useRef, useEffect } from 'react'
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
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null)

  const touchStateRef = useRef<{
    timer: NodeJS.Timeout | null
    taskId: string | null
    sourceCol: string | null
    startX: number
    startY: number
    active: boolean
  }>({
    timer: null,
    taskId: null,
    sourceCol: null,
    startX: 0,
    startY: 0,
    active: false,
  })

  // Cleanup touch timer on unmount
  useEffect(() => {
    return () => {
      if (touchStateRef.current.timer) {
        clearTimeout(touchStateRef.current.timer)
      }
    }
  }, [])

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

  // Task Drag Handlers (HTML5 Mouse Drag)
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

  // --- Touch Drag Handlers for Mobile/Tablets ---
  const handleTouchStart = (e: React.TouchEvent, taskId: string, sourceCol: string) => {
    const touch = e.touches[0]
    if (!touch) return
    const task = elements.find((el) => el.id === taskId)
    const isResponsible = callerRole === 'Team Member' && task?.raciAssignments?.some((a) => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId)
    const canDragTask = hasEditAccess || isResponsible
    if (!canDragTask) return

    if (touchStateRef.current.timer) clearTimeout(touchStateRef.current.timer)

    touchStateRef.current = {
      timer: setTimeout(() => {
        touchStateRef.current.active = true
        setDraggedTaskId(taskId)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(40) } catch (err) {}
        }
      }, 250),
      taskId,
      sourceCol,
      startX: touch.clientX,
      startY: touch.clientY,
      active: false
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const state = touchStateRef.current
    if (!state.taskId) return
    const touch = e.touches[0]
    if (!touch) return

    // If finger moves significantly before the 250ms press threshold, treat as normal page scroll
    if (!state.active && (Math.abs(touch.clientX - state.startX) > 10 || Math.abs(touch.clientY - state.startY) > 10)) {
      if (state.timer) clearTimeout(state.timer)
      state.timer = null
      state.taskId = null
      return
    }

    if (state.active) {
      if (e.cancelable) e.preventDefault() // Prevent scrolling while dragging a card
      setTouchPos({ x: touch.clientX, y: touch.clientY })

      const elem = document.elementFromPoint(touch.clientX, touch.clientY)
      if (elem) {
        const targetCard = elem.closest('[data-task-id]') as HTMLElement
        const targetColumn = elem.closest('[data-board-column]') as HTMLElement
        
        if (targetCard) {
          const tid = targetCard.getAttribute('data-task-id')
          if (tid && tid !== state.taskId) {
            setDragOverTaskId(tid)
            setDragOverColIndex(null)
          }
        } else if (targetColumn) {
          const cname = targetColumn.getAttribute('data-board-column')
          if (cname && cname !== state.sourceCol) {
            setDragOverTaskId(null)
          }
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const state = touchStateRef.current
    if (state.timer) clearTimeout(state.timer)
    
    if (state.active && state.taskId && state.sourceCol) {
      const touch = e.changedTouches[0]
      if (touch) {
        const elem = document.elementFromPoint(touch.clientX, touch.clientY)
        if (elem) {
          const targetCard = elem.closest('[data-task-id]') as HTMLElement
          const targetColumn = elem.closest('[data-board-column]') as HTMLElement
          
          const task = elements.find((t) => t.id === state.taskId)
          if (task) {
            let targetStatus: string | null = null
            let targetIndex: number = 0

            if (targetCard && targetCard.getAttribute('data-task-id') !== state.taskId) {
              const tid = targetCard.getAttribute('data-task-id')!
              targetStatus = targetCard.getAttribute('data-board-column') || state.sourceCol
              const targetColOrder = taskOrders[targetStatus] || []
              targetIndex = targetColOrder.indexOf(tid)
              if (targetIndex === -1) targetIndex = targetColOrder.length
            } else if (targetColumn) {
              targetStatus = targetColumn.getAttribute('data-board-column')
              if (targetStatus) {
                targetIndex = taskOrders[targetStatus] ? taskOrders[targetStatus].length : 0
              }
            }

            if (targetStatus && (targetStatus !== state.sourceCol || targetIndex !== undefined)) {
              const hasResponsible = task.raciAssignments?.some((a) => a.roleType === 'Responsible')
              if (!hasResponsible && state.sourceCol === 'Not Started' && targetStatus !== 'Not Started') {
                onShowToast?.('info', 'Please assign a Responsible person before starting work.')
              } else {
                moveTask(state.taskId, state.sourceCol, targetStatus, targetIndex)
                if (task.status !== targetStatus) {
                  onStatusChange(state.taskId, targetStatus)
                }
              }
            }
          }
        }
      }
    }

    // Reset touch state
    touchStateRef.current = { timer: null, taskId: null, sourceCol: null, startX: 0, startY: 0, active: false }
    setDraggedTaskId(null)
    setDragOverTaskId(null)
    setDragOverColIndex(null)
    setTouchPos(null)
  }

  return {
    dragStates: {
      draggedTaskId,
      dragOverTaskId,
      draggedColIndex,
      dragOverColIndex,
      touchPos,
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
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    }
  }
}
