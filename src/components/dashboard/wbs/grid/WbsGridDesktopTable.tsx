import { ChevronDown, ChevronRight } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import type { WbsElement } from '@/lib/wbs/constants'
import { TerminologyDict } from '@/utils/terminology'

type WbsGridDesktopTableProps = {
  visibleGridData: any[]
  elementLevels: Map<string, number>
  elements: WbsElement[]
  selectedIds: string[]
  toggleSelection?: (id: string) => void
  selectAll?: () => void
  clearSelection?: () => void
  isAllSelected: boolean
  onSelect: (id: string) => void
  onToggleExpand?: (id: string, e: React.MouseEvent) => void
  expandedNodeIds: Set<string>
  hiddenCols: Set<string>
  showBudgetControls: boolean
  terms: TerminologyDict
  metrics: {
    allWorkPackages: any[]
    globalEarliestStart: string
    globalLatestFinish: string
    globalEarliestLS: string
    globalLatestLF: string
    globalTotalDuration: string
    globalMinFloat: number | null
    globalTotalCost: number
    completedCount: number
    overallProgressPct: number
    projectCurrency: string
  }
}

export function WbsGridDesktopTable({
  visibleGridData,
  elementLevels,
  elements,
  selectedIds,
  toggleSelection,
  selectAll,
  clearSelection,
  isAllSelected,
  onSelect,
  onToggleExpand,
  expandedNodeIds,
  hiddenCols,
  showBudgetControls,
  terms,
  metrics
}: WbsGridDesktopTableProps) {
  const {
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
  } = metrics

  return (
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
            const hasR = r.raciAssignments?.some((a: any) => a.roleType === 'Responsible')
            const hasA = r.raciAssignments?.some((a: any) => a.roleType === 'Accountable')
            const responsible = r.raciAssignments?.find((a: any) => a.roleType === 'Responsible')
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
  )
}
