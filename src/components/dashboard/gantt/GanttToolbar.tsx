'use client'

import { useState, useMemo } from 'react'
import { Calendar, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen, Edit3, Trash2, ChevronDown, Check, Archive } from 'lucide-react'
import { GanttToolbarMoreMenu } from './GanttToolbarMoreMenu'
import type { Iteration } from '@/lib/releases/types'

type GanttToolbarProps = {
  zoom: 'day' | 'week' | 'month' | 'quarter'
  setZoom: React.Dispatch<React.SetStateAction<'day' | 'week' | 'month' | 'quarter'>>
  baselines: any[]
  pendingBaselines: any[]
  showBaseline: boolean
  setShowBaseline: React.Dispatch<React.SetStateAction<boolean>>
  selectedBaselineId: string
  setSelectedBaselineId: (id: string) => void
  hasEditAccess: boolean
  onSaveBaseline: () => void
  onDeleteBaseline: (id: string) => void
  onRenameBaseline: (id: string, currentName: string) => void
  onOpenNetworkMap: () => void
  onOpenScheduleSheet: () => void
  onExportChart: () => void
  showSidebar: boolean
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>
  iterations?: Iteration[]
  scopeFilter?: string
  setScopeFilter?: (scope: string) => void
  methodology?: string | null
  filteredCount?: number
  workPackagesTerm?: string
  hideCompleted?: boolean
  onToggleHideCompleted?: () => void
  completedCount?: number
}

export function GanttToolbar({
  zoom,
  setZoom,
  baselines,
  pendingBaselines,
  showBaseline,
  setShowBaseline,
  selectedBaselineId,
  setSelectedBaselineId,
  hasEditAccess,
  onSaveBaseline,
  onDeleteBaseline,
  onRenameBaseline,
  onOpenNetworkMap,
  onOpenScheduleSheet,
  onExportChart,
  showSidebar,
  setShowSidebar,
  iterations = [],
  scopeFilter = 'all',
  setScopeFilter,
  methodology = 'Agile',
  filteredCount,
  workPackagesTerm,
  hideCompleted = false,
  onToggleHideCompleted,
  completedCount = 0,
}: GanttToolbarProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const isAgile = methodology === 'Agile' || methodology === 'Hybrid'

  const activeIteration = useMemo(() => {
    if (!iterations || iterations.length === 0) return null
    const now = new Date()
    const current = iterations.find((i) => new Date(i.startDate) <= now && new Date(i.endDate) >= now)
    return current || iterations[0]
  }, [iterations])

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-app-surface-solid border border-app-border rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs min-w-0">
      {/* Left Side: Compact Title & Sidebar Toggle */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setShowSidebar((prev) => !prev)}
          className="p-1.5 bg-app-surface hover:bg-app-hover border border-app-border rounded-xl transition-colors cursor-pointer shrink-0"
          title={showSidebar ? "Hide details sidebar" : "Show details sidebar"}
        >
          {showSidebar ? <PanelLeftClose className="w-4 h-4 text-violet-500" /> : <PanelLeftOpen className="w-4 h-4 text-violet-500" />}
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-5 h-5 text-violet-500 hidden sm:block shrink-0" />
          <h2 className="text-sm font-extrabold text-app-fg leading-tight truncate">Gantt Timeline</h2>
        </div>
      </div>

      {/* Right Side: Compact Controls Container */}
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {/* Smart Scope Selector Pill */}
        {setScopeFilter && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-xl bg-app-surface border border-app-border text-xs font-bold text-app-fg hover:border-purple-500/40 transition-all cursor-pointer shadow-2xs max-w-[210px]"
            >
              <span className="truncate max-w-[110px] sm:max-w-[140px]">
                {scopeFilter === 'active'
                  ? activeIteration
                    ? `${isAgile ? 'Active Sprint' : 'Active Phase'}: ${activeIteration.name}`
                    : isAgile
                    ? 'Active Sprint'
                    : 'Active Phase'
                  : scopeFilter === 'all'
                  ? 'Full Master Schedule'
                  : scopeFilter === 'backlog'
                  ? 'Unassigned Backlog'
                  : scopeFilter === 'lookahead'
                  ? '3-Week Schedule Window'
                  : iterations.find((i) => i.id === scopeFilter)?.name || 'Filtered Scope'}
              </span>

              {filteredCount !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 shrink-0">
                  {filteredCount} {workPackagesTerm || 'Items'}
                </span>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {filterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setFilterDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Gantt Timeline Scope
                  </div>

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
                    <span>Full Master Schedule</span>
                    {scopeFilter === 'all' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>

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
                      <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

                  <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1">
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
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Compact Archive Completed Toggle Button */}
        {onToggleHideCompleted && (
          <button
            type="button"
            onClick={onToggleHideCompleted}
            className={`p-2 rounded-xl border transition-all cursor-pointer relative shrink-0 shadow-2xs ${
              hideCompleted
                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                : 'bg-app-surface text-app-subtle border-app-border hover:text-app-fg hover:bg-app-hover'
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

        {/* Zoom controls */}
        <div className="flex items-center h-9 bg-app-surface border border-app-border rounded-xl px-1 shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => (z === 'quarter' ? 'month' : z === 'month' ? 'week' : 'day'))}
            disabled={zoom === 'day'}
            className="p-1 rounded-lg hover:bg-app-hover border border-transparent disabled:opacity-30 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold px-2 text-app-fg capitalize whitespace-nowrap">{zoom} View</span>
          <button
            type="button"
            onClick={() => setZoom((z) => (z === 'day' ? 'week' : z === 'week' ? 'month' : 'quarter'))}
            disabled={zoom === 'quarter'}
            className="p-1 rounded-lg hover:bg-app-hover border border-transparent disabled:opacity-30 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Baseline Toggle Panel */}
        {(baselines.length > 0 || pendingBaselines.length > 0) && (
          <div className="flex items-center h-9 bg-app-surface border border-app-border rounded-xl px-2.5 transition-colors hover:border-purple-500/40 shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-app-fg whitespace-nowrap">
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={(e) => setShowBaseline(e.target.checked)}
                className="rounded text-violet-500 focus:ring-violet-500/50 cursor-pointer border-app-border bg-app-surface"
              />
              Baseline:
            </label>
            <select
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              className="bg-transparent border-0 py-0 pl-1 pr-4 text-xs font-bold text-violet-500 focus:ring-0 cursor-pointer disabled:opacity-50 max-w-[110px] truncate"
              disabled={!showBaseline}
            >
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              {pendingBaselines.map((pb) => (
                <option key={pb.id} value="" disabled className="text-amber-500">
                  (Pending) {pb.payload?.baseline?.name || 'Unnamed Baseline'}
                </option>
              ))}
            </select>
            {showBaseline && selectedBaselineId && hasEditAccess && (
              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-app-border">
                <button
                  type="button"
                  onClick={() => {
                    const b = baselines.find(b => b.id === selectedBaselineId)
                    if (b) onRenameBaseline(b.id, b.name)
                  }}
                  className="p-0.5 text-app-muted hover:text-violet-500 hover:bg-app-surface transition-colors rounded cursor-pointer"
                  title="Rename Baseline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBaseline(selectedBaselineId)}
                  className="p-0.5 text-app-muted hover:text-rose-500 hover:bg-app-surface transition-colors rounded cursor-pointer"
                  title="Delete Baseline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Re-added More Actions Menu (...) Button inline */}
        <GanttToolbarMoreMenu 
          hasEditAccess={hasEditAccess}
          onSaveBaseline={onSaveBaseline}
          onOpenNetworkMap={onOpenNetworkMap}
          onOpenScheduleSheet={onOpenScheduleSheet}
          onExportChart={onExportChart}
        />
      </div>
    </div>
  )
}
