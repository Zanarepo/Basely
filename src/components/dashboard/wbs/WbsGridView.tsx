import { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronRight, ChevronDown, SlidersHorizontal, Check } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import { useWbsGridData } from './workspace/useWbsGridData'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { TerminologyDict } from '@/utils/terminology'
import { useUserPersona } from '@/hooks/use-user-persona'

type WbsGridViewProps = {
  projectId: string
  elements: WbsElement[]
  workspaceMembers: { userId: string; name: string; email: string }[]
  onSelect: (id: string) => void
  selectedIds?: string[]
  toggleSelection?: (id: string) => void
  selectAll?: () => void
  clearSelection?: () => void
  expandedNodeIds?: Set<string>
  onToggleExpand?: (id: string, e: React.MouseEvent) => void
  terms: TerminologyDict
}

export function WbsGridView({ projectId, elements, workspaceMembers, onSelect, selectedIds = [], toggleSelection, selectAll, clearSelection, expandedNodeIds = new Set(), onToggleExpand, terms }: WbsGridViewProps) {
  const { showBudgetControls } = useUserPersona()
  const { gridData, loading } = useWbsGridData(projectId, elements)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [isColMenuOpen, setIsColMenuOpen] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  // Load preferences from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`basepro_grid_columns_${projectId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as string[]
          setHiddenCols(new Set(parsed))
        } catch (e) {
          // ignore error
        }
      }
    }
  }, [projectId])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setIsColMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleColumn = (key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`basepro_grid_columns_${projectId}`, JSON.stringify(Array.from(next)))
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
        <span className="ml-2 text-sm text-app-muted">Loading schedule data...</span>
      </div>
    )
  }

  const visibleGridData: typeof gridData = []
  const elementLevels = new Map<string, number>()
  const parentVisible = new Map<string, boolean>()

  // Filter out milestones (duration 0) — they only appear on Gantt and Status Report
  const nonMilestoneGridData = gridData.filter((el) => {
    if (!el.isWorkPackage) return true // summary elements always show
    return el.duration !== '0d'
  })

  nonMilestoneGridData.forEach((el) => {
    let isVisible = true
    let lvl = 0

    if (el.parentId) {
      const pVisible = parentVisible.get(el.parentId) ?? true
      const pExpanded = expandedNodeIds.has(el.parentId)
      isVisible = pVisible && pExpanded
      lvl = (elementLevels.get(el.parentId) || 0) + 1
    }

    elementLevels.set(el.id, lvl)
    parentVisible.set(el.id, isVisible)

    if (isVisible) {
      visibleGridData.push(el)
    }
  })

  const isAllSelected = visibleGridData.length > 0 && visibleGridData.every((item) => selectedIds.includes(item.id))

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

  return (
    <div className="h-[600px] overflow-auto w-full">
      {/* Mobile Stacked Cards Layout */}
      {(selectAll || clearSelection) && visibleGridData.length > 0 && (
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface-solid text-xs font-semibold shadow-sm">
          <label className="flex items-center gap-2.5 cursor-pointer text-app-fg">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  if (selectAll) selectAll()
                } else {
                  if (clearSelection) clearSelection()
                }
              }}
              className="w-4 h-4 rounded border-app-border text-violet-500 focus:ring-violet-500 bg-app-surface cursor-pointer"
            />
            Select All ({visibleGridData.length} items)
          </label>
          {selectedIds.length > 0 && (
            <span className="text-violet-500 font-bold">{selectedIds.length} selected</span>
          )}
        </div>
      )}

      <div className="md:hidden space-y-3.5 p-4">
        {visibleGridData.length === 0 ? (
          <div className="text-center py-12 text-sm text-app-muted">No schedule items to display.</div>
        ) : (
          visibleGridData.map((r) => {
            const hasR = r.raciAssignments?.some(a => a.roleType === 'Responsible')
            const hasA = r.raciAssignments?.some(a => a.roleType === 'Accountable')
            const responsible = r.raciAssignments?.find(a => a.roleType === 'Responsible')
            const responsibleName = responsible?.stakeholder?.name || null
            const isMissingRaci = !hasR || !hasA

            const parentElement = r.parentId ? elements.find(e => e.id === r.parentId) : null
            const tagText = parentElement ? parentElement.name : terms.workPackage

            return (
              <div
                key={`card-${r.id}`}
                onClick={() => onSelect(r.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedIds.includes(r.id)
                    ? 'bg-violet-500/10 border-violet-500 ring-1 ring-violet-500'
                    : 'bg-app-surface border-app-border hover:border-slate-400 dark:hover:border-slate-600 shadow-xs'
                }`}
                style={{ marginLeft: `${Math.min(elementLevels.get(r.id) || 0, 2) * 14}px` }}
              >
                {/* Top header row */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {toggleSelection && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelection(r.id)}
                        className="w-4 h-4 rounded border-app-border text-violet-500 focus:ring-violet-500 bg-app-surface cursor-pointer"
                      />
                    )}
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-app-muted-surface text-app-fg">
                      {r.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      {tagText}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        r.status === 'Complete'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : r.status === 'In Progress'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                          : r.status === 'On Hold'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Task Name & Expander */}
                <div className="flex items-start gap-2 mb-3">
                  {!r.isWorkPackage ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleExpand?.(r.id, e)
                      }}
                      className="p-1 mt-0.5 hover:bg-app-hover rounded text-app-subtle cursor-pointer shrink-0"
                    >
                      {expandedNodeIds.has(r.id) ? (
                        <ChevronDown className="w-4 h-4 text-violet-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-violet-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4 h-4 mt-1 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-violet-500/60" />
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-app-fg leading-snug break-words">
                    {r.name}
                  </h4>
                </div>

                {/* Timeline & Cost metrics grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-app-muted-surface/40 border border-app-border/50 text-xs mb-3 font-medium">
                  <div>
                    <span className="text-app-subtle block text-[10px] uppercase tracking-wider mb-0.5">Timeline</span>
                    <span className="text-app-fg font-mono text-[11px] block">{r.start} → {r.finish}</span>
                    <span className="text-app-subtle text-[11px]">Duration: <strong className="text-app-fg font-mono">{r.duration}</strong></span>
                  </div>
                  <div className="text-right">
                    <span className="text-app-subtle block text-[10px] uppercase tracking-wider mb-0.5">{showBudgetControls ? 'Cost & Float' : 'Float'}</span>
                    {showBudgetControls && (
                      <div className="font-mono font-bold text-[12px] text-violet-600 dark:text-violet-400 mb-0.5">
                        <CurrencyDisplay amount={r.cost} currency={r.currency} compactThreshold={1000} />
                      </div>
                    )}
                    {r.float !== '—' ? (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          parseFloat(r.float) === 0
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                            : parseFloat(r.float) <= 3
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {r.float} float
                      </span>
                    ) : (
                      <span className="text-app-subtle text-[11px]">No float</span>
                    )}
                  </div>
                </div>

                {/* Footer: RACI Assignment */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-app-border/50">
                  <span className="text-app-subtle text-[11px] font-medium">Responsible:</span>
                  {responsibleName ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-xs">
                        {responsibleName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-app-fg font-semibold truncate max-w-[160px]">{responsibleName}</span>
                      {isMissingRaci && <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs">⚠️</span>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-app-muted italic text-[11px]">Unassigned</span>
                      {isMissingRaci && <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs">⚠️</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block p-5">
        <div className="flex justify-end mb-3 relative" ref={colMenuRef}>
          <button
            type="button"
            onClick={() => setIsColMenuOpen(!isColMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-app-muted hover:text-app-fg bg-app-surface border border-app-border hover:border-app-border-hover rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Customize Columns
          </button>

          {isColMenuOpen && (
            <div className="absolute right-0 top-9 z-50 w-68 bg-app-surface-solid border border-app-border shadow-2xl rounded-2xl overflow-hidden p-2 animate-fade-in">
              <div className="px-3 py-2 flex items-center justify-between border-b border-app-border/60 pb-2 mb-1 shrink-0">
                <span className="text-xs font-black text-app-fg uppercase tracking-wider">
                  Customize Columns
                </span>
                <button
                  type="button"
                  onClick={() => setIsColMenuOpen(false)}
                  className="text-xs text-violet-500 font-extrabold hover:underline cursor-pointer px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500/20 rounded-md transition-colors"
                >
                  Done
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[320px] pr-1 py-1">
                {[
                  { key: 'Tag', label: 'Tag (Parent Element)' },
                  { key: 'RACI', label: 'RACI Owner' },
                  { key: 'Start', label: 'Start Date' },
                  { key: 'Finish', label: 'Finish Date' },
                  { key: 'ES', label: 'ES (Early Start)' },
                  { key: 'EF', label: 'EF (Early Finish)' },
                  { key: 'LS', label: 'LS (Late Start)' },
                  { key: 'LF', label: 'LF (Late Finish)' },
                  { key: 'Duration', label: 'Duration' },
                  { key: 'Float', label: 'Float / CPM' },
                  ...(showBudgetControls ? [{ key: 'Cost', label: 'Cost Amount' }] : []),
                  { key: 'Status', label: 'Status' },
                ].map((col) => {
                  const isVisible = !hiddenCols.has(col.key)
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleColumn(col.key)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer hover:bg-app-bg"
                    >
                      <span className={`truncate text-left ${isVisible ? 'text-app-fg font-bold' : 'text-app-muted font-normal'}`}>
                        {col.label}
                      </span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isVisible 
                          ? 'bg-violet-600 border-violet-500 text-white shadow-xs' 
                          : 'border-app-border bg-app-surface text-transparent hover:border-violet-500/50'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-app-border rounded-2xl">
          <table className="w-full text-xs border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-app-muted font-medium">
                <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 left-0 z-20 whitespace-nowrap w-8">
                  {selectAll && (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectAll) selectAll()
                        } else {
                          if (clearSelection) clearSelection()
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-app-border text-violet-500 focus:ring-violet-500 bg-app-surface cursor-pointer"
                    />
                  )}
                </th>
                <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 left-8 z-20 whitespace-nowrap">
                  WBS
                </th>
                <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 left-24 z-20 whitespace-nowrap min-w-[200px]">
                  Task Name
                </th>
                {!hiddenCols.has('Tag') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Tag</th>
                )}
                {!hiddenCols.has('RACI') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">RACI</th>
                )}
                {!hiddenCols.has('Start') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Start</th>
                )}
                {!hiddenCols.has('Finish') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Finish</th>
                )}
                {!hiddenCols.has('ES') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">ES</th>
                )}
                {!hiddenCols.has('EF') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">EF</th>
                )}
                {!hiddenCols.has('LS') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">LS</th>
                )}
                {!hiddenCols.has('LF') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">LF</th>
                )}
                {!hiddenCols.has('Duration') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Duration</th>
                )}
                {!hiddenCols.has('Float') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Float</th>
                )}
                {showBudgetControls && !hiddenCols.has('Cost') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Cost</th>
                )}
                {!hiddenCols.has('Status') && (
                  <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 z-10 whitespace-nowrap">Status</th>
                )}
              </tr>

              {/* Row 2: Top Global Summary Row */}
              {allWorkPackages.length > 0 && (
                <tr className="bg-violet-500/10 dark:bg-violet-500/20 font-bold text-app-fg border-b-2 border-app-border">
                  <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 left-0 bg-violet-100 dark:bg-violet-950 z-20 w-8"></td>
                  <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 left-8 bg-violet-100 dark:bg-violet-950 z-20 font-mono text-violet-600 dark:text-violet-400 font-black">
                    TOTAL
                  </td>
                  <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 left-24 bg-violet-100 dark:bg-violet-950 z-20 font-bold text-violet-600 dark:text-violet-400">
                    Global Summary ({allWorkPackages.length} Work Packages)
                  </td>

                  {!hiddenCols.has('Tag') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap text-app-subtle text-[11px]">—</td>
                  )}
                  {!hiddenCols.has('RACI') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap text-app-subtle text-[11px]">—</td>
                  )}
                  {!hiddenCols.has('Start') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalEarliestStart}</td>
                  )}
                  {!hiddenCols.has('Finish') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalLatestFinish}</td>
                  )}
                  {!hiddenCols.has('ES') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalEarliestStart}</td>
                  )}
                  {!hiddenCols.has('EF') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalLatestFinish}</td>
                  )}
                  {!hiddenCols.has('LS') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalEarliestLS}</td>
                  )}
                  {!hiddenCols.has('LF') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-app-fg">{globalLatestLF}</td>
                  )}
                  {!hiddenCols.has('Duration') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-[11px] font-bold text-violet-600 dark:text-violet-400">{globalTotalDuration}</td>
                  )}
                  {!hiddenCols.has('Float') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap">
                      {globalMinFloat !== null ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${globalMinFloat === 0 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                          {globalMinFloat}d CPM
                        </span>
                      ) : (
                        <span className="text-app-subtle">—</span>
                      )}
                    </td>
                  )}
                  {showBudgetControls && !hiddenCols.has('Cost') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap font-mono text-xs font-black text-violet-600 dark:text-violet-400">
                      <CurrencyDisplay amount={globalTotalCost} currency={projectCurrency} compactThreshold={1000000} />
                    </td>
                  )}
                  {!hiddenCols.has('Status') && (
                    <td className="px-3 py-2.5 border-b-2 border-app-border sticky top-8 bg-violet-100 dark:bg-violet-950 z-10 whitespace-nowrap text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {completedCount}/{allWorkPackages.length} Done ({overallProgressPct}%)
                    </td>
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {visibleGridData.map((r) => {
                const hasR = r.raciAssignments?.some(a => a.roleType === 'Responsible')
                const hasA = r.raciAssignments?.some(a => a.roleType === 'Accountable')
                const responsible = r.raciAssignments?.find(a => a.roleType === 'Responsible')
                const responsibleName = responsible?.stakeholder?.name || null
                const isMissingRaci = !hasR || !hasA

                const parentElement = r.parentId ? elements.find(e => e.id === r.parentId) : null
                const tagText = parentElement ? parentElement.name : terms.workPackage

                const isSummary = !r.isWorkPackage
                const rowBgClass = isSummary
                  ? 'bg-violet-500/5 dark:bg-violet-500/10 font-bold border-l-4 border-l-violet-500'
                  : selectedIds.includes(r.id) ? 'bg-violet-500/5' : ''

                const cellStickyBg = isSummary
                  ? 'bg-violet-100/90 dark:bg-violet-950/80'
                  : 'bg-app-surface'

                return (
                  <tr 
                    key={r.id} 
                    className={`group hover:bg-app-hover cursor-pointer transition-colors ${rowBgClass}`}
                    onClick={() => onSelect(r.id)}
                  >
                    <td className={`px-3 py-2.5 border-b border-app-border sticky left-0 ${cellStickyBg} group-hover:bg-app-hover z-10 w-8`} onClick={(e) => e.stopPropagation()}>
                      {toggleSelection && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelection(r.id)}
                          className={`w-3.5 h-3.5 rounded border-app-border text-violet-500 focus:ring-violet-500 bg-app-surface cursor-pointer transition-opacity duration-200 ${selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                        />
                      )}
                    </td>
                    <td className={`px-3 py-2.5 border-b border-app-border sticky left-8 ${cellStickyBg} group-hover:bg-app-hover z-10 font-mono text-[10px] whitespace-nowrap`}>
                      <span className={`px-1.5 py-0.5 rounded font-mono ${
                        isSummary
                          ? 'bg-violet-600 text-white font-black shadow-2xs'
                          : 'text-app-subtle'
                      }`}>
                        {r.code}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 border-b border-app-border sticky left-24 ${cellStickyBg} group-hover:bg-app-hover z-10 text-app-fg font-medium`}>
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${(elementLevels.get(r.id) || 0) * 14}px` }}>
                        {isSummary ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleExpand?.(r.id, e)
                            }}
                            className="p-0.5 hover:bg-app-hover rounded text-violet-500 cursor-pointer"
                          >
                            {expandedNodeIds.has(r.id) ? (
                              <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
                          </div>
                        )}
                        <span className={`truncate max-w-[180px] ${isSummary ? 'font-black text-violet-950 dark:text-violet-200' : 'font-semibold'}`}>
                          {r.name}
                        </span>
                      </div>
                    </td>

                    {!hiddenCols.has('Tag') && (
                      <td className="px-3 py-2.5 border-b border-app-border">
                        {isSummary ? (
                          <span className="text-[9px] font-black text-violet-600 dark:text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                            SUMMARY
                          </span>
                        ) : (
                          <span 
                            className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px] inline-block"
                            title={tagText}
                          >
                            {tagText}
                          </span>
                        )}
                      </td>
                    )}

                    {!hiddenCols.has('RACI') && (
                      <td className="px-3 py-2.5 border-b border-app-border whitespace-nowrap">
                        {responsibleName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                              {responsibleName.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[110px] text-app-subtle" title={responsibleName}>{responsibleName}</span>
                            {isMissingRaci && (
                              <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs">⚠️</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-app-muted text-[10px]">--</span>
                            {isMissingRaci && (
                              <span title="Missing Responsible or Accountable assignment" className="text-amber-500 text-xs">⚠️</span>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {!hiddenCols.has('Start') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.start}</td>
                    )}
                    {!hiddenCols.has('Finish') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.finish}</td>
                    )}
                    {!hiddenCols.has('ES') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.es}</td>
                    )}
                    {!hiddenCols.has('EF') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.ef}</td>
                    )}
                    {!hiddenCols.has('LS') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.ls}</td>
                    )}
                    {!hiddenCols.has('LF') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-bold text-app-fg' : 'text-app-subtle'}`}>{r.lf}</td>
                    )}
                    {!hiddenCols.has('Duration') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-black text-indigo-600 dark:text-indigo-400' : 'text-app-subtle font-semibold'}`}>{r.duration}</td>
                    )}
                    {!hiddenCols.has('Float') && (
                      <td className="px-3 py-2.5 border-b border-app-border whitespace-nowrap">
                        {r.float === '—' ? (
                          <span className="text-app-subtle">—</span>
                        ) : (() => {
                          const floatNum = parseFloat(r.float)
                          const colorClass = floatNum === 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                            : floatNum <= 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          return (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                              {r.float}
                            </span>
                          )
                        })()}
                      </td>
                    )}
                    {showBudgetControls && !hiddenCols.has('Cost') && (
                      <td className={`px-3 py-2.5 border-b border-app-border whitespace-nowrap font-mono text-[11px] ${isSummary ? 'font-black text-violet-600 dark:text-violet-400' : 'text-app-subtle font-semibold'}`}>
                        <CurrencyDisplay amount={r.cost} currency={r.currency} compactThreshold={1000} />
                      </td>
                    )}
                    {!hiddenCols.has('Status') && (
                      <td className="px-3 py-2.5 border-b border-app-border whitespace-nowrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            r.status === 'Complete'
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : r.status === 'In Progress'
                              ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                              : r.status === 'On Hold'
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-app-muted-surface text-app-muted'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
