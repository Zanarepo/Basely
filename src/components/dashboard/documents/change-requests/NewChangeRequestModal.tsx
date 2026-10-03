import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (description: string, rationale: string, costImpact?: number, scheduleImpact?: number) => Promise<void>
  currencySymbol?: string
}

export function NewChangeRequestModal({ isOpen, onClose, onSubmit, currencySymbol = '$' }: Props) {
  const [description, setDescription] = useState('')
  const [rationale, setRationale] = useState('')
  const [costImpact, setCostImpact] = useState<number | undefined>(undefined)
  const [scheduleImpact, setScheduleImpact] = useState<number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(description, rationale, costImpact, scheduleImpact)
      setDescription('')
      setRationale('')
      setCostImpact(undefined)
      setScheduleImpact(undefined)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border bg-app-surface-solid">
          <h3 className="text-lg font-black text-app-fg tracking-tight">Log Change Request</h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3.5 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-app-fg mb-1.5">
              Description *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-app-bg border border-app-border text-app-fg rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-app-muted/50"
              placeholder="e.g. Scope expansion for Phase 2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-app-fg mb-1.5">
              Rationale / Justification
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full px-4 py-2.5 bg-app-bg border border-app-border text-app-fg rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-app-muted/50 resize-none"
              placeholder="Why is this change necessary?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-app-fg mb-1.5 h-10 flex items-end">
                Cost Impact ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costImpact === undefined ? '' : costImpact}
                onChange={(e) => setCostImpact(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 bg-app-bg border border-app-border text-app-fg rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-app-muted/50"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-app-fg mb-1.5 h-10 flex items-end">
                Schedule Delay (Days)
              </label>
              <input
                type="number"
                min="0"
                value={scheduleImpact === undefined ? '' : scheduleImpact}
                onChange={(e) => setScheduleImpact(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 bg-app-bg border border-app-border text-app-fg rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder:text-app-muted/50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-app-muted hover:text-app-fg hover:bg-app-hover rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-violet-500 hover:bg-violet-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed rounded-xl cursor-pointer transition-all shadow-md shadow-violet-500/20"
            >
              {submitting ? 'Saving...' : 'Save Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
