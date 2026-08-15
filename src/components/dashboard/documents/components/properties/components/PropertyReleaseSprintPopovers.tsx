import React from 'react'
import { Rocket, Clock, Check } from 'lucide-react'

interface ReleaseItem {
  id: string
  name: string
  version?: string
}

interface IterationItem {
  id: string
  name: string
}

interface PropertyReleaseSprintPopoversProps {
  targetRelease: string
  targetSprint: string
  projectReleases: ReleaseItem[]
  projectIterations: IterationItem[]
  releaseInput: string
  setReleaseInput: (val: string) => void
  sprintInput: string
  setSprintInput: (val: string) => void
  hasEditAccess: boolean
  activePopover: 'release' | 'sprint' | null
  onToggleRelease: () => void
  onToggleSprint: () => void
  onSelectRelease: (val: string) => void
  onSelectSprint: (val: string) => void
}

export function PropertyReleaseSprintPopovers({
  targetRelease,
  targetSprint,
  projectReleases,
  projectIterations,
  releaseInput,
  setReleaseInput,
  sprintInput,
  setSprintInput,
  hasEditAccess,
  activePopover,
  onToggleRelease,
  onToggleSprint,
  onSelectRelease,
  onSelectSprint,
}: PropertyReleaseSprintPopoversProps) {
  return (
    <>
      {/* 🚀 Target Release Selector */}
      <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
        <div className="flex items-center gap-1.5 text-app-muted">
          <Rocket className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-semibold text-app-fg text-xs">Target Release:</span>
        </div>

        <button
          type="button"
          style={{ cursor: 'pointer' }}
          disabled={!hasEditAccess}
          onClick={onToggleRelease}
          className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:bg-app-hover text-app-fg transition-colors cursor-pointer border border-transparent hover:border-app-border"
        >
          {targetRelease || 'Release 0 (Unassigned)'}
        </button>

        {activePopover === 'release' && (
          <div className="absolute left-0 top-full mt-1.5 w-60 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-1">
              Select Target Release
            </span>

            {projectReleases.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {projectReleases.map((rel) => {
                  const valStr = rel.version ? `${rel.name} (${rel.version})` : rel.name
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectRelease(valStr)}
                      className="w-full flex items-center justify-between p-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <span className="truncate">{valStr}</span>
                      {targetRelease === valStr && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-[11px] text-app-muted italic px-1">
                No active releases created in project settings.
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-1 mb-1">
                Custom Release Label:
              </span>
              <input
                type="text"
                value={releaseInput}
                onChange={(e) => setReleaseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectRelease(releaseInput)
                }}
                placeholder="e.g. Release 3 or v2.1..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ⚡ Sprint Selector */}
      <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
        <div className="flex items-center gap-1.5 text-app-muted">
          <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="font-semibold text-app-fg text-xs">Sprint:</span>
        </div>

        <button
          type="button"
          style={{ cursor: 'pointer' }}
          disabled={!hasEditAccess}
          onClick={onToggleSprint}
          className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:bg-app-hover text-app-fg transition-colors cursor-pointer border border-transparent hover:border-app-border"
        >
          {targetSprint || 'Sprint 1'}
        </button>

        {activePopover === 'sprint' && (
          <div className="absolute left-0 top-full mt-1.5 w-60 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-1">
              Select Iteration Sprint
            </span>

            {projectIterations.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {projectIterations.map((iter) => (
                  <button
                    key={iter.id}
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectSprint(iter.name)}
                    className="w-full flex items-center justify-between p-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <span className="truncate">{iter.name}</span>
                    {targetSprint === iter.name && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-app-muted italic px-1">
                No sprint iterations created in project settings.
              </div>
            )}

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-1 mb-1">
                Custom Sprint:
              </span>
              <input
                type="text"
                value={sprintInput}
                onChange={(e) => setSprintInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectSprint(sprintInput)
                }}
                placeholder="e.g. Sprint 14..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
