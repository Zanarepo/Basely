'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, Calendar as CalendarIcon, User, AlignLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { createActionItem, updateActionItem } from '@/lib/actions/action-items'

interface ActionItemModalProps {
  projectId: string
  itemId?: string
  sourceMeetingId?: string
  onClose: () => void
  onSaved: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ActionItemModal({ projectId, itemId, sourceMeetingId, onClose, onSaved, onShowToast }: ActionItemModalProps) {
  const [description, setDescription] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<'open' | 'in_progress' | 'done'>('open')
  
  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(!!itemId)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchStakeholders()
    if (itemId) fetchItemDetails()
  }, [projectId, itemId])

  const fetchStakeholders = async () => {
    const { data } = await supabase
      .from('stakeholders')
      .select('id, name, role_title')
      .eq('project_id', projectId)
    if (data) setStakeholders(data)
  }

  const fetchItemDetails = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('id', itemId)
      .single()
    if (data) {
      setDescription(data.description)
      setOwnerId(data.owner_stakeholder_id || '')
      setDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '')
      setStatus(data.status)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!description.trim()) {
      onShowToast?.('error', 'Description is required')
      return
    }

    setIsSaving(true)
    const payload = {
      description,
      owner_stakeholder_id: ownerId || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
      source_meeting_minutes_id: sourceMeetingId
    }

    let res
    if (itemId) {
      res = await updateActionItem(itemId, projectId, payload)
    } else {
      res = await createActionItem(projectId, payload)
    }

    setIsSaving(false)
    if (res.success) {
      onShowToast?.('success', itemId ? 'Action item updated' : 'Action item created')
      onSaved()
    } else {
      onShowToast?.('error', res.error || 'Failed to save')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-app-bg w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-app-border shrink-0 bg-app-card">
          <h2 className="font-bold text-app-fg text-lg">{itemId ? 'Edit Action Item' : 'New Action Item'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-app-hover rounded-lg text-app-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4" /> Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
                className="bg-app-card border border-app-border rounded-xl px-3 py-2.5 text-sm text-app-fg focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Owner
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="bg-app-card border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Unassigned</option>
                  {stakeholders.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.role_title ? `(${s.role_title})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-app-card border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted">Status</label>
              <div className="flex gap-2 p-1 bg-app-card rounded-xl border border-app-border w-max">
                {(['open', 'in_progress', 'done'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                      status === s
                        ? s === 'done' ? 'bg-green-500/10 text-green-500' : s === 'in_progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
                        : 'text-app-muted hover:text-app-fg'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-app-border bg-app-card shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-app-muted hover:bg-app-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !description.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-semibold text-sm shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Action Item
          </button>
        </div>
      </div>
    </div>
  )
}
