'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ReleaseScopeFormProps {
  releaseId: string
  availableWorkItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
  candidateItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
  setShowAddForm: (val: boolean) => void
}

export function ReleaseScopeForm({
  releaseId,
  availableWorkItems,
  candidateItems,
  onAddManualScope,
  setShowAddForm
}: ReleaseScopeFormProps) {
  const [addMode, setAddMode] = useState<'existing' | 'custom'>('existing')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    let entityType: 'wbs_element' | 'activity' | 'custom_item' = 'custom_item'
    let title = customTitle.trim()
    let entityId: string | null = null

    if (addMode === 'existing') {
      const target = availableWorkItems.find(i => i.id === selectedItemId)
      if (!target) {
        setError('Please select a valid work item.')
        setSubmitting(false)
        return
      }
      entityType = target.type
      title = target.code ? `[${target.code}] ${target.title}` : target.title
      entityId = target.id
    } else {
      if (!title) {
        setError('Please enter a scope title.')
        setSubmitting(false)
        return
      }
    }

    const res = await onAddManualScope(releaseId, entityType, title, 'added', entityId, notes)
    setSubmitting(false)
    if (res.ok) {
      setShowAddForm(false)
      setCustomTitle('')
      setSelectedItemId('')
      setNotes('')
    } else {
      setError(res.error || 'Failed to add manual scope override.')
    }
  }

  return (
        <form onSubmit={handleAddSubmit} className="p-4 bg-app-card border border-app-border rounded-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-app-border/60">
            <h5 className="text-xs font-bold text-app-fg uppercase tracking-wider">Inject Manual Scope Override</h5>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  addMode === 'existing' ? 'bg-violet-500/20 text-violet-500 border border-violet-500/30' : 'text-app-muted hover:bg-app-surface'
                }`}
              >
                Link WBS / Activity
              </button>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  addMode === 'custom' ? 'bg-violet-500/20 text-violet-500 border border-violet-500/30' : 'text-app-muted hover:bg-app-surface'
                }`}
              >
                Custom Deliverable
              </button>
            </div>
          </div>

          {error && <div className="text-xs font-bold text-rose-500">{error}</div>}

          {addMode === 'existing' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted block">Select Work Item from Project Repository</label>
              <EnterpriseSelect
                value={selectedItemId}
                onChange={(val) => setSelectedItemId(val)}
                placeholder="-- Choose WBS Element or Schedule Activity --"
                options={[
                  { value: '', label: '-- Choose WBS Element or Schedule Activity --' },
                  ...candidateItems.map(item => ({
                    value: item.id,
                    label: `${item.code ? `${item.code}: ` : ''}${item.title}`,
                    description: item.type === 'wbs_element' ? 'WBS Deliverable Element' : 'Schedule Project Activity'
                  }))
                ]}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted block">Deliverable / Scope Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Third-party security penetration testing report"
                required
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs font-semibold text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-app-muted block">Override Rationale / Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Why is this added directly to the release outside normal iteration workflow?"
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-1.5 text-xs text-app-fg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={submitting}
              className="px-3 py-1.5 rounded-xl border border-app-border text-xs font-semibold text-app-muted hover:text-app-fg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Commit Scope Override</span>
            </button>
          </div>
        </form>
  )
}
