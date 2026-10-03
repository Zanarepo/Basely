import React from 'react'
import { Lightbulb, Rocket, Pin, AlertTriangle } from 'lucide-react'

interface CalloutMenuProps {
  showCalloutMenu: boolean
  setShowCalloutMenu: (show: boolean) => void
  insertCallout: (type: 'note' | 'tip' | 'important' | 'warning') => void
  calloutMenuRef: React.RefObject<HTMLDivElement | null>
}

export function CalloutMenu({
  showCalloutMenu,
  setShowCalloutMenu,
  insertCallout,
  calloutMenuRef,
}: CalloutMenuProps) {
  return (
    <div className="relative" ref={calloutMenuRef}>
      <button
        type="button"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowCalloutMenu(!showCalloutMenu)}
        className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer flex items-center gap-1"
        title="Insert Glassmorphic Notion Callout Box"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
      </button>

      {showCalloutMenu && (
        <div className="absolute left-0 top-full mt-1.5 w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
          <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-2 py-1">
            Callout Presets
          </span>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertCallout('note')}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
          >
            <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Blue Note Box</span>
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertCallout('tip')}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
          >
            <Rocket className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Green Tip Box</span>
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertCallout('important')}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
          >
            <Pin className="w-4 h-4 text-violet-500 shrink-0" />
            <span>Violet Focus Box</span>
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertCallout('warning')}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Amber Warning Box</span>
          </button>
        </div>
      )}
    </div>
  )
}
