'use client'

import { Plus } from 'lucide-react'

interface AdrHeaderProps {
  methodology: string
  onNewClick: () => void
}

export function AdrHeader({ methodology, onNewClick }: AdrHeaderProps) {
  return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Architecture Decision Records (ADRs)
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {methodology} ready
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Immutable technical ledger for capturing design trade-offs, system rationale, and preventing architectural drift across Sprints and Phase Gates.
          </p>
        </div>
        <button
          onClick={onNewClick}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Author New ADR
        </button>
      </div>
  )
}
