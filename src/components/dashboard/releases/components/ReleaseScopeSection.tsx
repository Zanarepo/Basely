'use client'

import React, { useState } from 'react'
import { Plus, Trash2, ShieldCheck, UserCheck, Ban, Layers, ListTodo, FileText, Loader2, Sparkles } from 'lucide-react'
import type { ReleaseScopeItem } from '@/lib/releases/types'

interface ReleaseScopeSectionProps {
  releaseId: string
  scopeItems: ReleaseScopeItem[]
  availableWorkItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
  hasEditAccess: boolean
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
  onDeleteManualScope: (id: string, releaseId: string) => Promise<any>
}

export function ReleaseScopeSection({
  releaseId,
  scopeItems,
  availableWorkItems,
  hasEditAccess,
  onAddManualScope,
  onDeleteManualScope,
}: ReleaseScopeSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMode, setAddMode] = useState<'existing' | 'custom'>('existing')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter available work items that aren't already included
  const existingIds = new Set(scopeItems.map(i => i.entityId))
  const candidateItems = availableWorkItems.filter(i => !existingIds.has(i.id))

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

  const handleExcludeAutoItem = async (item: ReleaseScopeItem) => {
    await onAddManualScope(
      releaseId,
      item.entityType,
      item.title,
      'excluded',
      item.entityId,
      'Manually excluded from Release Scope'
    )
  }

  const handleRemoveOverride = async (item: ReleaseScopeItem) => {
    // ID prefix was man_
    const realId = item.id.replace('man_', '')
    await onDeleteManualScope(realId, releaseId)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-app-fg">Unified Scope Derivation</h4>
            <p className="text-xs text-app-muted font-normal">
              Items tagged to mapped Sprints/Phases are automatically rolled in. You can inject custom deliverables or override exclusions anytime.
            </p>
          </div>
        </div>

        {hasEditAccess && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Scope Override</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-app-card border border-app-border rounded-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-app-border/60">
            <h5 className="text-xs font-bold text-app-fg uppercase tracking-wider">Inject Manual Scope Override</h5>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  addMode === 'existing' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-app-muted hover:bg-app-surface'
                }`}
              >
                Link WBS / Activity
              </button>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  addMode === 'custom' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-app-muted hover:bg-app-surface'
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
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                required
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs font-semibold text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- Choose WBS Element or Schedule Activity --</option>
                {candidateItems.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.type === 'wbs_element' ? 'WBS' : 'Activity'}] {item.code ? `${item.code}: ` : ''}{item.title}
                  </option>
                ))}
              </select>
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
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs font-semibold text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Commit Scope Override</span>
            </button>
          </div>
        </form>
      )}

      {/* Scope Items Table / List */}
      <div className="border border-app-border rounded-xl overflow-hidden divide-y divide-app-border bg-app-card">
        {scopeItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-app-muted/70 italic">
            No scope items derived yet. Map iterations or add manual overrides above.
          </div>
        ) : (
          scopeItems.map((item, idx) => {
            const isExcluded = item.source === 'excluded'
            const isManual = item.source === 'manual_override'
            const isAuto = item.source === 'auto_derived'

            return (
              <div
                key={item.id || idx}
                className={`group relative flex items-center justify-between p-3.5 transition-colors hover:bg-app-surface/50 ${
                  isExcluded ? 'opacity-50 bg-rose-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-app-surface text-app-muted shrink-0">
                    {item.entityType === 'wbs_element' && <Layers className="h-4 w-4 text-indigo-400" />}
                    {item.entityType === 'activity' && <ListTodo className="h-4 w-4 text-emerald-400" />}
                    {item.entityType === 'custom_item' && <FileText className="h-4 w-4 text-purple-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.code && (
                        <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                          {item.code}
                        </span>
                      )}
                      <span className={`text-xs font-bold text-app-fg truncate ${isExcluded ? 'line-through text-app-muted' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                    {item.iterationName && (
                      <div className="text-[11px] text-app-muted mt-0.5">
                        Derived from: <span className="font-semibold text-teal-400">{item.iterationName}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[11px] text-app-muted italic mt-0.5">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {/* Badges */}
                  {isAuto && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3 text-blue-400" />
                      Auto-Derived
                    </span>
                  )}
                  {isManual && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                      <UserCheck className="h-3 w-3 text-purple-400" />
                      Manual Override
                    </span>
                  )}
                  {isExcluded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                      <Ban className="h-3 w-3 text-rose-400" />
                      Excluded
                    </span>
                  )}

                  {/* Hover Action Buttons */}
                  {hasEditAccess && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      {isAuto && (
                        <button
                          type="button"
                          onClick={() => handleExcludeAutoItem(item)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                          title="Exclude from Release Scope"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {(isManual || isExcluded) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOverride(item)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove manual override / restore default"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
