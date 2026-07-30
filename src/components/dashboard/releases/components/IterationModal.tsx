'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Calendar, Hash, Tag } from 'lucide-react'
import type { Iteration } from '@/lib/releases/types'
import { getIterationLabel } from '@/lib/releases/types'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface IterationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, sequenceNumber: number, startDate: string, endDate: string, labelOverride?: 'sprint' | 'phase' | null) => Promise<any>
  iterationToEdit?: Iteration | null
  projectMethodology?: string | null
  nextSequenceNumber: number
}

export function IterationModal({
  isOpen,
  onClose,
  onSave,
  iterationToEdit,
  projectMethodology,
  nextSequenceNumber,
}: IterationModalProps) {
  const [name, setName] = useState('')
  const [sequenceNumber, setSequenceNumber] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [labelOverride, setLabelOverride] = useState<'sprint' | 'phase' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultLabel = getIterationLabel(projectMethodology)
  const isHybrid = (projectMethodology || '').toLowerCase() === 'hybrid'

  useEffect(() => {
    if (iterationToEdit) {
      setName(iterationToEdit.name)
      setSequenceNumber(iterationToEdit.sequenceNumber)
      setStartDate(iterationToEdit.startDate)
      setEndDate(iterationToEdit.endDate)
      setLabelOverride(iterationToEdit.labelOverride || '')
    } else {
      setName(`${defaultLabel} ${nextSequenceNumber}`)
      setSequenceNumber(nextSequenceNumber)
      
      // Default to today and +2 weeks
      const today = new Date()
      const twoWeeks = new Date()
      twoWeeks.setDate(today.getDate() + 14)
      
      setStartDate(today.toISOString().split('T')[0])
      setEndDate(twoWeeks.toISOString().split('T')[0])
      setLabelOverride(isHybrid ? 'sprint' : '')
    }
    setError(null)
  }, [iterationToEdit, nextSequenceNumber, defaultLabel, isHybrid, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must occur on or after start date.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await onSave(
      name,
      Number(sequenceNumber),
      startDate,
      endDate,
      labelOverride === '' ? null : (labelOverride as 'sprint' | 'phase')
    )
    setLoading(false)

    if (res.ok) {
      onClose()
    } else {
      setError(res.error || 'Failed to save iteration.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
          <h2 className="text-lg font-bold text-app-fg">
            {iterationToEdit ? `Edit ${defaultLabel}` : `New ${defaultLabel}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
              Iteration Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sprint 1 - Core Foundation"
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Hash className="h-3.5 w-3.5 text-indigo-500" />
                Sequence Order
              </label>
              <input
                type="number"
                min={1}
                required
                value={sequenceNumber}
                onChange={e => setSequenceNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-purple-500" />
                Methodology Label
              </label>
              <EnterpriseSelect
                value={labelOverride}
                onChange={(val) => setLabelOverride(val as any)}
                options={[
                  { value: '', label: `Project Default (${defaultLabel})`, description: 'Inherit workspace methodology setting' },
                  { value: 'sprint', label: 'Sprint', description: 'Agile / Hybrid time-boxed sprint' },
                  { value: 'phase', label: 'Phase', description: 'Waterfall / Hybrid sequential stage' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <p className="text-xs text-app-muted bg-app-surface/60 p-3 rounded-xl border border-app-border/50">
            <strong>Unified Schema Notice:</strong> Sprints and Phases use an identical underlying data model. Switching your project methodology mid-flight will preserve all iterations and work item mappings without data loss.
          </p>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-surface/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-app-border text-sm font-semibold text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {iterationToEdit ? 'Save Changes' : `Create ${defaultLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}
