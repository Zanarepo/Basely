import React from 'react'
import { Compass, Loader2, ShieldCheck } from 'lucide-react'

interface CompetitiveHeaderBannerProps {
  hasEditAccess: boolean
  saving: boolean
  onSave: () => void
}

export function CompetitiveHeaderBanner({
  hasEditAccess,
  saving,
  onSave,
}: CompetitiveHeaderBannerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 mb-3">
            <Compass className="w-3.5 h-3.5 text-violet-500" />
            <span>COMPETITIVE BENCHMARKING ENGINE</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Competitive Intelligence & Positioning Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
            Deconstruct competitor capabilities, feature parity, pricing tiers, and strategic defensibility moats vs key industry rivals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasEditAccess && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{ cursor: 'pointer' }}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving Matrix...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-violet-200" />
                  <span>Save Intelligence Data</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
