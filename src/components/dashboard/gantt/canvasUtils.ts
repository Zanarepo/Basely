export const isValidDateStr = (d: string | null | undefined): boolean => {
  if (!d) return false
  const clean = d.split('T')[0]!.split(' ')[0]!
  const parts = clean.split('-').map(Number)
  if (parts.length !== 3) return false
  const [y, m, day] = parts
  return !isNaN(y!) && !isNaN(m!) && !isNaN(day!) && y! > 1000
}

export const getDaysDiff = (d1: string, d2: string): number => {
  if (!d1 || !d2) return 0
  const c1 = d1.split('T')[0]!.split(' ')[0]!
  const c2 = d2.split('T')[0]!.split(' ')[0]!
  const [y1, m1, day1] = c1.split('-').map(Number)
  const [y2, m2, day2] = c2.split('-').map(Number)
  if (isNaN(y1!) || isNaN(m1!) || isNaN(day1!) || isNaN(y2!) || isNaN(m2!) || isNaN(day2!)) {
    return 0
  }
  const t1 = Date.UTC(y1!, m1! - 1, day1!)
  const t2 = Date.UTC(y2!, m2! - 1, day2!)
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
}

export const getX = (dateStr: string | null, timelineStart: string, dayWidth: number): number => {
  if (!dateStr || !isValidDateStr(dateStr)) return 0
  return getDaysDiff(timelineStart, dateStr) * dayWidth
}
