import React from 'react'
import {
  Layers,
  FolderKanban,
  ListTodo,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban
} from 'lucide-react'
import type { ReleaseScopeItem } from '@/lib/releases/types'
import { isStatusCompleted, isStatusInProgress, isStatusBlocked } from '../../hooks/useSimplifiedReleasePipeline'

interface StepScopeEpicsProps {
  scopeCompletionPercent: number
  completedScopeCount: number
  inProgressScopeCount: number
  notStartedScopeCount: number
  activeScopeItemsLength: number
  labels: { epicsTerm: string; sprintsTerm: string; storiesTerm: string; epicTerm: string; storyTerm: string; releaseTerm: string; sprintTerm: string; }
  scopeByEpic: [string, { epicName: string; items: ReleaseScopeItem[] }][]
  hasEditAccess: boolean
  releaseId: string
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
}

export function StepScopeEpics({
  scopeCompletionPercent,
  completedScopeCount,
  inProgressScopeCount,
  notStartedScopeCount,
  activeScopeItemsLength,
  labels,
  scopeByEpic,
  hasEditAccess,
  releaseId,
  onAddManualScope
}: StepScopeEpicsProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Deliverables Progress: {scopeCompletionPercent}% Complete
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Tracking real-time status of all {labels.storiesTerm.toLowerCase()} in mapped {labels.sprintsTerm.toLowerCase()}.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {completedScopeCount} Completed
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              {inProgressScopeCount} In Progress
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {notStartedScopeCount} Not Started
            </span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${activeScopeItemsLength > 0 ? (completedScopeCount / activeScopeItemsLength) * 100 : 0}%` }}
            title={`${completedScopeCount} Completed`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${activeScopeItemsLength > 0 ? (inProgressScopeCount / activeScopeItemsLength) * 100 : 0}%` }}
            title={`${inProgressScopeCount} In Progress`}
          />
        </div>
      </div>

      {scopeByEpic.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/30">
          <Layers className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No deliverables mapped yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Attach {labels.sprintsTerm.toLowerCase()} to this {labels.releaseTerm.toLowerCase()} or tag {labels.storiesTerm.toLowerCase()} to mapped {labels.sprintsTerm.toLowerCase()} to see scope items automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scopeByEpic.map(([epicKey, group]) => {
            const epicDoneCount = group.items.filter((i) => isStatusCompleted(i.status)).length
            const epicPercent = Math.round((epicDoneCount / group.items.length) * 100)

            return (
              <div
                key={epicKey}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderKanban className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {labels.epicTerm}: {group.epicName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>
                        {epicDoneCount}/{group.items.length} Done ({epicPercent}%)
                      </span>
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${epicPercent}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
                      {group.items.length} {group.items.length === 1 ? labels.storyTerm : labels.storiesTerm}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {group.items.map((item) => {
                    const isDone = isStatusCompleted(item.status)
                    const isInProgress = isStatusInProgress(item.status)
                    const isBlocked = isStatusBlocked(item.status)

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {item.entityType === 'wbs_element' && (
                              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            )}
                            {item.entityType === 'activity' && (
                              <ListTodo className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {item.entityType === 'custom_item' && (
                              <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                                {item.code ? `[${item.code}] ` : ''}
                                {item.title}
                              </span>
                            </div>
                            {item.iterationName && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {labels.sprintTerm}:{' '}
                                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                  {item.iterationName}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {isDone ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Completed
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              In Progress
                            </span>
                          ) : isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              Blocked
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Not Started
                            </span>
                          )}

                          {hasEditAccess && (
                            <button
                              type="button"
                              onClick={() =>
                                onAddManualScope(
                                  releaseId,
                                  item.entityType,
                                  item.title,
                                  'excluded',
                                  item.entityId,
                                  'Excluded by PM'
                                )
                              }
                              className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                              title="Exclude item from release"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Exclude</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
