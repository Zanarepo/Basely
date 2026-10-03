import { ChevronDown, Check, Archive } from 'lucide-react'
import type { Iteration } from '@/lib/releases/types'
import type { WbsElement } from '@/lib/wbs/constants'
import type { ScopeFilterType } from './hooks/useWbsBoardFilter'

type WbsBoardHeaderProps = {
  scopeFilter: ScopeFilterType
  setScopeFilter: (filter: ScopeFilterType) => void
  filterDropdownOpen: boolean
  setFilterDropdownOpen: (open: boolean) => void
  isAgile: boolean
  activeIteration: Iteration | null | undefined
  iterations: Iteration[]
  finalElements: WbsElement[]
  hideCompleted: boolean
  completedCount: number
  onToggleHideCompleted?: () => void
  terms: import('@/utils/terminology').TerminologyDict
}

export function WbsBoardHeader({
  scopeFilter,
  setScopeFilter,
  filterDropdownOpen,
  setFilterDropdownOpen,
  isAgile,
  activeIteration,
  iterations,
  finalElements,
  hideCompleted,
  completedCount,
  onToggleHideCompleted,
  terms,
}: WbsBoardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-purple-500/50 transition-all cursor-pointer shadow-2xs"
          >
            <span className="truncate">
              {scopeFilter === 'active'
                ? activeIteration
                  ? `${isAgile ? 'Active Sprint' : 'Active Phase'}: ${activeIteration.name}`
                  : isAgile
                  ? 'Active Sprint'
                  : 'Active Phase'
                : scopeFilter === 'all'
                ? 'Full Master Scope'
                : scopeFilter === 'backlog'
                ? 'Unassigned Backlog'
                : scopeFilter === 'lookahead'
                ? '3-Week Schedule Window'
                : iterations.find((i) => i.id === scopeFilter)?.name || 'Filtered Scope'}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              {finalElements.filter((e) => e.isWorkPackage && e.duration !== 0).length} {terms.workPackages}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Sleek Lightweight Dropdown Menu */}
          {filterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setFilterDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-1.5 space-y-1 animate-in fade-in duration-150">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {isAgile ? 'Scope Filter' : 'Phase & Execution Window'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScopeFilter('active')
                    setFilterDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    scopeFilter === 'active'
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <span>{isAgile ? 'Active Sprint' : 'Active Phase'}</span>
                  {scopeFilter === 'active' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>

                {!isAgile && (
                  <button
                    type="button"
                    onClick={() => {
                      setScopeFilter('lookahead')
                      setFilterDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      scopeFilter === 'lookahead'
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <span>3-Week Schedule Window</span>
                    {scopeFilter === 'lookahead' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>
                )}

                {iterations.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1 space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {isAgile ? 'Sprints' : 'Phases'}
                    </div>
                    {iterations.map((iter) => (
                      <button
                        key={iter.id}
                        type="button"
                        onClick={() => {
                          setScopeFilter(iter.id)
                          setFilterDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          scopeFilter === iter.id
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <span className="truncate">{iter.name}</span>
                        {scopeFilter === iter.id && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setScopeFilter('backlog')
                      setFilterDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      scopeFilter === 'backlog'
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <span>Unassigned Backlog</span>
                    {scopeFilter === 'backlog' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScopeFilter('all')
                      setFilterDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      scopeFilter === 'all'
                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <span>Full Master Scope</span>
                    {scopeFilter === 'all' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Archive Completed Toggle Pill */}
        {onToggleHideCompleted && (
          <button
            type="button"
            onClick={onToggleHideCompleted}
            className={`p-2 rounded-xl border transition-all cursor-pointer relative shrink-0 shadow-2xs ${
              hideCompleted
                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
            }`}
            title={hideCompleted ? `Showing active work (${completedCount} completed items archived)` : `Hide ${completedCount} completed items`}
          >
            <Archive className="w-4 h-4" />
            {completedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-extrabold text-white shadow-xs">
                {completedCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
