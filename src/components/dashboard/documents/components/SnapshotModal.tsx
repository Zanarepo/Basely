import { Save } from 'lucide-react'

interface SnapshotModalProps {
  show: boolean
  setShow: (show: boolean) => void
  periodEnd: string
  setPeriodEnd: (date: string) => void
  onConfirm: () => void
}

export default function SnapshotModal({
  show,
  setShow,
  periodEnd,
  setPeriodEnd,
  onConfirm
}: SnapshotModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3 text-emerald-500">
          <Save className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-app-fg">Freeze Status Report Snapshot</h3>
        </div>
        <p className="text-sm text-app-muted">
          Select the end date for this reporting period. This will freeze the data-bound metrics (Schedule, EVM, Risks) and your narrative into a historical snapshot.
        </p>
        <div>
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">
            Reporting Period End Date
          </label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full p-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => setShow(false)}
            className="btn-secondary text-xs px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 border-transparent text-white"
          >
            Create Frozen Snapshot
          </button>
        </div>
      </div>
    </div>
  )
}
