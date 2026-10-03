import React from 'react'
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react'

interface DocumentReconcileAlertProps {
  generatedDoc: any
  isSnapshot: boolean
  hasEditAccess: boolean
  isReconciling: boolean
  handleReconcile: () => void
}

export function DocumentReconcileAlert({
  generatedDoc,
  isSnapshot,
  hasEditAccess,
  isReconciling,
  handleReconcile
}: DocumentReconcileAlertProps) {
  if (!generatedDoc?.is_stale || isSnapshot || !hasEditAccess) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-900/30">
      <div className="flex items-start sm:items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
            This document is out of sync with the project's active data workspaces.
          </p>
          {generatedDoc.stale_reason && (
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
              Reason: {generatedDoc.stale_reason}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        style={{ cursor: 'pointer' }}
        onClick={handleReconcile}
        disabled={isReconciling}
        className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-white dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 shadow-sm transition-all disabled:opacity-50"
      >
        {isReconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        Auto-Reconcile with AI
      </button>
    </div>
  )
}
