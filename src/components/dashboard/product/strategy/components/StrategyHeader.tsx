'use client'

import { Compass, Save, CheckCircle2, Loader2 } from 'lucide-react'

interface StrategyHeaderProps {
  lastSaved: Date | null
  isDirty: boolean
  saving: boolean
  hasEditAccess: boolean
  handleSave: () => void
  saveError: string | null
}

export function StrategyHeader({
  lastSaved,
  isDirty,
  saving,
  hasEditAccess,
  handleSave,
  saveError
}: StrategyHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 rounded-2xl shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Product Strategy & Vision Canvas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                Live Strategic Record
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Unify executive vision, customer market segments, defensibility moats, and operational pillars into an immutable source of truth.
            </p>
          </div>
        </div>

        {/* Save Status & Button */}
        <div className="flex items-center justify-end space-x-3 shrink-0">
          {lastSaved && !isDirty && !saving && (
            <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Synced {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isDirty && !saving && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
              Unsaved changes
            </span>
          )}

          {hasEditAccess && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Canvas
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 rounded-lg">
          {saveError}
        </div>
      )}
    </>
  )
}
