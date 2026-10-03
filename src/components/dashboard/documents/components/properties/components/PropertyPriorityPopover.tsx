import React from 'react'
import { Zap, Check } from 'lucide-react'
import { DocumentProperties } from '@/components/dashboard/documents/hooks/useDocumentProperties'
import { PRIORITY_OPTIONS, getPriorityBadgeStyle } from '../constants/propertyOptions'

interface PropertyPriorityPopoverProps {
  priority: DocumentProperties['priority']
  hasEditAccess: boolean
  isOpen: boolean
  onToggle: () => void
  onSelect: (newPriority: DocumentProperties['priority']) => void
}

export function PropertyPriorityPopover({
  priority,
  hasEditAccess,
  isOpen,
  onToggle,
  onSelect,
}: PropertyPriorityPopoverProps) {
  const currentLabel = PRIORITY_OPTIONS.find((p) => p.value === priority)?.label || 'P2 - Medium'

  return (
    <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
      <div className="flex items-center gap-1.5 text-app-muted">
        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold text-app-fg text-xs">Priority:</span>
      </div>

      <button
        type="button"
        style={{ cursor: 'pointer' }}
        disabled={!hasEditAccess}
        onClick={onToggle}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${getPriorityBadgeStyle(priority)}`}
      >
        {currentLabel}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(opt.value)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <span className={`px-2 py-0.5 rounded-lg border ${opt.color}`}>{opt.label}</span>
              {priority === opt.value && <Check className="w-3.5 h-3.5 text-violet-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
