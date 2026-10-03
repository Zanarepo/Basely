import React from 'react'
import { AlertCircle, FileEdit, ArrowRight, Loader2, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  riskTitle: string
}

export function EscalateToChangeRequestModal({ isOpen, onClose, onConfirm, isSubmitting, riskTitle }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-app-surface w-full max-w-md rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <div className="flex items-center gap-2">
             <FileEdit className="w-5 h-5 text-violet-600 dark:text-violet-400" />
             <h3 className="text-lg font-bold text-app-fg">Escalate to Change Request</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-app-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-app-muted leading-relaxed mb-6">
            You are about to escalate this risk into a formal Change Request. This will create a pending Change Request using the risk's mitigation strategy.
          </p>

          <div className="bg-app-bg border border-app-border rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Source Risk</span>
              <span className="text-sm font-medium text-app-fg truncate" title={riskTitle}>{riskTitle}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-app-border bg-gray-50/50 dark:bg-app-bg/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-app-muted hover:text-app-fg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {isSubmitting ? 'Escalating...' : 'Create Change Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
