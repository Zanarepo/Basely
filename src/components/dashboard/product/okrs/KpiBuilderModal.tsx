'use client'

import React, { useState, useEffect } from 'react'
import type { ProductKpi } from '@/lib/product-strategy/types'
import { createProductKpi, updateProductKpi } from '@/lib/product-strategy/actions'
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface KpiBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  projectId?: string
  existingKpi?: ProductKpi | null
  onSaved: (kpi: ProductKpi) => void
}

export function KpiBuilderModal({
  isOpen,
  onClose,
  organizationId,
  projectId,
  existingKpi,
  onSaved
}: KpiBuilderModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'north_star' | 'acquisition' | 'activation' | 'retention' | 'revenue' | 'efficiency' | string>('north_star')
  const [currentValue, setCurrentValue] = useState('0')
  const [targetValue, setTargetValue] = useState('100')
  const [unit, setUnit] = useState<'percentage' | 'currency' | 'numeric' | 'ratio' | string>('numeric')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | string>('monthly')
  const [trendDirection, setTrendDirection] = useState<'up' | 'down' | 'neutral'>('up')
  const [status, setStatus] = useState<'on_track' | 'at_risk' | 'behind'>('on_track')
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({})
  
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (existingKpi) {
      setName(existingKpi.name || '')
      setCategory(existingKpi.category || 'north_star')
      setCurrentValue(existingKpi.current_value || '0')
      setTargetValue(existingKpi.target_value || '100')
      setUnit(existingKpi.unit || 'numeric')
      setFrequency(existingKpi.frequency || 'monthly')
      setTrendDirection(existingKpi.trend_direction as any || 'up')
      setStatus(existingKpi.status as any || 'on_track')
      setCustomAttributes(existingKpi.custom_attributes || {})
    } else {
      setName('')
      setCategory('north_star')
      setCurrentValue('0')
      setTargetValue('100')
      setUnit('numeric')
      setFrequency('monthly')
      setTrendDirection('up')
      setStatus('on_track')
      setCustomAttributes({})
    }
  }, [existingKpi, isOpen])

  if (!isOpen) return null

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return
    setCustomAttributes(prev => ({ ...prev, [newAttrKey.trim()]: newAttrVal.trim() }))
    setNewAttrKey('')
    setNewAttrVal('')
  }

  const handleRemoveAttribute = (key: string) => {
    const updated = { ...customAttributes }
    delete updated[key]
    setCustomAttributes(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!name.trim() || loading) return

    setLoading(true)
    const payload = {
      name: name.trim(),
      category,
      current_value: currentValue,
      target_value: targetValue,
      unit,
      frequency,
      trend_direction: trendDirection,
      status,
      custom_attributes: customAttributes,
      organization_id: organizationId,
      project_id: projectId || null
    }

    let res
    if (existingKpi?.id) {
      res = await updateProductKpi(existingKpi.id, payload)
    } else {
      res = await createProductKpi(payload)
    }

    setLoading(false)
    if (res.ok && res.data) {
      onSaved(res.data)
      onClose()
    } else {
      console.error(res.error || 'Failed to save KPI')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {existingKpi ? 'Edit North Star KPI / Lever' : 'Register New North Star KPI or Growth Lever'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                KPI Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekly Active Executives, Net Dollar Retention, CAC Payback"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Strategic Category
              </label>
              <EnterpriseSelect
                value={category}
                onChange={(val) => setCategory(val as any)}
                options={[
                  { value: 'north_star', label: '⭐ Primary North Star Metric', description: 'The overall guiding metric for long-term value creation' },
                  { value: 'acquisition', label: '📈 Acquisition Growth Lever', description: 'Drives top-of-funnel customer sign-ups and acquisition' },
                  { value: 'activation', label: '⚡ Activation Growth Lever', description: 'Measures success in getting users to aha-moment and core value' },
                  { value: 'retention', label: '🔄 Retention Growth Lever', description: 'Ensures long-term engagement and minimizes user churn' },
                  { value: 'revenue', label: '💰 Revenue Growth Lever', description: 'Monetization, expansions, upgrades, and lifetime value' },
                  { value: 'efficiency', label: '⚙️ Operational Efficiency Lever', description: 'Cost reduction, automation, and productivity gains' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Measurement Frequency
              </label>
              <EnterpriseSelect
                value={frequency}
                onChange={(val) => setFrequency(val as any)}
                options={[
                  { value: 'daily', label: 'Daily Measurement' },
                  { value: 'weekly', label: 'Weekly Measurement' },
                  { value: 'monthly', label: 'Monthly Measurement' },
                  { value: 'quarterly', label: 'Quarterly Measurement' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Baseline Value
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="e.g. 24.5, $120k, 1400"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Target Objective Value
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 50.0, $500k, 5000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Measurement Unit
              </label>
              <EnterpriseSelect
                value={unit}
                onChange={(val) => setUnit(val as any)}
                options={[
                  { value: 'numeric', label: 'Numeric (Count / Volume)', description: 'Standard numerical or counting metric' },
                  { value: 'percentage', label: 'Percentage (%)', description: 'Ratio or completion rate out of 100' },
                  { value: 'currency', label: 'Currency ($ / Financial)', description: 'Monetary value or revenue goal' },
                  { value: 'ratio', label: 'Ratio / Multiplier (e.g. 3.5x)', description: 'Growth or scale factor multiplier' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Performance Status & Trend
              </label>
              <div className="grid grid-cols-2 gap-2">
                <EnterpriseSelect
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                  options={[
                    { value: 'on_track', label: '🟢 On Track' },
                    { value: 'at_risk', label: '🟡 At Risk' },
                    { value: 'behind', label: '🔴 Behind Target' },
                  ]}
                />
                <EnterpriseSelect
                  value={trendDirection}
                  onChange={(val) => setTrendDirection(val as any)}
                  options={[
                    { value: 'up', label: '📈 Trend Up' },
                    { value: 'neutral', label: '⚖️ Neutral' },
                    { value: 'down', label: '📉 Trend Down' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Custom Attributes Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Custom Analytical Columns & Metadata (Optional)
            </span>
            
            {Object.keys(customAttributes).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(customAttributes).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-xs font-medium text-slate-800 dark:text-slate-200 group relative">
                    <strong className="text-indigo-600 dark:text-indigo-400">{k}:</strong> {v}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(k)}
                      style={{ cursor: 'pointer' }}
                      className="text-slate-400 hover:text-rose-500 ml-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      title="Remove column"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Column Name (e.g. Data Owner, Target Persona)"
                className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Value (e.g. Growth Marketing Squad)"
                className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                disabled={!newAttrKey.trim() || !newAttrVal.trim()}
                style={{ cursor: 'pointer' }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shrink-0 transition-all disabled:opacity-50"
              >
                + Add Column
              </button>
            </div>
          </div>

          {/* Footer Actions */}
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
                  <Save className="w-4 h-4 mr-2" /> {existingKpi ? 'Save Changes' : 'Register KPI Lever'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
