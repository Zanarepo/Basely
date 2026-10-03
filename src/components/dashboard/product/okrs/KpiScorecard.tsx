'use client'

import React, { useState } from 'react'
import type { ProductKpi } from '@/lib/product-strategy/types'
import { updateProductKpi, deleteProductKpi } from '@/lib/product-strategy/kpi-actions'
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
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between overflow-hidden">
      
      {/* Left side: Category, Title, Trend & Attributes */}
      <div className="flex-1 min-w-0 w-full flex flex-col gap-1.5">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50">
            {categoryLabels[kpi.category] || kpi.category}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[kpi.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'}`}>
            {kpi.status.replace('_', ' ')}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
          {kpi.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-violet-500" />
            Measured {kpi.frequency}
          </div>
          
          <div className="flex items-center gap-1">
            {kpi.trend_direction === 'up' ? (
              <span className="inline-flex items-center text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-1" /> Trending Up
              </span>
            ) : kpi.trend_direction === 'down' ? (
              <span className="inline-flex items-center text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                <TrendingDown className="w-3 h-3 mr-1" /> Trending Down
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                <Minus className="w-3 h-3 mr-1" /> Stable
              </span>
            )}
          </div>

          {/* Dynamic Custom Attributes */}
          {kpi.custom_attributes && Object.keys(kpi.custom_attributes).length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              {Object.entries(kpi.custom_attributes).map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 group/tag">
                  <strong className="text-slate-400 dark:text-slate-500">{key}:</strong> {val}
                  {hasEditAccess && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveAttribute(key, e)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Custom Attribute (Hover only) */}
        {hasEditAccess && (
          <div className="mt-1 flex items-center gap-1.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
            <input
              type="text"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              placeholder="Tag Name"
              className="w-24 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-[10px] focus:ring-1 focus:ring-violet-500 focus:outline-none"
            />
            <input
              type="text"
              value={newAttrVal}
              onChange={(e) => setNewAttrVal(e.target.value)}
              placeholder="Value"
              className="w-32 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 text-[10px] focus:ring-1 focus:ring-violet-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={isAddingAttr || !newAttrKey.trim() || !newAttrVal.trim()}
              className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded text-xs transition-colors disabled:opacity-40"
            >
              {isAddingAttr ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Right side: Values & Actions */}
      <div className="flex items-center gap-6 md:gap-8 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
        
        {/* Value Dashboard */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Current</span>
            {isEditingValue && hasEditAccess ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={inlineValue}
                  onChange={(e) => setInlineValue(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-base font-bold bg-white dark:bg-slate-700 border border-violet-500 rounded text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveValue}
                  disabled={isUpdatingValue}
                  className="p-1 text-white bg-violet-500 hover:bg-violet-600 rounded"
                >
                  {isUpdatingValue ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <div
                onClick={() => hasEditAccess && setIsEditingValue(true)}
                className={`flex items-baseline gap-1 group/value justify-end ${hasEditAccess ? 'cursor-pointer hover:opacity-80' : ''}`}
              >
                <span className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 leading-none">
                  {kpi.current_value}
                </span>
                <span className="text-xs font-bold text-violet-400 uppercase">{kpi.unit === 'percentage' ? '%' : kpi.unit === 'currency' ? '$' : ''}</span>
                {isUpdatingValue && <Loader2 className="w-3 h-3 animate-spin text-violet-500 ml-1" />}
              </div>
            )}
          </div>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Target</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300 leading-none">
                {kpi.target_value}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">{kpi.unit === 'percentage' ? '%' : kpi.unit === 'currency' ? '$' : ''}</span>
            </div>
          </div>
        </div>

        {/* Actions (Hover) */}
        {hasEditAccess && (
          <div className="flex flex-row md:flex-col items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onEdit(kpi)
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
