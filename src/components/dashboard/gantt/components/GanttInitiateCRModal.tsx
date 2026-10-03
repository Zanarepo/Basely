'use client'

import { useState } from 'react'
import { FileEdit, Loader2, X } from 'lucide-react'
import { createStandaloneChangeRequest } from '@/lib/documents/change-request-actions'

interface GanttInitiateCRModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  taskName: string
  onShowToast?: (type: 'success' | 'error', msg: string) => void
}

export function GanttInitiateCRModal({ isOpen, onClose, projectId, taskName, onShowToast }: GanttInitiateCRModalProps) {
  const [description, setDescription] = useState(`Schedule Impact: ${taskName}`)
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!description.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createStandaloneChangeRequest(projectId, description.trim(), rationale.trim(), 'pending')
      if (res.success) {
        onShowToast?.('success', 'Change Request logged successfully.')
        onClose()
        // Reset form
        setDescription(`Schedule Impact: ${taskName}`)
        setRationale('')
      } else {
        onShowToast?.('error', res.error || 'Failed to create Change Request.')
      }
    } catch (err: any) {
      onShowToast?.('error', err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-app-surface w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileEdit className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-app-fg">Initiate Change Request</h3>
              <p className="text-xs text-app-muted">From Gantt task: <span className="font-semibold text-app-fg">{taskName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-app-muted cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-app-fg mb-1.5">Description <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-app-fg"
              placeholder="Brief description of the change..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-app-fg mb-1.5">Rationale</label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-app-fg resize-none"
              placeholder="Why is this change needed? What is the schedule or scope impact?"
            />
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
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
            {isSubmitting ? 'Logging...' : 'Log Change Request'}
          </button>
        </div>

      </div>
    </div>
  )
}
