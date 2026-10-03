import React from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface SectionDeleteConfirmModalProps {
  isOpen: boolean
  currentTitle: string
  isRemoving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SectionDeleteConfirmModal({
  isOpen,
  currentTitle,
  isRemoving,
  onClose,
  onConfirm,
}: SectionDeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-app-surface border border-app-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-scale-up border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-app-fg">Delete Section?</h3>
            <p className="text-xs text-app-muted mt-0.5">
              Are you sure you want to remove <strong className="text-app-fg font-semibold">&quot;{currentTitle}&quot;</strong>?
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
          💡 You can restore deleted sections anytime from the &quot;Removed Sections&quot; panel at the bottom of the document.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="px-4 py-2 text-xs font-semibold text-app-muted hover:text-app-fg bg-app-muted-surface hover:bg-app-hover rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRemoving}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Deleting Section...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
