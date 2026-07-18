type GanttTimelineTooltipProps = {
  hoveredItem: {
    x: number
    y: number
    elementName: string
    duration: number
    es: string | null
    ef: string | null
    predecessorNames: string[]
    totalFloat: number | null
    status: string
    percentComplete: number
  } | null
}

export function GanttTimelineTooltip({ hoveredItem }: GanttTimelineTooltipProps) {
  if (!hoveredItem) return null

  return (
    <div
      className="absolute z-50 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full min-w-[200px]"
      style={{ left: `${hoveredItem.x}px`, top: `${hoveredItem.y}px` }}
    >
      <div className="font-bold text-sm mb-1">{hoveredItem.elementName}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-slate-300">
        <span className="text-slate-400">Duration:</span>
        <span className="font-mono text-right">{hoveredItem.duration}d</span>

        <span className="text-slate-400">Start:</span>
        <span className="font-mono text-right">{hoveredItem.es || '-'}</span>

        <span className="text-slate-400">Finish:</span>
        <span className="font-mono text-right">{hoveredItem.ef || '-'}</span>

        <span className="text-slate-400">Float:</span>
        <span className="font-mono text-right text-indigo-300">{hoveredItem.totalFloat !== null ? `${hoveredItem.totalFloat}d` : '-'}</span>

        <span className="text-slate-400">Status:</span>
        <span className="font-mono text-right">{hoveredItem.status}</span>

        <span className="text-slate-400">Progress:</span>
        <span className="font-mono text-right text-emerald-300">{hoveredItem.percentComplete}%</span>
      </div>

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

      {/* Triangle pointer */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900" />
    </div>
  )
}
