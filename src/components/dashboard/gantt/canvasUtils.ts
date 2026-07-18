export const getDaysDiff = (d1: string, d2: string) => {
  const t1 = new Date(d1).getTime()
  const t2 = new Date(d2).getTime()
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
}

export const getX = (dateStr: string | null, timelineStart: string, dayWidth: number) => {
  if (!dateStr) return 0
  return getDaysDiff(timelineStart, dateStr) * dayWidth
}
