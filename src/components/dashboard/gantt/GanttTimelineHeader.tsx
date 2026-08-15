import { useMemo } from 'react'

type GanttTimelineHeaderProps = {
  timelineStart: string
  totalDays: number
  dayWidth: number
  zoom: 'day' | 'week' | 'month' | 'quarter'
  canvasWidth: number
  headerHeight: number
}

export function GanttTimelineHeader({
  timelineStart,
  totalDays,
  dayWidth,
  zoom,
  canvasWidth,
  headerHeight,
}: GanttTimelineHeaderProps) {
  const timelineHeaders = useMemo(() => {
    return getTimelineHeaders(timelineStart, totalDays, dayWidth, zoom)
  }, [timelineStart, totalDays, dayWidth, zoom])

  return (
    <div
      className="sticky top-0 z-30 flex bg-app-muted-surface border-b border-app-border"
      style={{ height: `${headerHeight}px`, width: `${canvasWidth}px` }}
    >
      {timelineHeaders.map((hdr, idx) => (
        <span
          key={idx}
          className="absolute text-[11px] font-bold text-app-subtle border-l border-app-border/40 pl-1.5 pt-4 h-full"
          style={{ left: `${hdr.left}px` }}
        >
          {hdr.label}
        </span>
      ))}
    </div>
  )
}

export function getTimelineHeaders(
  timelineStart: string,
  totalDays: number,
  dayWidth: number,
  zoom: 'day' | 'week' | 'month' | 'quarter'
) {
  const [y, m, d] = timelineStart.split('T')[0]!.split('-').map(Number)
  const startUtc = Date.UTC(y!, m! - 1, d!)
  const headers: { label: string; left: number }[] = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startUtc + i * 24 * 60 * 60 * 1000)
    let label = ''

    if (zoom === 'day') {
      label = `${date.getUTCDate()}`
    } else if (zoom === 'week' && date.getUTCDay() === 1) {
      label = `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`
    } else if (zoom === 'month' && date.getUTCDate() === 1) {
      label = `${monthNames[date.getUTCMonth()]} '${String(date.getUTCFullYear()).slice(-2)}`
    } else if (zoom === 'quarter' && (date.getUTCMonth() % 3 === 0) && date.getUTCDate() === 1) {
      label = `Q${Math.floor(date.getUTCMonth() / 3) + 1} '${String(date.getUTCFullYear()).slice(-2)}`
    }

    if (label) {
      headers.push({ label, left: i * dayWidth })
    }
  }
  return headers
}
