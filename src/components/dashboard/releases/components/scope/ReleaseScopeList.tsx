'use client'

import { Layers, ListTodo, FileText, Ban, Trash2, FolderKanban, ShieldCheck, UserCheck } from 'lucide-react'
import type { ReleaseScopeItem } from '@/lib/releases/types'

interface ReleaseScopeListProps {
  scopeItems: ReleaseScopeItem[]
  scopeByEpic: Array<[string, { epicName: string; items: ReleaseScopeItem[] }]>
  viewMode: 'all' | 'by_epic'
  labels: { sprintsTerm: string; epicTerm: string; storyTerm: string; storiesTerm: string }
  hasEditAccess: boolean
  onExcludeAutoItem: (item: ReleaseScopeItem) => Promise<void>
  onRemoveOverride: (item: ReleaseScopeItem) => Promise<void>
}

export function ReleaseScopeList({
  scopeItems,
  scopeByEpic,
  viewMode,
  labels,
  hasEditAccess,
  onExcludeAutoItem,
  onRemoveOverride
}: ReleaseScopeListProps) {
  return (
      <div className="border border-app-border rounded-xl overflow-hidden divide-y divide-app-border bg-app-card">
        {scopeItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-app-muted/70 italic">
            No scope items derived yet. Map {labels.sprintsTerm.toLowerCase()} or add manual overrides above.
          </div>
        ) : viewMode === 'by_epic' ? (
          <div className="divide-y divide-app-border">
            {scopeByEpic.map(([epicKey, group]) => (
              <div key={epicKey} className="p-4 space-y-3 bg-app-surface/30">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <FolderKanban className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{labels.epicTerm}: {group.epicName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono font-normal">
                    {group.items.length} {group.items.length === 1 ? labels.storyTerm : labels.storiesTerm}
                  </span>
                </div>

                <div className="divide-y divide-app-border/40 border border-app-border/60 rounded-lg overflow-hidden bg-app-card">
                  {group.items.map((item, idx) => {
                    const isExcluded = item.source === 'excluded'
                    const isManual = item.source === 'manual_override'
                    const isAuto = item.source === 'auto_derived'

                    return (
                      <div
                        key={item.id || idx}
                        className={`group relative flex items-center justify-between p-3 transition-colors hover:bg-app-surface/50 ${
                          isExcluded ? 'opacity-50 bg-rose-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-1.5 rounded-md bg-app-surface text-app-muted shrink-0">
                            {item.entityType === 'wbs_element' && <Layers className="h-3.5 w-3.5 text-purple-400" />}
                            {item.entityType === 'activity' && <ListTodo className="h-3.5 w-3.5 text-emerald-400" />}
                            {item.entityType === 'custom_item' && <FileText className="h-3.5 w-3.5 text-purple-400" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {item.code && (
                                <span className="text-xs font-mono font-bold text-purple-400 shrink-0">
                                  {item.code}
                                </span>
                              )}
                              <span className={`text-xs font-semibold text-app-fg truncate ${isExcluded ? 'line-through text-app-muted' : ''}`}>
                                {item.title}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isAuto && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Auto
                            </span>
                          )}
                          {isManual && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Manual
                            </span>
                          )}
                          {isExcluded && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Excluded
                            </span>
                          )}

                          {hasEditAccess && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isAuto && (
                                <button
                                  type="button"
                                  onClick={() => onExcludeAutoItem(item)}
                                  className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Exclude item"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(isManual || isExcluded) && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveOverride(item)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Remove override"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          scopeItems.map((item, idx) => {
            const isExcluded = item.source === 'excluded'
            const isManual = item.source === 'manual_override'
            const isAuto = item.source === 'auto_derived'

            return (
              <div
                key={item.id || idx}
                className={`group relative flex items-center justify-between p-3.5 transition-colors hover:bg-app-surface/50 ${
                  isExcluded ? 'opacity-50 bg-rose-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-app-surface text-app-muted shrink-0">
                    {item.entityType === 'wbs_element' && <Layers className="h-4 w-4 text-purple-400" />}
                    {item.entityType === 'activity' && <ListTodo className="h-4 w-4 text-emerald-400" />}
                    {item.entityType === 'custom_item' && <FileText className="h-4 w-4 text-purple-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.code && (
                        <span className="text-xs font-mono font-bold text-purple-400 shrink-0">
                          {item.code}
                        </span>
                      )}
                      <span className={`text-xs font-bold text-app-fg truncate ${isExcluded ? 'line-through text-app-muted' : ''}`}>
                        {item.title}
                      </span>
                      {item.parentEpicName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-medium">
                          {labels.epicTerm}: {item.parentEpicName}
                        </span>
                      )}
                    </div>
                    {item.iterationName && (
                      <div className="text-[11px] text-app-muted mt-0.5">
                        Derived from: <span className="font-semibold text-teal-400">{item.iterationName}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-app-muted italic mt-0.5">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {isAuto && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3 text-blue-400" />
                      Auto-Derived
                    </span>
                  )}
                  {isManual && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                      <UserCheck className="h-3 w-3 text-purple-400" />
                      Manual Override
                    </span>
                  )}
                  {isExcluded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                      <Ban className="h-3 w-3 text-rose-400" />
                      Excluded
                    </span>
                  )}

                  {hasEditAccess && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      {isAuto && (
                        <button
                          type="button"
                          onClick={() => onExcludeAutoItem(item)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                          title="Exclude from Release Scope"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {(isManual || isExcluded) && (
                        <button
                          type="button"
                          onClick={() => onRemoveOverride(item)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove manual override / restore default"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
  )
}
