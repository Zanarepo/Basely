import { Link2, Lock } from 'lucide-react'
import { getX } from './canvasUtils'

type GanttTimelineBarsProps = {
  rowData: any[]
  dayWidth: number
  rowHeight: number
  headerHeight: number
  showBaseline: boolean
  baselineSnapshots: any[]
  timelineStart: string
  hasEditAccess: boolean
  elements: any[]
  onPointerDown: (e: React.PointerEvent, row: any, type: 'move' | 'resize-left' | 'resize-right') => void
  onItemHover: (e: React.MouseEvent, row: any) => void
  onItemLeave: () => void
  onStartDrawLink: (e: React.PointerEvent, row: any, rowHeight: number, headerHeight: number, edge: 'start' | 'end') => void
  onAnchorPointerUp: (e: React.PointerEvent, row: any) => void
}

export function GanttTimelineBars({
  rowData,
  dayWidth,
  rowHeight,
  headerHeight,
  showBaseline,
  baselineSnapshots,
  timelineStart,
  hasEditAccess,
  elements,
  onPointerDown,
  onItemHover,
  onItemLeave,
  onStartDrawLink,
  onAnchorPointerUp,
}: GanttTimelineBarsProps) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-20"
      style={{ top: `${headerHeight}px` }}
    >
      {rowData.map((row) => {
        if (!row.es || !row.ef) return null

        const startX = getX(row.es, timelineStart, dayWidth)
        const width = getX(row.ef, timelineStart, dayWidth) - startX + dayWidth

        // Summary vs Milestone vs Task
        const isSummary = !row.element.isWorkPackage
        const isMilestone = row.activity?.type === 'Milestone'
        const isCritical = row.activity?.isCritical ?? false

        // Position y
        const topY = row.rowIndex * rowHeight

        // Check if baseline snapshot exists
        const baseline = showBaseline && row.activity
          ? baselineSnapshots.find((s) => s.activity_id === row.activity?.id)
          : null

        const bStartX = baseline ? getX(baseline.baseline_start, timelineStart, dayWidth) : 0
        const bWidth = baseline ? getX(baseline.baseline_finish, timelineStart, dayWidth) - bStartX + dayWidth : 0

        return (
          <div
            key={row.element.id}
            className="absolute group/row"
            style={{
              top: `${topY}px`,
              height: `${rowHeight}px`,
              left: 0,
            }}
          >
            {/* Render Baseline Shadow Bar */}
            {baseline && (
              <div
                className="absolute bg-slate-400 dark:bg-slate-500 rounded-full pointer-events-none border border-slate-500 dark:border-slate-400 shadow-sm z-0"
                title="Baseline snapshot"
                style={{
                  left: `${bStartX}px`,
                  top: '38px', // Positioned clearly below the main task bar
                  width: `${bWidth}px`,
                  height: '6px',
                }}
              />
            )}

            {/* Task Bar / Milestone / Summary */}
            <div
              id={row.activity ? `bar-${row.activity.id}` : undefined}
              className={`absolute group flex items-center transition-shadow ${
                hasEditAccess && !isSummary ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              onPointerEnter={(e) => onItemHover(e, row)}
              onPointerLeave={() => onItemLeave()}
              onPointerDown={(e) => !isSummary && onPointerDown(e, row, 'move')}
              onPointerUp={(e) => onAnchorPointerUp(e, row)}
              style={{
                touchAction: 'none', // Prevent mobile scrolling when dragging
                left: `${startX}px`,
                top: '12px',
                width: `${width}px`,
                height: '24px',
              }}
            >
              {isSummary ? (
                // --- Summary Rollup Bar ---
                <div className="w-full h-full relative">
                  <div className="absolute top-1 left-0 right-0 h-4 bg-slate-800 dark:bg-slate-300 rounded-sm overflow-hidden border border-slate-700/50">
                    {/* Progress overlay */}
                    {row.percentComplete > 0 && (
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${row.percentComplete}%` }}
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-slate-300" />
                  <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-slate-300" />
                  
                  {/* Summary Progress Text */}
                  <span className="absolute -top-3.5 right-0 text-[9px] font-bold text-app-subtle">
                    {row.percentComplete}%
                  </span>
                </div>
              ) : isMilestone ? (
                // --- Milestone Diamond ---
                <div className="w-full h-full flex items-center justify-center relative z-10">
                  <div
                    className={`w-5 h-5 rotate-45 transform origin-center border-2 transition-all group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-indigo-400 group-hover:brightness-110 ${
                      isCritical
                        ? 'bg-red-500 border-red-700'
                        : 'bg-emerald-400 border-emerald-600'
                    }`}
                  />
                  {row.activity?.constraintType !== 'As Soon As Possible' && (
                    <Lock className="w-3 h-3 absolute -right-4 text-rose-500" />
                  )}
                </div>
              ) : (
                // --- Standard Task Bar ---
                <div
                  className={`w-full h-full rounded-md shadow-sm border overflow-hidden relative z-10 transition-all group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-indigo-400 group-hover:brightness-110 ${
                    row.element.status === 'Complete'
                      ? 'bg-emerald-500 border-emerald-600'
                      : row.element.status === 'In Progress'
                      ? 'bg-blue-500 border-blue-600'
                      : isCritical
                      ? 'bg-red-500 border-red-600'
                      : 'bg-indigo-500 border-indigo-600'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent" />
                  {/* Progress fill visual */}
                  {row.percentComplete > 0 && (
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-black/25"
                      style={{ width: `${row.percentComplete}%` }}
                    />
                  )}
                  {row.activity?.constraintType !== 'As Soon As Possible' && (
                    <Lock className="w-3 h-3 absolute top-1.5 left-1 text-white/70" />
                  )}
                </div>
              )}

              {/* Float Indicator */}
              {!isSummary && !isMilestone && row.activity?.totalFloat > 0 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-indigo-200 dark:bg-indigo-900/50 rounded-r-sm z-0 pointer-events-none border border-l-0 border-indigo-300 dark:border-indigo-800"
                  style={{ 
                    left: `100%`, 
                    width: `${row.activity.totalFloat * dayWidth}px` 
                  }}
                  title={`Float: ${row.activity.totalFloat} days`}
                >
                  <div className="absolute right-0 -top-1 bottom-0 w-[2px] h-[10px] bg-indigo-400 dark:bg-indigo-600" />
                </div>
              )}

              {/* Resize Handles (Left / Right) */}
              {!isSummary && !isMilestone && hasEditAccess && (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-gradient-to-r from-black/20 to-transparent z-20"
                    onPointerDown={(e) => onPointerDown(e, row, 'resize-left')}
                    style={{ touchAction: 'none' }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-gradient-to-l from-black/20 to-transparent z-20"
                    onPointerDown={(e) => onPointerDown(e, row, 'resize-right')}
                    style={{ touchAction: 'none' }}
                  />
                </>
              )}

              {/* Anchor Node for creating dependencies */}
              {!isSummary && hasEditAccess && (
                <>
                  <div
                    className="absolute -left-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm opacity-0 group-hover:opacity-100 hover:scale-125 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center cursor-crosshair transition-all z-30"
                    onPointerDown={(e) => onStartDrawLink(e, row, rowHeight, headerHeight, 'start')}
                    style={{ touchAction: 'none' }}
                    title="Drag to create dependency link from start"
                  >
                    <Link2 className="w-3 h-3" />
                  </div>
                  <div
                    className="absolute -right-7 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm opacity-0 group-hover:opacity-100 hover:scale-125 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center cursor-crosshair transition-all z-30"
                    onPointerDown={(e) => onStartDrawLink(e, row, rowHeight, headerHeight, 'end')}
                    style={{ touchAction: 'none' }}
                    title="Drag to create dependency link from finish"
                  >
                    <Link2 className="w-3 h-3" />
                  </div>
                </>
              )}
            </div>

            {/* Label outside the bar */}
            <span 
              className="absolute text-[11px] font-semibold text-app-fg mt-1 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500"
              style={{ left: `${startX + width + 12}px`, top: '16px' }}
            >
              {isMilestone ? (
                <>
                  <span className="text-amber-500">Milestone</span>
                  {(() => {
                    const parent = row.element.parentId ? elements.find((el: any) => el.id === row.element.parentId) : null
                    return parent ? <span className="text-app-subtle ml-1">({parent.name})</span> : null
                  })()}
                </>
              ) : (
                row.element.name
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
