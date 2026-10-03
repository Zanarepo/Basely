import React from 'react'
import { Activity, Check } from 'lucide-react'
import { DocumentProperties } from '@/components/dashboard/documents/hooks/useDocumentProperties'
import { STATUS_OPTIONS, getStatusBadgeStyle } from '../constants/propertyOptions'

interface PropertyStatusPopoverProps {
  status: DocumentProperties['status']
  hasEditAccess: boolean
  isOpen: boolean
  onToggle: () => void
  onSelect: (newStatus: DocumentProperties['status']) => void
}

export function PropertyStatusPopover({
  status,
  hasEditAccess,
  isOpen,
  onToggle,
  onSelect,
}: PropertyStatusPopoverProps) {
  const currentLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label || 'Draft'

  return (
    <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
      <div className="flex items-center gap-1.5 text-app-muted">
        <Activity className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span className="font-semibold text-app-fg text-xs">Status:</span>
      </div>

      <button
        type="button"
        style={{ cursor: 'pointer' }}
        disabled={!hasEditAccess}
        onClick={onToggle}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${getStatusBadgeStyle(status)}`}
      >
        {currentLabel}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(opt.value)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <span className={`px-2 py-0.5 rounded-lg border ${opt.color}`}>{opt.label}</span>
              {status === opt.value && <Check className="w-3.5 h-3.5 text-violet-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
