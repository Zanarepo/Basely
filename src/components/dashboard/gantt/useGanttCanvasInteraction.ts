import { useState, useEffect } from 'react'
import type { Activity, Dependency } from '@/lib/schedule/cpm'
import { getDaysDiff, getX } from './canvasUtils'

type UseGanttCanvasInteractionProps = {
  dayWidth: number
  timelineStart: string
  hasEditAccess: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onMoveActivity: (id: string, deltaDays: number) => Promise<boolean>
  onResizeActivity: (id: string, newDuration: number) => Promise<boolean>
  onCreateDependency: (predId: string, succId: string) => Promise<boolean>
  activities: Activity[]
  dependencies: Dependency[]
}

export function useGanttCanvasInteraction({
  dayWidth,
  timelineStart,
  hasEditAccess,
  containerRef,
  onMoveActivity,
  onResizeActivity,
  onCreateDependency,
  activities,
  dependencies,
}: UseGanttCanvasInteractionProps) {
  // Drag states
  const [dragging, setDragging] = useState<{
    id: string
    type: 'move' | 'resize-right' | 'resize-left'
    startX: number
    startWidth: number
    startOffset: number
    activity: Activity
  } | null>(null)

  // Dependency drawing states
  const [drawingLink, setDrawingLink] = useState<{
    fromId: string
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // Hover details tooltip popup state
  const [hoveredItem, setHoveredItem] = useState<{
    x: number
    y: number
    elementName: string
    duration: number
    es: string | null
    ef: string | null
    predecessorNames: string[]
  } | null>(null)

  // --- Drag and Resize Pointer Listeners ---
  const handlePointerDown = (
    e: React.PointerEvent,
    row: any,
    type: 'move' | 'resize-left' | 'resize-right'
  ) => {
    if (!hasEditAccess || !row.activity || !row.es) return
    e.stopPropagation()
    e.preventDefault()

    // Capture pointer to track dragging outside bounds
    e.currentTarget.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startWidth = getDaysDiff(row.es, row.ef!) * dayWidth + dayWidth
    const startOffset = getX(row.es, timelineStart, dayWidth)

    setDragging({
      id: row.activity.id,
      type,
      startX,
      startWidth,
      startOffset,
      activity: row.activity,
    })
    setHoveredItem(null) // Hide tooltip while dragging
  }

  // Pointer move listener
  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragging.startX
      const barElement = document.getElementById(`bar-${dragging.id}`)
      if (!barElement) return

      if (dragging.type === 'move') {
        barElement.style.transform = `translateX(${deltaX}px)`
      } else if (dragging.type === 'resize-right') {
        const newWidth = Math.max(dayWidth, dragging.startWidth + deltaX)
        barElement.style.width = `${newWidth}px`
      } else if (dragging.type === 'resize-left') {
        const newWidth = Math.max(dayWidth, dragging.startWidth - deltaX)
        barElement.style.transform = `translateX(${deltaX}px)`
        barElement.style.width = `${newWidth}px`
      }
    };

    const handlePointerUp = async (e: PointerEvent) => {
      const type = dragging.type
      const act = dragging.activity
      const startX = dragging.startX

      // Clear drag state synchronously so UI responds immediately
      setDragging(null)

      const deltaX = e.clientX - startX
      const deltaDays = Math.round(deltaX / dayWidth)

      if (deltaDays !== 0) {
        if (type === 'move') {
          await onMoveActivity(act.id, deltaDays)
        } else if (type === 'resize-right' || type === 'resize-left') {
          const newDur = Math.max(1, act.duration + (type === 'resize-right' ? deltaDays : -deltaDays))
          await onResizeActivity(act.id, newDur)
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [dragging, dayWidth, onMoveActivity, onResizeActivity])

  // --- Dependency Linking Listeners ---
  const handleStartDrawLink = (e: React.PointerEvent, row: any, ROW_HEIGHT: number, HEADER_HEIGHT: number, edge: 'start' | 'end') => {
    if (!hasEditAccess || !row.activity || !row.es) return
    e.stopPropagation()
    e.preventDefault()

    e.currentTarget.setPointerCapture(e.pointerId)

    // Position of anchor circle relative to scroll canvas
    const x = edge === 'end' 
      ? getX(row.ef!, timelineStart, dayWidth) + dayWidth 
      : getX(row.es!, timelineStart, dayWidth)
      
    const y = row.rowIndex * ROW_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT / 2

    setDrawingLink({
      fromId: row.activity.id,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    })
    setHoveredItem(null) // Hide tooltip during linking
  }

  // Draw line pointer move
  useEffect(() => {
    if (!drawingLink) return

    const handlePointerMove = (e: PointerEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const scrollLeft = containerRef.current?.scrollLeft ?? 0
      const scrollTop = containerRef.current?.scrollTop ?? 0

      // Compute current coordinates relative to timeline canvas
      const x = e.clientX - containerRect.left + scrollLeft
      const y = e.clientY - containerRect.top + scrollTop

      setDrawingLink((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null))
    };

    const handlePointerUp = () => {
      setDrawingLink(null)
    };

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [drawingLink, containerRef])

  const handleAnchorPointerUp = async (e: React.PointerEvent, targetRow: any) => {
    if (!hasEditAccess || !drawingLink || !targetRow.activity) return
    e.stopPropagation()

    const predId = drawingLink.fromId
    const succId = targetRow.activity.id

    // Clear link drawing line immediately so the UI responds instantly
    setDrawingLink(null)

    if (predId !== succId) {
      await onCreateDependency(predId, succId)
    }
  }

  // --- Tooltip Hover Helper ---
  const handleItemHover = (e: React.MouseEvent, row: any) => {
    if (dragging || drawingLink) return // Disable tooltip during active operations

    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    const scrollLeft = containerRef.current?.scrollLeft ?? 0
    const scrollTop = containerRef.current?.scrollTop ?? 0

    // Gather predecessor activity names
    const predNames: string[] = []
    if (row.activity) {
      dependencies
        .filter((d) => d.successorId === row.activity?.id)
        .forEach((d) => {
          const predAct = activities.find((a) => a.id === d.predecessorId)
          if (predAct) predNames.push(predAct.name)
        })
    }

    setHoveredItem({
      x: rect.left - (containerRect?.left ?? 0) + scrollLeft + rect.width / 2,
      y: rect.top - (containerRect?.top ?? 0) + scrollTop - 10,
      elementName: row.element.name,
      duration: row.duration,
      es: row.es,
      ef: row.ef,
      predecessorNames: predNames,
    })
  }

  return {
    dragging,
    drawingLink,
    hoveredItem,
    setHoveredItem,
    handlePointerDown,
    handleStartDrawLink,
    handleAnchorPointerUp,
    handleItemHover,
  }
}
