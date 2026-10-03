import React from 'react'
import { Loader2 } from 'lucide-react'

interface CustomSectionBuilderProps {
  newSectionTitle: string
  setNewSectionTitle: (title: string) => void
  handleAddSection: (titleOverride?: string) => void
  isPending: boolean
  hasEditAccess: boolean
  isSnapshot?: boolean
}

export default function CustomSectionBuilder({
  newSectionTitle,
  setNewSectionTitle,
  handleAddSection,
  isPending,
  hasEditAccess,
  isSnapshot = false,
}: CustomSectionBuilderProps) {
  if (!hasEditAccess || isSnapshot) return null

  return (
    <div className="mt-8 pt-6 border-t border-dashed border-app-border">
      <div className="bg-app-muted-surface/50 dark:bg-slate-800/60 rounded-xl p-5 border border-app-border space-y-3 shadow-sm transition-all hover:border-violet-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              ➕ Add Custom Section & Text Field
            </span>
          </div>
          <span className="text-[11px] text-app-muted font-medium">
            Add dynamic analytical blocks (e.g. Competitor Pricing Tiers, TAM Expansion, Regional Risks)
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddSection()
              }
            }}
            placeholder="Section Title / Header Name (e.g. Enterprise Pricing & SLA Tiers)..."
            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleAddSection()
            }}
            disabled={!newSectionTitle.trim() || isPending}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 rounded-xl shadow-sm transition-all shrink-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" /> Adding...
              </>
            ) : (
              '+ Add Section Field'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
