'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { Issue, Risk } from './useRiskData'
import { createIssue, updateIssue } from '@/lib/risks/actions'

interface IssueFormProps {
  projectId: string
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
  stakeholders: any[]
  risks: Risk[]
  existingIssue: Issue | null
  onClose: () => void
  onSuccess: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export default function IssueForm({
  projectId,
  workspaceMembers,
  stakeholders,
  risks,
  existingIssue,
  onClose,
  onSuccess,
  onShowToast,
}: IssueFormProps) {
  const [title, setTitle] = useState(existingIssue?.title || '')
  const [description, setDescription] = useState(existingIssue?.description || '')
  const [status, setStatus] = useState<string>(existingIssue?.status || 'Open')
  const [ownerId, setOwnerId] = useState<string>(existingIssue?.owner_stakeholder_id || '')
  const [linkedRiskId, setLinkedRiskId] = useState<string>(existingIssue?.linked_risk_id || '')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    const data = {
      title,
      description: description || null,
      status,
      owner_stakeholder_id: ownerId || null,
      linked_risk_id: linkedRiskId || null,
      // Default to current date for new issues, or keep existing
      raised_date: existingIssue?.raised_date || new Date().toISOString()
    }

    const result = existingIssue
      ? await updateIssue(existingIssue.id, projectId, data)
      : await createIssue(projectId, data)

    setIsSubmitting(false)

    if (result.ok) {
      onSuccess()
    } else {
      onShowToast?.('error', `Failed to save issue: ${result.error}`)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-app-bg/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-app-surface border-l border-app-border shadow-2xl flex flex-col animate-fade-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface-solid shrink-0">
          <div>
            <h2 className="text-lg font-bold text-app-fg">
              {existingIssue ? 'Edit Issue' : 'Log New Issue'}
            </h2>
            <p className="text-sm text-app-muted mt-1">
              Track materialized risks and current problems.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="issue-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Supplier bankruptcy"
                required
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Details about the issue and current impact..."
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Issue Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Unassigned</option>
                {stakeholders.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.role_title ? `(${st.role_title})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-app-muted mt-1.5">Assign an owner from the project stakeholder register.</p>
            </div>

            {/* Linked Risk */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Linked Risk (Optional)</label>
              <select
                value={linkedRiskId}
                onChange={(e) => setLinkedRiskId(e.target.value)}
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">No Linked Risk</option>
                {risks.map((risk) => (
                  <option key={risk.id} value={risk.id}>
                    {risk.title} (Score: {risk.risk_score})
                  </option>
                ))}
              </select>
              <p className="text-xs text-app-muted mt-1.5">Link this issue to a previously identified risk.</p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-app-border bg-app-surface-solid flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-app-muted hover:text-app-fg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="issue-form"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Issue'}
          </button>
        </div>
      </div>
    </>
  )
}
