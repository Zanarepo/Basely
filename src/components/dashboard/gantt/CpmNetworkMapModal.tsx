'use client'

import { useState } from 'react'
import { X, Network, Link2, Info, CheckCircle2, AlertCircle, LayoutGrid, Table } from 'lucide-react'
import type { Activity, Dependency } from '@/lib/schedule/cpm'
import { CpmNetworkTable } from './CpmNetworkTable'

type CpmNetworkMapModalProps = {
  isOpen: boolean
  onClose: () => void
  activities: Activity[]
  dependencies: Dependency[]
  elements: any[]
}

export function CpmNetworkMapModal({
  isOpen,
  onClose,
  activities,
  dependencies,
  elements,
}: CpmNetworkMapModalProps) {
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map')

  if (!isOpen) return null

  // Map WBS element names for quick lookup
  const elLookup = new Map<string, string>()
  elements.forEach((el) => elLookup.set(el.id, el.name))

  // Sort activities chronologically by Early Start (ES)
  const sortedActs = [...activities].sort((a, b) => {
    if (!a.es) return 1
    if (!b.es) return -1
    return new Date(a.es).getTime() - new Date(b.es).getTime()
  })

  // Format date helper
  const fmt = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content container */}
      <div className="fixed inset-10 z-55 bg-app-bg text-app-fg border border-app-border rounded-3xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-app-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-app-fg">
                CPM Network Diagram & Critical Path Analysis
              </h3>
              <p className="text-xs text-app-subtle">
                Visualizing the Forward & Backward pass schedules of project work packages.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-app-input rounded-lg p-1 border border-app-border">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'map' ? 'bg-app-surface text-app-fg shadow-sm' : 'text-app-subtle hover:text-app-fg'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Map View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-app-surface text-app-fg shadow-sm' : 'text-app-subtle hover:text-app-fg'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table View
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-8 pr-2">
          
          {/* Legend and Summary Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            {/* Textbook Node Diagram Legend */}
            <div className="bg-app-muted-surface border border-app-border rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-app-subtle uppercase tracking-wider mb-3">
                Textbook Node Legend
              </span>
              <div className="w-52 border border-slate-400 dark:border-slate-700 rounded-xl overflow-hidden text-[10px] bg-app-surface text-center">
                {/* ES | Dur | EF */}
                <div className="grid grid-cols-3 border-b border-slate-400 dark:border-slate-700 bg-app-muted-surface">
                  <div className="p-1 border-r border-slate-400 dark:border-slate-700 font-semibold" title="Early Start">ES</div>
                  <div className="p-1 border-r border-slate-400 dark:border-slate-700 font-semibold" title="Duration">Dur (d)</div>
                  <div className="p-1 font-semibold" title="Early Finish">EF</div>
                </div>
                {/* Task Name */}
                <div className="p-2.5 font-bold text-app-fg border-b border-slate-400 dark:border-slate-700">
                  Task Element Name
                </div>
                {/* LS | Float | LF */}
                <div className="grid grid-cols-3 bg-app-muted-surface">
                  <div className="p-1 border-r border-slate-400 dark:border-slate-700 font-semibold" title="Late Start">LS</div>
                  <div className="p-1 border-r border-slate-400 dark:border-slate-700 font-semibold" title="Total Float">Float</div>
                  <div className="p-1 font-semibold" title="Late Finish">LF</div>
                </div>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-app-muted-surface border border-app-border rounded-2xl p-4 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2 text-indigo-500">
                <Info className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">Forward & Backward Passes</span>
              </div>
              <p className="text-[11px] text-app-subtle leading-relaxed">
                The **Forward Pass** calculates Early Start (ES) and Early Finish (EF) from the project start date. 
                The **Backward Pass** calculates Late Start (LS) and Late Finish (LF) based on successor limits. 
                **Total Float** represents the number of days a task can slip without delaying the project.
              </p>
            </div>

            {/* Critical Path metrics */}
            <div className="bg-app-muted-surface border border-app-border rounded-2xl p-4 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">Critical Path Highlights</span>
              </div>
              <p className="text-[11px] text-app-subtle leading-relaxed">
                Nodes with **Float = 0** are critical. If any critical task slips by even 1 day, the entire project finish date slips. They are bordered in glowing red.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-app-fg">Critical Tasks:</span>
                <span className="text-xs font-bold text-rose-500 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25">
                  {activities.filter(a => a.isCritical).length} Tasks
                </span>
              </div>
            </div>
          </div>

          {/* Conditional Rendering: Grid or Table */}
          {viewMode === 'table' ? (
            <div>
               <span className="text-xs font-bold text-app-subtle uppercase tracking-wider block mb-4">
                Tabular Activity List
              </span>
              <CpmNetworkTable activities={sortedActs} dependencies={dependencies} elLookup={elLookup} />
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-app-subtle uppercase tracking-wider block mb-4">
                Chronological Activity Diagram
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedActs.map((act) => {
                  const isCritical = act.isCritical
                  const wbsName = elLookup.get(act.wbsElementId) || act.name
                  
                  // Find predecessors
                  const preds = dependencies
                    .filter(d => d.successorId === act.id)
                    .map(d => {
                      const predAct = activities.find(a => a.id === d.predecessorId)
                      return predAct ? { name: elLookup.get(predAct.wbsElementId) || predAct.name, type: d.type } : null
                    })
                    .filter(Boolean) as { name: string, type: string }[]

                  // Find successors
                  const succs = dependencies
                    .filter(d => d.predecessorId === act.id)
                    .map(d => {
                      const succAct = activities.find(a => a.id === d.successorId)
                      return succAct ? (elLookup.get(succAct.wbsElementId) || succAct.name) : null
                    })
                    .filter(Boolean) as string[]

                  return (
                    <div
                      key={act.id}
                      className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                        isCritical
                          ? 'border-rose-500/60 bg-rose-500/5 shadow-md shadow-rose-500/5'
                          : 'border-app-border bg-app-surface shadow-xs'
                      }`}
                    >
                      {/* Textbook Activity Node Block */}
                      <div className={`w-full border rounded-xl overflow-hidden text-[11px] text-center ${
                        isCritical
                          ? 'border-rose-500 bg-rose-950/20'
                          : 'border-slate-400 dark:border-slate-700 bg-app-input'
                      }`}>
                        {/* Row 1: ES | Duration | EF */}
                        <div className={`grid grid-cols-3 border-b ${
                          isCritical ? 'border-rose-500 bg-rose-950/40' : 'border-slate-400 dark:border-slate-700 bg-app-muted-surface'
                        }`}>
                          <div className="p-1 border-r border-inherit font-semibold" title={`ES: ${act.es}`}>{fmt(act.es)}</div>
                          <div className="p-1 border-r border-inherit font-semibold">{act.duration}d</div>
                          <div className="p-1 font-semibold" title={`EF: ${act.ef}`}>{fmt(act.ef)}</div>
                        </div>
                        
                        {/* Row 2: Name */}
                        <div className="p-2 font-bold text-app-fg truncate max-w-[280px]">
                          {wbsName}
                        </div>

                        {/* Row 3: LS | Float | LF */}
                        <div className={`grid grid-cols-3 border-t ${
                          isCritical ? 'border-rose-500 bg-rose-950/40' : 'border-slate-400 dark:border-slate-700 bg-app-muted-surface'
                        }`}>
                          <div className="p-1 border-r border-inherit font-semibold" title={`LS: ${act.ls}`}>{fmt(act.ls)}</div>
                          <div className={`p-1 border-r border-inherit font-bold ${isCritical ? 'text-rose-500' : 'text-indigo-500'}`}>
                            {act.totalFloat !== null ? `${act.totalFloat}d` : '—'}
                          </div>
                          <div className="p-1 font-semibold" title={`LF: ${act.lf}`}>{fmt(act.lf)}</div>
                        </div>
                      </div>

                      {/* Predecessors / Successors Details */}
                      <div className="space-y-1.5 text-[10px] text-app-subtle">
                        {preds.length > 0 && (
                          <div className="flex items-start gap-1">
                            <span className="font-bold text-app-fg shrink-0">Predecessors:</span>
                            <span className="truncate">
                              {preds.map(p => `${p.name} (${p.type})`).join(', ')}
                            </span>
                          </div>
                        )}
                        {succs.length > 0 && (
                          <div className="flex items-start gap-1">
                            <span className="font-bold text-app-fg shrink-0">Successors:</span>
                            <span className="truncate">{succs.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-app-border flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary py-2 px-5 rounded-xl font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>

      </div>
    </>
  )
}
