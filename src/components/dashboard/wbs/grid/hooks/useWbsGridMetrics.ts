import { useMemo } from 'react'

export function useWbsGridMetrics(gridData: any[]) {
  return useMemo(() => {
    // Global Project Summary Metrics (All Work Packages)
    const allWorkPackages = gridData.filter(d => d.isWorkPackage)

    const validStarts = allWorkPackages.map(d => d.start).filter(s => s && s !== '—')
    const globalEarliestStart = validStarts.length > 0
      ? new Date(Math.min(...validStarts.map(s => new Date(s).getTime()))).toISOString().split('T')[0]
      : '—'

    const validFinishes = allWorkPackages.map(d => d.finish).filter(f => f && f !== '—')
    const globalLatestFinish = validFinishes.length > 0
      ? new Date(Math.max(...validFinishes.map(f => new Date(f).getTime()))).toISOString().split('T')[0]
      : '—'

    const validLS = allWorkPackages.map(d => d.ls).filter(s => s && s !== '—')
    const globalEarliestLS = validLS.length > 0
      ? new Date(Math.min(...validLS.map(s => new Date(s).getTime()))).toISOString().split('T')[0]
      : '—'

    const validLF = allWorkPackages.map(d => d.lf).filter(f => f && f !== '—')
    const globalLatestLF = validLF.length > 0
      ? new Date(Math.max(...validLF.map(f => new Date(f).getTime()))).toISOString().split('T')[0]
      : '—'

    let globalTotalDuration = '—'
    if (globalEarliestStart !== '—' && globalLatestFinish !== '—') {
      const startDt = new Date(globalEarliestStart)
      const finishDt = new Date(globalLatestFinish)
      let count = 0
      const cur = new Date(startDt)
      while (cur <= finishDt) {
        const day = cur.getDay()
        if (day !== 0 && day !== 6) count++
        cur.setDate(cur.getDate() + 1)
      }
      globalTotalDuration = `${Math.max(1, count)}d`
    }

    const validFloats = allWorkPackages.map(d => parseFloat(d.float)).filter(f => !isNaN(f))
    const globalMinFloat = validFloats.length > 0 ? Math.min(...validFloats) : null

    const globalTotalCost = allWorkPackages.reduce((sum, d) => sum + (d.cost || 0), 0)
    const completedCount = allWorkPackages.filter(d => d.status === 'Complete').length
    const overallProgressPct = allWorkPackages.length > 0 ? Math.round((completedCount / allWorkPackages.length) * 100) : 0
    const projectCurrency = allWorkPackages[0]?.currency || 'USD'

    return {
      allWorkPackages,
      globalEarliestStart,
      globalLatestFinish,
      globalEarliestLS,
      globalLatestLF,
      globalTotalDuration,
      globalMinFloat,
      globalTotalCost,
      completedCount,
      overallProgressPct,
      projectCurrency
    }
  }, [gridData])
}
