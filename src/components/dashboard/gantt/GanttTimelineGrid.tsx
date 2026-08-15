type GanttTimelineGridProps = {
  rowData: any[]
  canvasWidth: number
  rowHeight: number
  headerHeight: number
  timelineHeaders: { label: string; left: number }[]
}

export function GanttTimelineGrid({
  rowData,
  canvasWidth,
  rowHeight,
  headerHeight,
  timelineHeaders,
}: GanttTimelineGridProps) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 z-0 pointer-events-none"
      style={{ top: `${headerHeight}px` }}
    >
      {/* Horizontal row backgrounds */}
      {rowData.map((row) => (
        <div
          key={row.element.id}
          className="border-b border-slate-200/50 dark:border-slate-800/40 flex"
          style={{ height: `${rowHeight}px`, width: `${canvasWidth}px` }}
        />
      ))}
      
      {/* Vertical guidelines (Subtle Dotted Grid) */}
      {timelineHeaders.map((hdr, idx) => (
        <div
          key={idx}
          className="absolute top-0 bottom-0 border-l border-dotted border-slate-200/75 dark:border-slate-800/60 pointer-events-none"
          style={{ left: `${hdr.left}px` }}
        />
      ))}
    </div>
  )
}
