'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  organizationId: string
  organizationName: string
  onClose: () => void
}

export function DataDeletionModal({ organizationId, organizationName, onClose }: Props) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expectedConfirmation = `DELETE ${organizationName}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmation !== expectedConfirmation) {
      setError('Confirmation text does not match.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/backoffice/compliance/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule deletion')
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app-surface w-full max-w-md rounded-2xl shadow-2xl border border-red-500/30 overflow-hidden">
        <div className="bg-red-500/10 border-b border-red-500/20 p-5">
          <h2 className="text-xl font-black text-red-500 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Schedule Data Deletion
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-500 mb-2">WARNING: DESTRUCTIVE ACTION</p>
              <p className="text-xs text-app-fg leading-relaxed">
                You are about to schedule a GDPR/NDPA right-to-be-forgotten data deletion for <strong>{organizationName}</strong>. 
                This action enters a mandatory 30-day grace period. Once the grace period expires, all operational data will be permanently wiped (billing records are preserved for compliance).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-app-muted uppercase mb-1">
                To confirm, type "{expectedConfirmation}"
              </label>
              <input 
                type="text" 
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                className="w-full px-3 py-2 bg-app-surface-solid border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:border-red-500"
                placeholder={expectedConfirmation}
                required
              />
            </div>

            {error && (
              <div className="text-xs font-bold text-red-500">{error}</div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
              className="px-4 py-2 text-sm font-bold text-app-muted hover:text-app-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || confirmation !== expectedConfirmation}
              style={{ cursor: 'pointer' }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-black rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Deletion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
