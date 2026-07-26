'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { QualityStandard } from '@/lib/planning/quality-actions'

type QualityStandardFormProps = {
  standard: QualityStandard | null
  onClose: () => void
  onSave: (standard: Partial<QualityStandard>) => Promise<string | void>
}

export function QualityStandardForm({ standard, onClose, onSave }: QualityStandardFormProps) {
  const [criterionText, setCriterionText] = useState('')
  const [isChecklistItem, setIsChecklistItem] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (standard) {
      setCriterionText(standard.criterion_text || '')
      setIsChecklistItem(standard.is_checklist_item || false)
    }
  }, [standard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!criterionText.trim()) return

    setSaving(true)
    setError(null)
    
    const err = await onSave({
      id: standard?.id,
      criterion_text: criterionText.trim(),
      is_checklist_item: isChecklistItem
    })
    
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
        onClick={onClose}
        aria-label="Close form"
      />
      <div className="fixed inset-y-0 right-0 w-96 bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col z-50 animate-fade-in-right">
        <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/50">
          <h3 className="font-bold text-app-fg text-lg">
            {standard ? 'Edit Quality Standard' : 'Add Quality Standard'}
          </h3>
          <button onClick={onClose} className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Standard / Criterion *</label>
              <textarea
                value={criterionText}
                onChange={e => setCriterionText(e.target.value)}
                required
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
                placeholder="Describe the quality standard or acceptance criterion..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecklistItem}
                  onChange={e => setIsChecklistItem(e.target.checked)}
                  className="rounded border-app-border text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-app-fg">This is a Checklist Item</span>
              </label>
              <p className="text-[11px] text-app-muted mt-1 ml-6">
                Checklist items will be available for team members to tick off during task execution.
              </p>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-app-border bg-app-surface/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !criterionText.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Standard'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
