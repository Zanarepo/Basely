import { ChevronDown, ChevronRight } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import type { WbsElement } from '@/lib/wbs/constants'
import { TerminologyDict } from '@/utils/terminology'

type WbsGridMobileCardsProps = {
  visibleGridData: any[]
  elementLevels: Map<string, number>
  elements: WbsElement[]
  selectedIds: string[]
  toggleSelection?: (id: string) => void
  onSelect: (id: string) => void
  onToggleExpand?: (id: string, e: React.MouseEvent) => void
  expandedNodeIds: Set<string>
  terms: TerminologyDict
  showBudgetControls: boolean
}

export function WbsGridMobileCards({
  visibleGridData,
  elementLevels,
  elements,
  selectedIds,
  toggleSelection,
  onSelect,
  onToggleExpand,
  expandedNodeIds,
  terms,
  showBudgetControls
}: WbsGridMobileCardsProps) {
  if (visibleGridData.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-app-muted">
        No schedule items to display.
      </div>
    )
  }

  return (
    <>
      {visibleGridData.map((r) => {
        const hasR = r.raciAssignments?.some((a: any) => a.roleType === 'Responsible')
        const hasA = r.raciAssignments?.some((a: any) => a.roleType === 'Accountable')
        const responsible = r.raciAssignments?.find((a: any) => a.roleType === 'Responsible')
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
      })}
    </>
  )
}
