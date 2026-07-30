'use client'

import React, { useState, useEffect } from 'react'
import type { DiscoveryInsight, Persona } from '@/lib/product-strategy/types'
import { X, Loader2, Lightbulb } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface DiscoveryInsightModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<DiscoveryInsight>) => Promise<any>
  existingInsight?: DiscoveryInsight | null
  personas: Persona[]
  organizationId: string
  projectId: string
}

const SOURCES = [
  { value: 'customer_interview', label: 'Customer Interview' },
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'sales_call', label: 'Sales Call' },
  { value: 'user_research', label: 'User Research' },
  { value: 'survey', label: 'Survey' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'other', label: 'Other' }
]

const SEVERITIES = [
  { value: 'low', label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high', label: '🟠 High' },
  { value: 'critical', label: '🔴 Critical' }
]

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_review', label: 'In Review' },
  { value: 'converted', label: 'Converted' },
  { value: 'archived', label: 'Archived' }
]

export function DiscoveryInsightModal({
  isOpen,
  onClose,
  onSave,
  existingInsight,
  personas,
  organizationId,
  projectId
}: DiscoveryInsightModalProps) {
  const isEditMode = !!existingInsight

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('customer_interview')
  const [severity, setSeverity] = useState('medium')
  const [frequency, setFrequency] = useState(1)
  const [personaId, setPersonaId] = useState('')
  const [status, setStatus] = useState('new')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingInsight) {
      setTitle(existingInsight.title || '')
      setDescription(existingInsight.description || '')
      setSource(existingInsight.source || 'customer_interview')
      setSeverity(existingInsight.severity || 'medium')
      setFrequency(existingInsight.frequency || 1)
      setPersonaId(existingInsight.persona_id || '')
      setStatus(existingInsight.status || 'new')
    } else {
      setTitle('')
      setDescription('')
      setSource('customer_interview')
      setSeverity('medium')
      setFrequency(1)
      setPersonaId('')
      setStatus('new')
    }
  }, [existingInsight, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const payload: Partial<DiscoveryInsight> = {
      title: title.trim(),
      description: description.trim() || null,
      source: source as any,
      severity: severity as any,
      frequency,
      persona_id: personaId || null,
      status: status as any,
      organization_id: organizationId,
      project_id: projectId
    }
    await onSave(payload)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Panel */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Discovery Insight' : 'Log New Discovery Insight'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Insight Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Users struggle to find the export button"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description / Notes</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide context from the interview, support ticket, or observation..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          {/* Source + Severity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Source Channel</label>
              <EnterpriseSelect
                value={source}
                onChange={setSource}
                options={SOURCES}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Severity</label>
              <EnterpriseSelect
                value={severity}
                onChange={setSeverity}
                options={SEVERITIES}
              />
            </div>
          </div>

          {/* Frequency + Persona Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Frequency (times reported)</label>
              <input
                type="number"
                min={1}
                value={frequency}
                onChange={e => setFrequency(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Linked Persona</label>
              <EnterpriseSelect
                value={personaId}
                onChange={setPersonaId}
                placeholder="— No persona —"
                options={[
                  { value: '', label: '— No persona —' },
                  ...personas.map(p => ({ value: p.id, label: `${p.name} (${p.role_title})` }))
                ]}
              />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <EnterpriseSelect
                value={status}
                onChange={setStatus}
                options={STATUSES}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              style={{ cursor: 'pointer' }}
              className="px-5 py-2.5 rounded-xl bg-[#6b4eff] hover:bg-[#5839ec] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : isEditMode ? 'Update Insight' : 'Log Insight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
