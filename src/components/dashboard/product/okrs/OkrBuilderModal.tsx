'use client'

import React, { useState, useEffect } from 'react'
import type { OkrObjective, OkrKeyResult } from '@/lib/product-strategy/types'
import { createOkrObjective, updateOkrObjective, createOkrKeyResult, updateOkrKeyResult } from '@/lib/product-strategy/actions'
import { X, Save, Loader2, Plus } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface OkrBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'objective' | 'key_result'
  organizationId: string
  projectId?: string
  targetObjectiveId?: string // Required when creating a key result
  existingObjective?: OkrObjective | null
  existingKeyResult?: OkrKeyResult | null
  onSavedObjective?: (obj: OkrObjective) => void
  onSavedKeyResult?: (kr: OkrKeyResult) => void
}

export function OkrBuilderModal({
  isOpen,
  onClose,
  mode,
  organizationId,
  projectId,
  targetObjectiveId,
  existingObjective,
  existingKeyResult,
  onSavedObjective,
  onSavedKeyResult
}: OkrBuilderModalProps) {
  // Objective fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [timeframe, setTimeframe] = useState('Q3 2026')
  const [status, setStatus] = useState<'on_track' | 'at_risk' | 'behind'>('on_track')

  // Key Result fields
  const [krTitle, setKrTitle] = useState('')
  const [baselineValue, setBaselineValue] = useState('0')
  const [targetValue, setTargetValue] = useState('100')
  const [currentValue, setCurrentValue] = useState('0')
  const [confidenceScore, setConfidenceScore] = useState(80)
  const [unit, setUnit] = useState('numeric')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    if (mode === 'objective') {
      if (existingObjective) {
        setTitle(existingObjective.title || '')
        setDescription(existingObjective.description || '')
        setOwner(existingObjective.owner || '')
        setTimeframe(existingObjective.timeframe || 'Q3 2026')
        setStatus(existingObjective.status as any || 'on_track')
      } else {
        setTitle('')
        setDescription('')
        setOwner('')
        setTimeframe('Q3 2026')
        setStatus('on_track')
      }
    } else if (mode === 'key_result') {
      if (existingKeyResult) {
        setKrTitle(existingKeyResult.title || '')
        setBaselineValue(existingKeyResult.baseline_value || '0')
        setTargetValue(existingKeyResult.target_value || '100')
        setCurrentValue(existingKeyResult.current_value || '0')
        setConfidenceScore(existingKeyResult.confidence_score || 80)
        setUnit(existingKeyResult.unit || 'numeric')
        setStatus(existingKeyResult.status as any || 'on_track')
      } else {
        setKrTitle('')
        setBaselineValue('0')
        setTargetValue('100')
        setCurrentValue('0')
        setConfidenceScore(80)
        setUnit('numeric')
        setStatus('on_track')
      }
    }
  }, [isOpen, mode, existingObjective, existingKeyResult])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)

    if (mode === 'objective') {
      if (!title.trim()) {
        setLoading(false)
        return
      }
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        owner: owner.trim() || null,
        timeframe,
        status,
        organization_id: organizationId,
        project_id: projectId || null
      }
      let res
      if (existingObjective?.id) {
        res = await updateOkrObjective(existingObjective.id, payload)
      } else {
        res = await createOkrObjective(payload)
      }
      setLoading(false)
      if (res.ok && res.data && onSavedObjective) {
        onSavedObjective(res.data)
        onClose()
      }
    } else {
      // Key Result mode
      if (!krTitle.trim() || (!targetObjectiveId && !existingKeyResult?.objective_id)) {
        setLoading(false)
        return
      }
      const objId = existingKeyResult?.objective_id || targetObjectiveId || ''
      
      // Calculate initial progress
      const numCurrent = parseFloat(currentValue) || 0
      const numTarget = parseFloat(targetValue) || 100
      const calcProg = numTarget !== 0 ? Math.min(100, Math.max(0, Math.round((numCurrent / numTarget) * 100))) : 0

      const payload = {
        objective_id: objId,
        title: krTitle.trim(),
        baseline_value: baselineValue,
        target_value: targetValue,
        current_value: currentValue,
        progress: calcProg,
        confidence_score: Number(confidenceScore) || 80,
        unit,
        status
      }

      let res
      if (existingKeyResult?.id) {
        res = await updateOkrKeyResult(existingKeyResult.id, payload)
      } else {
        res = await createOkrKeyResult(payload)
      }
      setLoading(false)
      if (res.ok && res.data && onSavedKeyResult) {
        onSavedKeyResult(res.data)
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'objective' 
              ? (existingObjective ? 'Edit Quarterly Objective' : 'Register New Quarterly Objective') 
              : (existingKeyResult ? 'Edit Measurable Key Result' : 'Add Measurable Key Result')
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {mode === 'objective' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Objective Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Accelerate Enterprise Adoption & Expand Core Revenue"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description / Strategic Intent (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe why this objective is critical for this quarter..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Owner / Executive Lead
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. VP of Product / Team Alpha"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Timeframe / Quarter
                  </label>
                  <input
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g. Q3 2026, FY 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Overall Health Status
                </label>
                <EnterpriseSelect
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                  options={[
                    { value: 'on_track', label: '🟢 On Track' },
                    { value: 'at_risk', label: '🟡 At Risk' },
                    { value: 'behind', label: '🔴 Behind Target' },
                  ]}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Key Result Title *
                </label>
                <input
                  type="text"
                  required
                  value={krTitle}
                  onChange={(e) => setKrTitle(e.target.value)}
                  placeholder="e.g. Achieve 45% Organic Conversion Rate across top tier personas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Baseline Start
                  </label>
                  <input
                    type="text"
                    value={baselineValue}
                    onChange={(e) => setBaselineValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Current Value
                  </label>
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-indigo-500 bg-white dark:bg-slate-800 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Target Value
                  </label>
                  <input
                    type="text"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <EnterpriseSelect
                    value={unit}
                    onChange={(val) => setUnit(val)}
                    options={[
                      { value: 'numeric', label: 'Numeric / Count', description: 'Standard numerical or counting metric' },
                      { value: 'percentage', label: 'Percentage (%)', description: 'Ratio or completion rate out of 100' },
                      { value: 'currency', label: 'Currency ($)', description: 'Monetary values or revenue goals' },
                      { value: 'ratio', label: 'Multiplier (x)', description: 'Growth or scale factor multiplier' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Confidence ({confidenceScore}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(parseInt(e.target.value, 10))}
                    style={{ cursor: 'pointer' }}
                    className="w-full mt-2 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Key Result Health Status
                </label>
                <EnterpriseSelect
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                  options={[
                    { value: 'on_track', label: '🟢 On Track' },
                    { value: 'at_risk', label: '🟡 At Risk' },
                    { value: 'behind', label: '🔴 Behind Target' },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> {mode === 'objective' ? 'Save Objective' : 'Save Key Result'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
