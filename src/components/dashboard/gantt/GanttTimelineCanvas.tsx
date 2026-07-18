'use client'

import { useRef, useMemo } from 'react'
import type { Activity, Dependency } from '@/lib/schedule/cpm'

import { useGanttCanvasInteraction } from './useGanttCanvasInteraction'
import { getTimelineHeaders, GanttTimelineHeader } from './GanttTimelineHeader'
import { GanttTimelineGrid } from './GanttTimelineGrid'
import { GanttTimelineDependencies } from './GanttTimelineDependencies'
import { GanttTimelineBars } from './GanttTimelineBars'
import { GanttTimelineTooltip } from './GanttTimelineTooltip'

type GanttTimelineCanvasProps = {
  elements: any[] // WBS flat elements sorted by sortOrder
  activities: Activity[]
  dependencies: Dependency[]
  timelineStart: string
  timelineEnd: string
  zoom: 'day' | 'week' | 'month' | 'quarter'
  showBaseline: boolean
  baselineSnapshots: any[]
  onMoveActivity: (id: string, deltaDays: number) => Promise<boolean>
  onResizeActivity: (id: string, newDuration: number) => Promise<boolean>
  onCreateDependency: (predId: string, succId: string) => Promise<boolean>
  onDeleteDependency: (depId: string) => Promise<boolean>
  hasEditAccess: boolean
  expandedNodeIds: Set<string>
}

const ROW_HEIGHT = 48
const HEADER_HEIGHT = 56

export function GanttTimelineCanvas({
  elements,
  activities,
  dependencies,
  timelineStart,
  timelineEnd,
  zoom,
  showBaseline,
  baselineSnapshots,
  onMoveActivity,
  onResizeActivity,
  onCreateDependency,
  onDeleteDependency,
  hasEditAccess,
  expandedNodeIds,
}: GanttTimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Get chronological calendar width parameters
  const dayWidth = useMemo(() => {
    switch (zoom) {
      case 'day': return 36
      case 'week': return 12
      case 'month': return 4
      case 'quarter': return 1.5
    }
  }, [zoom])

  const getDaysDiff = (d1: string, d2: string) => {
    const t1 = new Date(d1).getTime()
    const t2 = new Date(d2).getTime()
    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
  }

  // Pre-calculate timeline length
  const totalDays = getDaysDiff(timelineStart, timelineEnd)
  const canvasWidth = totalDays * dayWidth

  // Filter visible elements based on parent expand/collapse state
  const visibleElements = useMemo(() => {
    const list: any[] = []

    const checkVisible = (el: any): boolean => {
      let temp = el.parentId
      while (temp) {
        if (!expandedNodeIds.has(temp)) return false
        const parent = elements.find((x) => x.id === temp)
        temp = parent ? parent.parentId : null
      }
      return true
    }

    elements.forEach((el) => {
      if (checkVisible(el)) {
        list.push(el)
      }
    })
    return list
  }, [elements, expandedNodeIds])

  // Build element lookup map for activities
  const actLookup = useMemo(() => {
    const map = new Map<string, Activity>()
    activities.forEach((a) => map.set(a.wbsElementId, a))
    return map
  }, [activities])

  // Map WBS rows to visual coordinate items
  const rowData = useMemo(() => {
    return visibleElements.map((el, rowIndex) => {
      const activity = actLookup.get(el.id)

      // Calculate roll-up start/finish if it's a summary parent
      let es = activity?.es || null
      let ef = activity?.ef || null
      let duration = activity?.duration ?? 0
      let percentComplete = 0

      if (el.isWorkPackage) {
        if (el.status === 'Complete') percentComplete = 100
        else if (el.status === 'In Progress') percentComplete = activity?.percentComplete || 50
      } else {
        // Collect dates of all descendant tasks
        const descendants: Activity[] = []
        const collectDescendants = (id: string) => {
          elements.forEach((x) => {
            if (x.parentId === id) {
              const a = actLookup.get(x.id)
              if (a) descendants.push(a)
              collectDescendants(x.id)
            }
          })
        }
        collectDescendants(el.id)

        const validDescDates = descendants.filter((d) => d.es && d.ef)
        if (validDescDates.length > 0) {
          const startTimes = validDescDates.map((d) => new Date(d.es!).getTime())
          const finishTimes = validDescDates.map((d) => new Date(d.ef!).getTime())
          es = new Date(Math.min(...startTimes)).toISOString().split('T')[0]!
          ef = new Date(Math.max(...finishTimes)).toISOString().split('T')[0]!
          duration = validDescDates.reduce((acc, curr) => acc + curr.duration, 0)
        }
        
        // Calculate percent complete for summary based on WPs
        const descendantWPs: any[] = []
        const getDescWPs = (id: string) => {
          elements.forEach((x) => {
            if (x.parentId === id) {
              if (x.isWorkPackage) descendantWPs.push(x)
              else getDescWPs(x.id)
            }
          })
        }
        getDescWPs(el.id)
        if (descendantWPs.length > 0) {
          const completedCount = descendantWPs.filter(wp => wp.status === 'Complete').length
          percentComplete = Math.round((completedCount / descendantWPs.length) * 100)
        }
      }

      return {
        element: el,
        activity,
        es,
        ef,
        duration,
        rowIndex,
        percentComplete,
      }
    })
  }, [visibleElements, actLookup, elements])

  // Build row indices by activity ID to position arrows
  const actRowIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    rowData.forEach((row) => {
      if (row.activity) {
        map.set(row.activity.id, row.rowIndex)
      }
    })
    return map
  }, [rowData])

  const {
    drawingLink,
    hoveredItem,
    setHoveredItem,
    handlePointerDown,
    handleStartDrawLink,
    handleAnchorPointerUp,
    handleItemHover,
  } = useGanttCanvasInteraction({
    dayWidth,
    timelineStart,
    hasEditAccess,
    containerRef,
    onMoveActivity,
    onResizeActivity,
    onCreateDependency,
    activities,
    dependencies,
  })

  // Render grid timelines
  const timelineHeaders = useMemo(() => {
    return getTimelineHeaders(timelineStart, totalDays, dayWidth, zoom)
  }, [timelineStart, totalDays, dayWidth, zoom])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative select-none bg-app-surface-solid border border-app-border rounded-3xl"
      style={{ height: `${visibleElements.length * ROW_HEIGHT + HEADER_HEIGHT + 24}px`, minHeight: '380px' }}
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Scrollable Canvas Container */}
      <div style={{ width: `${canvasWidth}px`, height: '100%', position: 'relative' }}>
        
        <GanttTimelineHeader
          timelineStart={timelineStart}
          totalDays={totalDays}
          dayWidth={dayWidth}
          zoom={zoom}
          canvasWidth={canvasWidth}
          headerHeight={HEADER_HEIGHT}
        />

        <GanttTimelineGrid
          rowData={rowData}
          canvasWidth={canvasWidth}
          rowHeight={ROW_HEIGHT}
          headerHeight={HEADER_HEIGHT}
          timelineHeaders={timelineHeaders}
        />

        <GanttTimelineDependencies
          dependencies={dependencies}
          activities={activities}
          actRowIndexMap={actRowIndexMap}
          dayWidth={dayWidth}
          rowHeight={ROW_HEIGHT}
          headerHeight={HEADER_HEIGHT}
          canvasWidth={canvasWidth}
          drawingLink={drawingLink}
          hasEditAccess={hasEditAccess}
          onDeleteDependency={onDeleteDependency}
          timelineStart={timelineStart}
        />

        <GanttTimelineBars
          rowData={rowData}
          dayWidth={dayWidth}
          rowHeight={ROW_HEIGHT}
          headerHeight={HEADER_HEIGHT}
          showBaseline={showBaseline}
          baselineSnapshots={baselineSnapshots}
          timelineStart={timelineStart}
          hasEditAccess={hasEditAccess}
          onPointerDown={handlePointerDown}
          onItemHover={handleItemHover}
          onStartDrawLink={handleStartDrawLink}
          onAnchorPointerUp={handleAnchorPointerUp as any}
        />

      </div>

      <GanttTimelineTooltip hoveredItem={hoveredItem} />
    </div>
  )
}
