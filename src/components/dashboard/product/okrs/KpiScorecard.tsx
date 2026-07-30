'use client'

import React, { useState } from 'react'
import type { ProductKpi } from '@/lib/product-strategy/types'
import { updateProductKpi, deleteProductKpi } from '@/lib/product-strategy/actions'
import { Edit2, Trash2, TrendingUp, TrendingDown, Minus, Loader2, Plus, X, Check, Activity } from 'lucide-react'

interface KpiScorecardProps {
  kpi: ProductKpi
  hasEditAccess: boolean
  onEdit: (kpi: ProductKpi) => void
  onDeleted: (id: string) => void
  onUpdated: (kpi: ProductKpi) => void
}

export function KpiScorecard({
  kpi,
  hasEditAccess,
  onEdit,
  onDeleted,
  onUpdated
}: KpiScorecardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingValue, setIsUpdatingValue] = useState(false)
  const [inlineValue, setInlineValue] = useState(kpi.current_value)
  const [isEditingValue, setIsEditingValue] = useState(false)
  
  // Custom attribute addition state
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')
  const [isAddingAttr, setIsAddingAttr] = useState(false)

  const categoryLabels: Record<string, string> = {
    north_star: '⭐ North Star Metric',
    acquisition: '📈 Acquisition Lever',
    activation: '⚡ Activation Lever',
    retention: '🔄 Retention Lever',
    revenue: '💰 Revenue Lever',
    efficiency: '⚙️ Efficiency Lever'
  }

  const statusColors = {
    on_track: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    at_risk: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    behind: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasEditAccess || isDeleting) return
    setIsDeleting(true)
    // Optimistic UI update
    const { ok } = await deleteProductKpi(kpi.id)
    if (ok) {
      onDeleted(kpi.id)
    } else {
      setIsDeleting(false)
    }
  }

  const handleSaveValue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (inlineValue === kpi.current_value) {
      setIsEditingValue(false)
      return
    }
    setIsUpdatingValue(true)
    const optimisticKpi = { ...kpi, current_value: inlineValue }
    onUpdated(optimisticKpi) // Optimistic state update (<100ms)
    setIsEditingValue(false)
    const res = await updateProductKpi(kpi.id, { current_value: inlineValue })
    setIsUpdatingValue(false)
    if (res.data) {
      onUpdated(res.data)
    }
  }

  const handleAddAttribute = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newAttrKey.trim() || !newAttrVal.trim()) return
    setIsAddingAttr(true)
    const updatedAttrs = { ...(kpi.custom_attributes || {}), [newAttrKey.trim()]: newAttrVal.trim() }
    const optimisticKpi = { ...kpi, custom_attributes: updatedAttrs }
    onUpdated(optimisticKpi)
    setNewAttrKey('')
    setNewAttrVal('')
    const res = await updateProductKpi(kpi.id, { custom_attributes: updatedAttrs })
    setIsAddingAttr(false)
    if (res.data) {
      onUpdated(res.data)
    }
  }

  const handleRemoveAttribute = async (keyToRemove: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updatedAttrs = { ...(kpi.custom_attributes || {}) }
    delete updatedAttrs[keyToRemove]
    const optimisticKpi = { ...kpi, custom_attributes: updatedAttrs }
    onUpdated(optimisticKpi)
    await updateProductKpi(kpi.id, { custom_attributes: updatedAttrs })
  }

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner & Category */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            {categoryLabels[kpi.category] || kpi.category}
          </span>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${statusColors[kpi.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
              {kpi.status.replace('_', ' ')}
            </span>

            {/* Hover-only Edit & Delete actions */}
            {hasEditAccess && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEdit(kpi)
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Edit KPI Parameters"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{ cursor: 'pointer' }}
                  title="Delete KPI"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPI Name */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4">
          {kpi.name}
        </h3>

        {/* Value Dashboard */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">CURRENT VALUE</span>
            {isEditingValue && hasEditAccess ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={inlineValue}
                  onChange={(e) => setInlineValue(e.target.value)}
                  className="w-24 px-2 py-1 text-sm font-bold bg-white dark:bg-slate-700 border border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveValue}
                  disabled={isUpdatingValue}
                  style={{ cursor: 'pointer' }}
                  className="p-1 text-white bg-indigo-500 hover:bg-indigo-600 rounded"
                >
                  {isUpdatingValue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <div
                onClick={() => hasEditAccess && setIsEditingValue(true)}
                style={{ cursor: hasEditAccess ? 'pointer' : 'default' }}
                className="flex items-baseline gap-1.5 group/value"
                title={hasEditAccess ? "Click to quick-update value without reload" : undefined}
              >
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {kpi.current_value}
                </span>
                <span className="text-xs text-slate-500 uppercase">{kpi.unit === 'percentage' ? '%' : kpi.unit === 'currency' ? '$' : ''}</span>
                {isUpdatingValue && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 ml-1" />}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">TARGET VALUE</span>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {kpi.target_value} <span className="text-xs text-slate-400 uppercase">{kpi.unit === 'percentage' ? '%' : kpi.unit === 'currency' ? '$' : ''}</span>
            </span>
          </div>
        </div>

        {/* Frequency & Trend */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mb-4">
          <div className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Measured {kpi.frequency}
          </div>
          <div className="flex items-center gap-1 font-semibold">
            {kpi.trend_direction === 'up' ? (
              <span className="inline-flex items-center text-emerald-500">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Trending Upward
              </span>
            ) : kpi.trend_direction === 'down' ? (
              <span className="inline-flex items-center text-rose-500">
                <TrendingDown className="w-3.5 h-3.5 mr-1" /> Trending Downward
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-500">
                <Minus className="w-3.5 h-3.5 mr-1" /> Stable Trend
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Custom Attributes / Extra Columns */}
        {kpi.custom_attributes && Object.keys(kpi.custom_attributes).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {Object.entries(kpi.custom_attributes).map(([key, val]) => (
              <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs group/tag relative">
                <strong className="text-indigo-600 dark:text-indigo-400">{key}:</strong> {val}
                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveAttribute(key, e)}
                    style={{ cursor: 'pointer' }}
                    className="text-slate-400 hover:text-rose-500 ml-1 transition-all opacity-0 group-hover/tag:opacity-100 focus:opacity-100"
                    title="Remove custom attribute"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Quick Add Custom Attribute */}
      {hasEditAccess && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <input
            type="text"
            value={newAttrKey}
            onChange={(e) => setNewAttrKey(e.target.value)}
            placeholder="New Column (e.g. Source)"
            className="w-1/2 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            value={newAttrVal}
            onChange={(e) => setNewAttrVal(e.target.value)}
            placeholder="Value (e.g. Snowflake)"
            className="w-1/2 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddAttribute}
            disabled={isAddingAttr || !newAttrKey.trim() || !newAttrVal.trim()}
            style={{ cursor: 'pointer' }}
            className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-40 inline-flex items-center"
          >
            {isAddingAttr ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  )
}
