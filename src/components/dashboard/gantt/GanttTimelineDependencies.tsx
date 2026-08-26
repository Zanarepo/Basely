import { useState } from 'react'
import type { Activity, Dependency } from '@/lib/schedule/cpm'
import { getX, isValidDateStr } from './canvasUtils'
import { getDependencyPath, type DependencyLineStyle } from './dependencyPathUtils'

type GanttTimelineDependenciesProps = {
  dependencies: Dependency[]
  activities: Activity[]
  actRowIndexMap: Map<string, number>
  dayWidth: number
  rowHeight: number
  headerHeight: number
  canvasWidth: number
  drawingLink: { startX: number; startY: number; currentX: number; currentY: number } | null
  hasEditAccess: boolean
  onDeleteDependency: (depId: string) => void
  timelineStart: string
  showAllDependencies?: boolean
  hoveredTaskId?: string | null
  dependencyStyle?: DependencyLineStyle
}

export function GanttTimelineDependencies({
  dependencies,
  activities,
  actRowIndexMap,
  dayWidth,
  rowHeight,
  headerHeight,
  canvasWidth,
  drawingLink,
  hasEditAccess,
  onDeleteDependency,
  timelineStart,
  showAllDependencies = false,
  hoveredTaskId = null,
  dependencyStyle = 'curved',
}: GanttTimelineDependenciesProps) {
  // Track which dependency line is currently hovered to show its badge
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null)

  // Determine which dependencies should be visible
  const visibleDependencies = dependencies.filter(dep => {
    if (hoveredTaskId) {
      return dep.predecessorId === hoveredTaskId || dep.successorId === hoveredTaskId
    }
    if (showAllDependencies) {
      return true
    }
    const predAct = activities.find(a => a.id === dep.predecessorId)
    const succAct = activities.find(a => a.id === dep.successorId)
    return predAct?.isCritical && succAct?.isCritical
  })

  // Pre-calculate rendering data so we don't duplicate logic for SVG lines and HTML badges
  const renderData = visibleDependencies.map(dep => {
    const predRowIdx = actRowIndexMap.get(dep.predecessorId)
    const succRowIdx = actRowIndexMap.get(dep.successorId)
    const predAct = activities.find((a) => a.id === dep.predecessorId)
    const succAct = activities.find((a) => a.id === dep.successorId)

    if (predRowIdx === undefined || succRowIdx === undefined || !predAct || !succAct) {
      return null
    }
    if (!isValidDateStr(predAct.ef) || !isValidDateStr(succAct.es)) {
      return null
    }

    const startX = getX(predAct.ef!, timelineStart, dayWidth) + dayWidth
    const startY = predRowIdx * rowHeight + headerHeight + rowHeight / 2
    const endX = getX(succAct.es!, timelineStart, dayWidth)
    const endY = succRowIdx * rowHeight + headerHeight + rowHeight / 2

    const { pathData, badgeX, badgeY } = getDependencyPath(startX, startY, endX, endY, dependencyStyle)

    return { dep, pathData, badgeX, badgeY, predAct, succAct }
  }).filter((data): data is NonNullable<typeof data> => data !== null)

  return (
    <>
      <svg
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ width: `${canvasWidth}px`, height: '100%' }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" />
          </marker>
        </defs>

        {/* Render Saved Dependencies */}
        {renderData.map(({ dep, pathData }) => (
          <g 
            key={dep.id} 
            className={`group pointer-events-auto cursor-pointer text-indigo-500 transition-all duration-300 ${
              hoveredLineId === dep.id
                ? 'opacity-100 drop-shadow-sm'
                : hoveredLineId
                  ? 'opacity-5'
                  : 'opacity-70'
            }`}
            onPointerEnter={() => setHoveredLineId(dep.id)}
            onPointerLeave={() => setHoveredLineId(null)}
          >
            {/* Thick transparent path for easy hovering */}
            <path d={pathData} fill="none" stroke="transparent" strokeWidth="16" />
            
            {/* Visible path */}
            <path
              d={pathData}
              fill="none"
              stroke={hoveredLineId === dep.id ? 'rgb(244 63 94)' : 'currentColor'} // rose-500
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
          </g>
        ))}

        {/* Render in-flight link drawing line */}
        {drawingLink && (() => {
          const { startX, startY, currentX, currentY } = drawingLink
          const { pathData: drawingPath } = getDependencyPath(startX, startY, currentX, currentY, dependencyStyle)
          return (
            <path
              d={drawingPath}
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
          )
        })()}
      </svg>

      {/* HTML overlay for Dependency Deletion Badges */}
      {hasEditAccess && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {renderData.map(({ dep, badgeX, badgeY, predAct, succAct }) => {
            // Only render the badge if this specific line is hovered
            if (hoveredLineId !== dep.id) return null

            return (
              <div
                key={`badge-${dep.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center animate-in zoom-in-95 fade-in duration-150"
                style={{ left: `${badgeX}px`, top: `${badgeY}px`, width: '20px', height: '20px' }}
                title={`Delete link from ${predAct.name} to ${succAct.name}`}
                onPointerEnter={() => setHoveredLineId(dep.id)}
                onPointerLeave={() => setHoveredLineId(null)}
              >
                <div
                  className="w-5 h-5 bg-white border border-rose-200 text-rose-500 rounded flex items-center justify-center cursor-pointer shadow-md dark:bg-slate-800 dark:border-slate-700 dark:text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete dependency from "${predAct.name}" to "${succAct.name}"?`)) {
                      onDeleteDependency(dep.id)
                      setHoveredLineId(null)
                    }
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
