type GanttTimelineTooltipProps = {
  hoveredItem: {
    x: number
    y: number
    yBottom: number
    elementName: string
    duration: number
    es: string | null
    ef: string | null
    predecessorNames: string[]
    totalFloat: number | null
    status: string
    percentComplete: number
    isMilestone: boolean
    parentName: string | null
  } | null
}

// Tooltip height threshold: if y is less than this, flip below the bar
const FLIP_THRESHOLD = 140

export function GanttTimelineTooltip({ hoveredItem }: GanttTimelineTooltipProps) {
  if (!hoveredItem) return null

  const isMilestone = hoveredItem.isMilestone
  const flipBelow = hoveredItem.y < FLIP_THRESHOLD

  return (
    <div
      className={`fixed z-[100] text-white text-xs rounded-xl shadow-2xl p-4 border pointer-events-none min-w-[280px] max-w-[320px] top-24 right-8 animate-in fade-in slide-in-from-right-4 duration-200 ${
        isMilestone
          ? 'bg-amber-950/95 border-amber-700/50 backdrop-blur-md'
          : 'bg-slate-900/95 border-slate-700/50 backdrop-blur-md'
      }`}
    >
      {isMilestone ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider">◆ Milestone</span>
          </div>
          <div className="font-bold text-sm">{hoveredItem.elementName}</div>
          {hoveredItem.parentName && (
            <div className="text-amber-300/70 text-[11px] mt-0.5">({hoveredItem.parentName})</div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-slate-300">
            <span className="text-amber-400/70">Date:</span>
            <span className="font-mono text-right">{hoveredItem.es || '-'}</span>

            <span className="text-amber-400/70">Float:</span>
            <span className="font-mono text-right text-violet-300">{hoveredItem.totalFloat !== null ? `${hoveredItem.totalFloat}d` : '-'}</span>

            <span className="text-amber-400/70">Status:</span>
            <span className="font-mono text-right">{hoveredItem.status}</span>
          </div>
        </>
      ) : (
        <>
          <div className="font-bold text-sm mb-1">{hoveredItem.elementName}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-slate-300">
            <span className="text-slate-400">Duration:</span>
            <span className="font-mono text-right">{hoveredItem.duration}d</span>

            <span className="text-slate-400">Start:</span>
            <span className="font-mono text-right">{hoveredItem.es || '-'}</span>

            <span className="text-slate-400">Finish:</span>
            <span className="font-mono text-right">{hoveredItem.ef || '-'}</span>

            <span className="text-slate-400">Float:</span>
            <span className="font-mono text-right text-violet-300">{hoveredItem.totalFloat !== null ? `${hoveredItem.totalFloat}d` : '-'}</span>

            <span className="text-slate-400">Status:</span>
            <span className="font-mono text-right">{hoveredItem.status}</span>

            <span className="text-slate-400">Progress:</span>
            <span className="font-mono text-right text-emerald-300">{hoveredItem.percentComplete}%</span>
          </div>
        </>
      )}

      {hoveredItem.predecessorNames.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-700">
          <span className="text-slate-400 block mb-1">Predecessors:</span>
          <ul className="list-disc pl-4">
            {hoveredItem.predecessorNames.map((n, i) => (
              <li key={i} className="truncate text-slate-300">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Triangle pointer — flips direction based on position */}
      {flipBelow ? (
        <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] ${
          isMilestone ? 'border-b-amber-950' : 'border-b-slate-900'
        }`} />
      ) : (
        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${
          isMilestone ? 'border-t-amber-950' : 'border-t-slate-900'
        }`} />
      )}
    </div>
  )
}
