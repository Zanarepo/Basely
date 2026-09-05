'use client'

import { useState } from 'react'
import { Layers, Trash2, Plus } from 'lucide-react'
import StructuredEditableField from '@/components/dashboard/documents/components/StructuredEditableField'
import type { ProductStrategy } from '@/lib/product-strategy/types'

interface CustomDimensionsPanelProps {
  strategy: ProductStrategy
  handleFieldChange: (field: keyof ProductStrategy, value: any) => void
  hasEditAccess: boolean
}

export function CustomDimensionsPanel({ strategy, handleFieldChange, hasEditAccess }: CustomDimensionsPanelProps) {
  const [newDimTitle, setNewDimTitle] = useState('')
  const [newDimDesc, setNewDimDesc] = useState('')

  return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
              Dynamic Custom Strategy Dimensions & Additional Columns
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Add extra custom sections for document auto-filling</span>
        </div>

        {strategy.custom_attributes && Object.keys(strategy.custom_attributes).filter(k => !k.startsWith('competitor_') && !k.startsWith('competitive_')).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(strategy.custom_attributes)
              .filter(([key]) => !key.startsWith('competitor_') && !key.startsWith('competitive_'))
              .map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3 relative group">
                <div className="absolute top-4 right-4 z-20">
                  {hasEditAccess && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const updated = { ...(strategy.custom_attributes || {}) }
                        delete updated[key]
                        handleFieldChange('custom_attributes', updated)
                      }}
                      style={{ cursor: 'pointer' }}
                      className="text-slate-400 hover:text-red-500 transition-opacity duration-200 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 bg-white/80 dark:bg-slate-800/80 rounded"
                      title="Delete Custom Dimension"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-wider mb-3">
                    <Layers className="w-4 h-4" />
                    <span>{key.replace(/_/g, ' ')}</span>
                  </div>
                  <StructuredEditableField
                    value={value}
                    onChange={(val) => {
                      const updated = { ...(strategy.custom_attributes || {}) }
                      updated[key] = val
                      handleFieldChange('custom_attributes', updated)
                    }}
                    title={key.replace(/_/g, ' ')}
                    hasEditAccess={hasEditAccess}
                    placeholder={`Enter ${key.replace(/_/g, ' ')} details...`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            No custom strategic dimensions added yet. Add custom analytical columns (e.g. Go-to-Market Channels, Regulatory Risk, Unit Economics) below.
          </p>
        )}

        {hasEditAccess && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newDimTitle}
                onChange={(e) => setNewDimTitle(e.target.value)}
                placeholder="Column / Dimension Name (e.g. GTM Strategy)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex items-center space-x-2">
              <input
                type="text"
                value={newDimDesc}
                onChange={(e) => setNewDimDesc(e.target.value)}
                placeholder="Content description or strategic values..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (!newDimTitle.trim() || !newDimDesc.trim()) return
                  const updated = { ...(strategy.custom_attributes || {}), [newDimTitle.trim()]: newDimDesc.trim() }
                  handleFieldChange('custom_attributes', updated)
                  setNewDimTitle('')
                  setNewDimDesc('')
                }}
                style={{ cursor: 'pointer' }}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 rounded-lg shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Dimension
              </button>
            </div>
          </div>
        )}
      </div>
  )
}
