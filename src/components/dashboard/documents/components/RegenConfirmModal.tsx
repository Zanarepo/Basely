import { AlertTriangle } from 'lucide-react'

interface RegenConfirmModalProps {
  show: boolean
  setShow: (show: boolean) => void
  onConfirm: () => void
}

export default function RegenConfirmModal({ show, setShow, onConfirm }: RegenConfirmModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-app-fg">Refresh Data-Bound Sections?</h3>
        </div>
        <p className="text-sm text-app-muted">
          Regenerating will update all auto-populated sections to match the latest project state. Your custom free-text notes will be preserved.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => setShow(false)}
            className="btn-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary text-xs px-4 py-2"
          >
            Proceed & Regenerate
          </button>
        </div>
      </div>
    </div>
  )
}
