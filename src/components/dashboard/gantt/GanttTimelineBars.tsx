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
  onPointerDown: (e: React.PointerEvent, row: any, type: 'move' | 'resize-left' | 'resize-right') => void
  onItemHover: (e: React.MouseEvent, row: any) => void
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
  onPointerDown,
  onItemHover,
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
                  <div className="absolute top-1 left-0 right-0 h-4 bg-slate-800 dark:bg-slate-300 rounded-sm" />
                  <div className="absolute -bottom-1 -left-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-slate-300" />
                  <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-slate-300" />
                </div>
              ) : isMilestone ? (
                // --- Milestone Diamond ---
                <div className="w-full h-full flex items-center justify-center relative z-10">
                  <div
                    className={`w-5 h-5 rotate-45 transform origin-center border-2 ${
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
                  className={`w-full h-full rounded-md shadow-sm border overflow-hidden relative z-10 ${
                    isCritical
                      ? 'bg-red-500 border-red-600'
                      : 'bg-indigo-500 border-indigo-600'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent" />
                  {/* Progress fill visual */}
                  {row.activity?.percentComplete > 0 && (
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-black/20"
                      style={{ width: `${row.activity.percentComplete}%` }}
                    />
                  )}
                  {row.activity?.constraintType !== 'As Soon As Possible' && (
                    <Lock className="w-3 h-3 absolute top-1.5 left-1 text-white/70" />
                  )}
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
              {row.element.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
