import { X, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Activity, Dependency } from '@/lib/schedule/cpm'

type ScheduleSheetModalProps = {
  isOpen: boolean
  onClose: () => void
  elements: WbsElement[]
  activities: Activity[]
  dependencies: Dependency[]
  wbsCodes: Map<string, string>
  elementLevels: Map<string, number>
}

export function ScheduleSheetModal({
  isOpen,
  onClose,
  elements,
  activities,
  dependencies,
  wbsCodes,
  elementLevels,
}: ScheduleSheetModalProps) {
  if (!isOpen) return null

  // Helper to format dates
  const fmt = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // We need to display the table in the order of WBS. 
  // 'elements' is already topologically sorted based on parentId and sequence in the WBS module.
  
  // Create a mapping to quickly lookup an activity by its wbsElementId
  const activityMap = new Map<string, Activity>()
  activities.forEach(act => activityMap.set(act.wbsElementId, act))

  // Determine hierarchical status and dates for Summary tasks.
  // Summary dates are rolled up from children.
  const getSummaryDates = (parentId: string) => {
    const childrenActivities: Activity[] = []
    
    // Recursive search for children
    const findChildren = (id: string) => {
      const children = elements.filter(e => e.parentId === id)
      children.forEach(child => {
        if (child.isWorkPackage) {
          const act = activityMap.get(child.id)
          if (act) childrenActivities.push(act)
        } else {
          findChildren(child.id)
        }
      })
    }
    
    findChildren(parentId)
    
    if (childrenActivities.length === 0) return { es: null, ef: null, duration: 0 }
    
    const starts = childrenActivities.map(a => a.es).filter(Boolean).sort()
    const finishes = childrenActivities.map(a => a.ef).filter(Boolean).sort()
    
    const es = starts[0] || null
    const ef = finishes[finishes.length - 1] || null
    const duration = childrenActivities.reduce((acc, act) => acc + act.duration, 0)
    
    return { es, ef, duration }
  }

  const generateCsv = () => {
    const headers = ['WBS Code', 'Task Name', 'Type', 'Duration (Days)', 'Start Date', 'Finish Date', 'Predecessors', 'Float', 'Critical']
    
    const rows = elements.map(el => {
      const code = wbsCodes.get(el.id) || ''
      const name = el.name.replace(/"/g, '""') // Escape quotes for CSV
      const isWorkPackage = el.isWorkPackage
      const act = activityMap.get(el.id)
      
      let duration = '—'
      let start = '—'
      let finish = '—'
      let float = '—'
      let critical = '—'
      let predsStr = '—'
      let type = isWorkPackage ? 'Task' : 'Summary'

      if (isWorkPackage && act) {
        duration = act.duration.toString()
        start = act.es ? act.es.split('T')[0] : '—'
        finish = act.ef ? act.ef.split('T')[0] : '—'
        float = act.totalFloat !== null ? act.totalFloat.toString() : '—'
        critical = act.isCritical ? 'Yes' : 'No'
        if (act.type === 'Milestone') type = 'Milestone'
        
        const preds = dependencies
          .filter(d => d.successorId === act.id)
          .map(d => {
            const predAct = activities.find(a => a.id === d.predecessorId)
            if (predAct) {
              // Find the wbs code of the predecessor
              const predEl = elements.find(e => e.id === predAct.wbsElementId)
              const predCode = predEl ? wbsCodes.get(predEl.id) || '' : ''
              return `${predCode}`
            }
            return ''
          })
          .filter(Boolean)
        
        if (preds.length > 0) predsStr = `"${preds.join(', ')}"`
      } else if (!isWorkPackage) {
        const summary = getSummaryDates(el.id)
        if (summary.es) start = summary.es.split('T')[0]
        if (summary.ef) finish = summary.ef.split('T')[0]
        duration = summary.duration.toString()
      }

      return `"${code}","${name}","${type}","${duration}","${start}","${finish}",${predsStr},"${float}","${critical}"`
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `schedule_sheet_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printSheet = () => {
    // Basic native print. 
    // In a real robust app, you'd hide everything except this modal using media queries.
    // For now, it prints the current window viewport.
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-app-bg/80 backdrop-blur-sm print:bg-white print:p-0">
      <div className="w-full max-w-7xl h-[90vh] bg-app-surface-solid border border-app-border rounded-3xl shadow-2xl flex flex-col overflow-hidden print:h-auto print:border-none print:shadow-none print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg">Schedule Sheet</h2>
              <p className="text-sm text-app-subtle">Full tabular view of the WBS and calculated CPM schedule.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={generateCsv}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-sm"
              title="Download as Excel/CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={printSheet}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <div className="w-px h-6 bg-app-border mx-1" />
            <button
              onClick={onClose}
              className="p-2 text-app-subtle hover:text-app-fg hover:bg-app-hover rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
          <div className="border border-app-border rounded-2xl overflow-hidden print:border-none">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-app-muted-surface border-b border-app-border text-app-subtle uppercase tracking-wider text-[11px] font-bold sticky top-0 z-10 print:static print:bg-white print:text-black">
                <tr>
                  <th className="px-4 py-3">WBS</th>
                  <th className="px-4 py-3 w-1/3">Task Name</th>
                  <th className="px-4 py-3 text-center">Duration</th>
                  <th className="px-4 py-3 text-center">Start Date</th>
                  <th className="px-4 py-3 text-center">Finish Date</th>
                  <th className="px-4 py-3">Predecessors</th>
                  <th className="px-4 py-3 text-center">Float</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border print:divide-gray-300">
                {elements.map((el) => {
                  const code = wbsCodes.get(el.id) || ''
                  const level = elementLevels.get(el.id) || 0
                  const isWorkPackage = el.isWorkPackage
                  const act = activityMap.get(el.id)

                  let duration = '—'
                  let start = '—'
                  let finish = '—'
                  let float = '—'
                  let isCritical = false
                  let predsStr = '—'

                  if (isWorkPackage && act) {
                    duration = `${act.duration}d`
                    start = fmt(act.es)
                    finish = fmt(act.ef)
                    float = act.totalFloat !== null ? `${act.totalFloat}d` : '—'
                    isCritical = act.isCritical
                    
                    const preds = dependencies
                      .filter(d => d.successorId === act.id)
                      .map(d => {
                        const predAct = activities.find(a => a.id === d.predecessorId)
                        if (predAct) {
                          const predEl = elements.find(e => e.id === predAct.wbsElementId)
                          const predCode = predEl ? wbsCodes.get(predEl.id) || '' : ''
                          return `${predCode}`
                        }
                        return null
                      })
                      .filter(Boolean)
                    
                    if (preds.length > 0) predsStr = preds.join(', ')
                  } else if (!isWorkPackage) {
                    const summary = getSummaryDates(el.id)
                    if (summary.es) start = fmt(summary.es)
                    if (summary.ef) finish = fmt(summary.ef)
                    if (summary.duration > 0) duration = `${summary.duration}d`
                  }

                  return (
                    <tr 
                      key={el.id} 
                      className={`
                        transition-colors hover:bg-app-hover print:text-black
                        ${!isWorkPackage ? 'bg-app-muted-surface/50 font-bold print:bg-gray-100' : 'bg-app-surface print:bg-white'}
                        ${isCritical && isWorkPackage ? 'bg-rose-500/5 print:bg-red-50' : ''}
                      `}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{code}</td>
                      <td className="px-4 py-3">
                        <div 
                          className="flex items-center gap-2 truncate max-w-[300px]" 
                          style={{ paddingLeft: `${level * 16}px` }}
                          title={el.name}
                        >
                          <span className={`${!isWorkPackage ? 'text-app-fg' : 'text-app-subtle'}`}>
                            {el.name}
                          </span>
                          {act?.type === 'Milestone' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Milestone
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-center ${!isWorkPackage ? 'text-app-fg' : 'text-app-subtle'}`}>
                        {duration}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{start}</td>
                      <td className="px-4 py-3 text-center font-medium">{finish}</td>
                      <td className="px-4 py-3 text-app-subtle max-w-[150px] truncate" title={predsStr}>
                        {predsStr}
                      </td>
                      <td className={`px-4 py-3 text-center font-bold ${isCritical ? 'text-rose-500' : 'text-indigo-500'}`}>
                        {float}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isWorkPackage ? (
                          isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/25 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              CRITICAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/25 text-[10px] font-bold">
                              NORMAL
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-app-subtle">Summary</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
