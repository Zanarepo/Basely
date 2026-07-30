'use client'

import { useState, useEffect } from 'react'
import { Link2, ShieldAlert, GitBranch, Loader2, Folder, ExternalLink, AlertTriangle, ChevronDown, ChevronRight, History } from 'lucide-react'
import { getWbsElements } from '@/lib/wbs/actions'
import { getRaidEntries, type RaidLogEntry } from '@/lib/raid/actions'
import type { WbsElement } from '@/lib/wbs/constants'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

type PredecessorInput = {
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

type WbsDependenciesListProps = {
  isWorkPackage: boolean
  loadingSchedule: boolean
  projectActivities: any[]
  predecessors: PredecessorInput[]
  hasEditAccess: boolean
  saving: boolean
  handleTogglePredecessor: (predId: string, checked: boolean) => void
  handleUpdatePredType: (predId: string, type: 'FS' | 'SS' | 'FF' | 'SF') => void
  handleUpdatePredLag: (predId: string, lag: number) => void
  projectId?: string
  wbsElementId?: string
}

export function WbsDependenciesList({
  isWorkPackage,
  loadingSchedule,
  projectActivities,
  predecessors,
  hasEditAccess,
  saving,
  handleTogglePredecessor,
  handleUpdatePredType,
  handleUpdatePredLag,
  projectId,
  wbsElementId
}: WbsDependenciesListProps) {
  const [loadingRaid, setLoadingRaid] = useState(false)
  const [directRaidItems, setDirectRaidItems] = useState<{ item: RaidLogEntry }[]>([])
  const [inheritedRaidItems, setInheritedRaidItems] = useState<{ item: RaidLogEntry; parentCode: string; parentName: string }[]>([])
  const [showClosedRaid, setShowClosedRaid] = useState(false)

  useEffect(() => {
    if (!projectId || !wbsElementId) return
    let isMounted = true

    const fetchGovernanceBridge = async () => {
      setLoadingRaid(true)
      try {
        const [wbsRes, raidRes] = await Promise.all([
          getWbsElements(projectId),
          getRaidEntries(projectId, 'all')
        ])

        if (!isMounted) return

        if (wbsRes.ok && wbsRes.data && raidRes.ok && raidRes.data) {
          const allWbs = wbsRes.data
          const allRaid = raidRes.data

          // 1. Build set of ancestor IDs for hierarchical inheritance
          const ancestorIds = new Set<string>()
          const ancestorMap = new Map<string, WbsElement>()
          let currentId: string | undefined = wbsElementId
          while (currentId) {
            const el = allWbs.find((w: WbsElement) => w.id === currentId)
            if (!el || !el.parentId) break
            ancestorIds.add(el.parentId)
            const parent = allWbs.find((w: WbsElement) => w.id === el.parentId)
            if (parent) ancestorMap.set(parent.id, parent)
            currentId = el.parentId
          }

          // 2. Classify RAID items as direct or inherited
          const direct: { item: RaidLogEntry }[] = []
          const inherited: { item: RaidLogEntry; parentCode: string; parentName: string }[] = []

          allRaid.forEach((item: RaidLogEntry) => {
            if (!item.linked_wbs_element_id) return
            const linkedIds = item.linked_wbs_element_id.split(',').map((s: string) => s.trim()).filter(Boolean)

            if (linkedIds.includes(wbsElementId)) {
              direct.push({ item })
            } else {
              // Check if any of our ancestors are linked to this RAID item
              for (const id of linkedIds) {
                if (ancestorIds.has(id)) {
                  const p = ancestorMap.get(id) || allWbs.find((w: WbsElement) => w.id === id)
                  inherited.push({
                    item,
                    parentCode: p?.code || 'Parent',
                    parentName: p?.name || 'Folder'
                  })
                  break // avoid duplicates
                }
              }
            }
          })

          setDirectRaidItems(direct)
          setInheritedRaidItems(inherited)
        }
      } catch (err) {
        console.error('Error calculating hierarchical RAID governance bridge:', err)
      } finally {
        if (isMounted) setLoadingRaid(false)
      }
    }

    fetchGovernanceBridge()
    return () => { isMounted = false }
  }, [projectId, wbsElementId])

  if (loadingSchedule) return null

  return (
    <div className="space-y-5 pt-2 border-t border-indigo-500/10">
      {/* 1. Mathematical Schedule Predecessors (Only applicable to atomic Work Packages) */}
      {isWorkPackage && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-app-subtle flex items-center gap-1" title="Mathematical schedule logic for Gantt chart & Critical Path">
            <Link2 className="w-3.5 h-3.5" />
            Schedule Predecessors (Intra-Project Gantt Logic)
          </label>
          
          {projectActivities.length === 0 ? (
            <p className="text-[10px] text-app-subtle italic">No other tasks available to link.</p>
          ) : (
            <div className="max-h-36 overflow-y-auto border border-app-border rounded-xl p-2.5 bg-app-input space-y-2">
              {projectActivities.map((act) => {
                const isLinked = predecessors.some((p) => p.predecessorId === act.id)
                const currentPred = predecessors.find((p) => p.predecessorId === act.id)

                return (
                  <div key={act.id} className="flex flex-col gap-1.5 pb-2 border-b border-app-border/40 last:border-b-0">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isLinked}
                        disabled={!hasEditAccess || saving}
                        onChange={(e) => handleTogglePredecessor(act.id, e.target.checked)}
                        className="rounded-xs border-app-border text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate flex-1 font-semibold text-app-fg">{act.name}</span>
                    </label>

                    {isLinked && currentPred && (
                      <div className="pl-5 flex items-center gap-2 animate-in fade-in duration-150">
                        <div className="w-44">
                          <EnterpriseSelect
                            value={currentPred.type}
                            disabled={!hasEditAccess || saving}
                            onChange={(val) => handleUpdatePredType(act.id, val as any)}
                            size="sm"
                            options={[
                              { value: 'FS', label: 'Finish-to-Start (FS)' },
                              { value: 'SS', label: 'Start-to-Start (SS)' },
                              { value: 'FF', label: 'Finish-to-Finish (FF)' },
                              { value: 'SF', label: 'Start-to-Finish (SF)' }
                            ]}
                            placeholder="Dependency type..."
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-app-subtle">Lag:</span>
                          <input
                            type="number"
                            min="0"
                            value={currentPred.lagDays}
                            disabled={!hasEditAccess || saving}
                            onChange={(e) => handleUpdatePredLag(act.id, parseInt(e.target.value) || 0)}
                            className="w-10 px-1 py-0.5 bg-app-surface-solid border border-app-border rounded-lg text-center text-[10px] text-app-fg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. RAID Governance Bridge (Direct & Hierarchically Inherited Blockers) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold uppercase text-amber-400 dark:text-amber-300 flex items-center gap-1 tracking-wider">
            <GitBranch className="w-3.5 h-3.5 text-amber-500" />
            External RAID Governance Bridge
          </label>
          {projectId && (
            <a
              href={`/dashboard/projects/${projectId}?tab=raid`}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline inline-flex items-center gap-0.5"
            >
              <span>View RAID Log</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {loadingRaid ? (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center gap-2 text-xs text-app-muted">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Calculating hierarchical governance dependencies...</span>
          </div>
        ) : (directRaidItems.length === 0 && inheritedRaidItems.length === 0) ? (
          <div className="p-3.5 rounded-xl bg-app-surface/60 border border-app-border text-xs text-app-subtle space-y-1.5">
            <p className="font-semibold text-app-fg flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              Zero External Blockers Linked
            </p>
            <p className="text-[11px] leading-relaxed">
              No external vendor blockers, regulatory risks, or cross-team issues are linked directly to this deliverable or inherited from its parent folders.
            </p>
          </div>
        ) : (
          (() => {
            const activeDirect = directRaidItems.filter(({ item }) => item.status !== 'closed')
            const closedDirect = directRaidItems.filter(({ item }) => item.status === 'closed')
            const activeInherited = inheritedRaidItems.filter(({ item }) => item.status !== 'closed')
            const closedInherited = inheritedRaidItems.filter(({ item }) => item.status === 'closed')
            const totalActive = activeDirect.length + activeInherited.length
            const totalClosed = closedDirect.length + closedInherited.length

            return (
              <div className="space-y-2.5">
                {totalActive === 0 && totalClosed > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>All linked external dependencies have been resolved and closed!</span>
                  </div>
                )}

                {totalActive > 0 && (
                  <div className="space-y-2">
                    {activeDirect.map(({ item }) => (
                      <div key={item.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 animate-in fade-in duration-200 shadow-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            DIRECT LINK
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-app-fg leading-relaxed">
                          <strong className="text-amber-700 dark:text-amber-400 font-extrabold uppercase mr-1">[{item.category}]:</strong>
                          <span className="font-bold">{item.title}</span>
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-app-muted line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-app-subtle pt-1.5 border-t border-amber-500/20">
                          <span>Owner: <strong className="text-app-fg">{item.external_owner_name || 'Team Managed'}</strong></span>
                          {item.target_resolution_date && (
                            <span>Target: <strong>{item.target_resolution_date}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}

                    {activeInherited.map(({ item, parentCode, parentName }) => (
                      <div key={`${item.id}-inherit`} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2 animate-in fade-in duration-200 shadow-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1" title={`Inherited from parent folder ${parentCode}: ${parentName}`}>
                            <Folder className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            INHERITED FROM PARENT [{parentCode}]
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30 uppercase">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-app-fg leading-relaxed">
                          <strong className="text-purple-700 dark:text-purple-400 font-extrabold uppercase mr-1">[{item.category}]:</strong>
                          <span className="font-bold">{item.title}</span>
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-app-muted line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-app-subtle pt-1.5 border-t border-purple-500/20">
                          <span>Owner: <strong className="text-app-fg">{item.external_owner_name || 'Team Managed'}</strong></span>
                          {item.target_resolution_date && (
                            <span>Target: <strong>{item.target_resolution_date}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalClosed > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClosedRaid(!showClosedRaid)}
                      className="w-full py-2 px-3 rounded-xl bg-app-input/60 hover:bg-app-input border border-app-border text-app-muted hover:text-app-fg text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resolved Governance History ({totalClosed})</span>
                      </span>
                      {showClosedRaid ? <ChevronDown className="w-4 h-4 text-app-muted" /> : <ChevronRight className="w-4 h-4 text-app-muted" />}
                    </button>

                    {showClosedRaid && (
                      <div className="mt-2 space-y-2 pl-2 border-l-2 border-dashed border-app-border/80 animate-in fade-in duration-200">
                        {closedDirect.map(({ item }) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-app-input/40 border border-app-border/70 opacity-75 hover:opacity-100 transition-opacity space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/20">
                                RESOLVED DIRECT
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase">
                                CLOSED
                              </span>
                            </div>
                            <p className="text-app-muted line-through">
                              <strong className="text-slate-500 uppercase mr-1">[{item.category}]:</strong>
                              {item.title}
                            </p>
                          </div>
                        ))}
                        {closedInherited.map(({ item, parentCode }) => (
                          <div key={`${item.id}-inherit`} className="p-2.5 rounded-xl bg-app-input/40 border border-app-border/70 opacity-75 hover:opacity-100 transition-opacity space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/20">
                                RESOLVED INHERITED [{parentCode}]
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase">
                                CLOSED
                              </span>
                            </div>
                            <p className="text-app-muted line-through">
                              <strong className="text-slate-500 uppercase mr-1">[{item.category}]:</strong>
                              {item.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
