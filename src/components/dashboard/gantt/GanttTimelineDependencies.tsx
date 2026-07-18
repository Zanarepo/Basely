import type { Activity, Dependency } from '@/lib/schedule/cpm'
import { getX } from './canvasUtils'

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
}: GanttTimelineDependenciesProps) {
  return (
    <>
      {/* SVG overlay canvas for dependencies */}
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
            <path d="M 0 1 L 10 5 L 0 9 z" fill="rgb(99, 102, 241)" />
          </marker>
        </defs>

        {/* Render Saved Dependencies */}
        {dependencies.map((dep) => {
          const predRowIdx = actRowIndexMap.get(dep.predecessorId)
          const succRowIdx = actRowIndexMap.get(dep.successorId)
          const predAct = activities.find((a) => a.id === dep.predecessorId)
          const succAct = activities.find((a) => a.id === dep.successorId)

          if (predRowIdx === undefined || succRowIdx === undefined || !predAct || !succAct) {
            return null
          }

          // Calculate anchor positions
          const startX = getX(predAct.ef!, timelineStart, dayWidth) + dayWidth
          const startY = predRowIdx * rowHeight + headerHeight + rowHeight / 2

          const endX = getX(succAct.es!, timelineStart, dayWidth)
          const endY = succRowIdx * rowHeight + headerHeight + rowHeight / 2

          // Build orthogonal polyline path
          const midX = startX + (endX - startX) / 2
          const pathData = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`

          return (
            <path
              key={dep.id}
              d={pathData}
              fill="none"
              stroke="rgb(99, 102, 241)"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
              className="opacity-70"
            />
          )
        })}

        {/* Render in-flight link drawing line */}
        {drawingLink && (
          <path
            d={`M ${drawingLink.startX} ${drawingLink.startY} L ${drawingLink.currentX} ${drawingLink.currentY}`}
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* HTML overlay for Dependency Deletion Badges */}
      {hasEditAccess && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {dependencies.map((dep) => {
            const predRowIdx = actRowIndexMap.get(dep.predecessorId)
            const succRowIdx = actRowIndexMap.get(dep.successorId)
            const predAct = activities.find((a) => a.id === dep.predecessorId)
            const succAct = activities.find((a) => a.id === dep.successorId)

            if (predRowIdx === undefined || succRowIdx === undefined || !predAct || !succAct) {
              return null
            }

            const startX = getX(predAct.ef!, timelineStart, dayWidth) + dayWidth
            const startY = predRowIdx * rowHeight + headerHeight + rowHeight / 2

            const endX = getX(succAct.es!, timelineStart, dayWidth)
            const endY = succRowIdx * rowHeight + headerHeight + rowHeight / 2

            const midX = startX + (endX - startX) / 2
            const verticalCenterY = startY + (endY - startY) / 2

            return (
              <div
                key={`badge-${dep.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center group"
                style={{ left: `${midX}px`, top: `${verticalCenterY}px`, width: '28px', height: '28px' }}
                title={`Delete link from ${predAct.name} to ${succAct.name}`}
              >
                <div
                  className="w-6 h-6 bg-white border border-rose-200 text-rose-500 rounded-md shadow-sm flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white hover:border-rose-600 hover:scale-110 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-rose-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete dependency from "${predAct.name}" to "${succAct.name}"?`)) {
                      onDeleteDependency(dep.id)
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
