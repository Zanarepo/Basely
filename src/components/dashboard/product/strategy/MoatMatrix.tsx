'use client'

import React, { useState } from 'react'
import type { CompetitiveMoat } from '@/lib/product-strategy/types'
import { Plus, Trash2, ShieldCheck, Award } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface MoatMatrixProps {
  moats: CompetitiveMoat[]
  onChange: (moats: CompetitiveMoat[]) => void
  hasEditAccess?: boolean
}

const CATEGORY_LABELS: Record<CompetitiveMoat['category'], string> = {
  technology: 'Deep Technology',
  network_effects: 'Network Effects',
  brand: 'Brand Recognition',
  switching_costs: 'High Switching Costs',
  scale: 'Economies of Scale',
  other: 'Strategic Moat'
}

const STRENGTH_STYLES: Record<CompetitiveMoat['strength'], { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'High Defensibility' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', label: 'Medium Defensibility' },
  low: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Developing Defensibility' }
}

export function MoatMatrix({ moats = [], onChange, hasEditAccess = true }: MoatMatrixProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CompetitiveMoat['category']>('technology')
  const [strength, setStrength] = useState<CompetitiveMoat['strength']>('medium')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newMoat: CompetitiveMoat = {
      id: Math.random().toString(36).substring(2, 9),
      category,
      title: title.trim(),
      description: description.trim(),
      strength
    }

    onChange([...moats, newMoat])
    setTitle('')
    setDescription('')
    setCategory('technology')
    setStrength('medium')
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    onChange(moats.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Competitive Moat & Defensibility Matrix
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {moats.length}
          </span>
        </div>

        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Moat
          </button>
        )}
      </div>

      {/* Add Inline Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
            Define Competitive Moat
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Moat Category
              </label>
              <EnterpriseSelect
                value={category}
                onChange={(val) => setCategory(val as any)}
                options={Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ value: key, label: label as string }))}
                size="sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Defensibility Strength
              </label>
              <EnterpriseSelect
                value={strength}
                onChange={(val) => setStrength(val as any)}
                options={[
                  { value: 'high', label: '🛡️ High Defensibility' },
                  { value: 'medium', label: '⚔️ Medium Defensibility' },
                  { value: 'low', label: '🌱 Developing Defensibility' },
                ]}
                size="sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Moat Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Proprietary LLM Datasets"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              placeholder="Explain how this structural moat protects against competitor displacement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ cursor: 'pointer' }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ cursor: 'pointer' }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Add Moat
            </button>
          </div>
        </form>
      )}

      {/* Moats Grid / List */}
      {moats.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No competitive moats charted yet. Detail the protective barriers and competitive differentiators for this product.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moats.map((moat, idx) => {
            const style = STRENGTH_STYLES[moat.strength] || STRENGTH_STYLES.medium
            return (
              <div
                key={moat.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      {CATEGORY_LABELS[moat.category] || moat.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      {hasEditAccess && (
                        <button
                          type="button"
                          onClick={() => handleDelete(moat.id)}
                          style={{ cursor: 'pointer' }}
                          className={`p-1 text-slate-400 hover:text-red-500 rounded transition-opacity ${
                            hoveredIndex === idx ? 'opacity-100' : 'opacity-0 focus:opacity-100'
                          }`}
                          title="Delete Moat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {moat.title}
                  </h4>

                  {moat.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {moat.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
