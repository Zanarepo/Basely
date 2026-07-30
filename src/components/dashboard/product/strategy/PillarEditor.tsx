'use client'

import React, { useState } from 'react'
import type { StrategicPillar } from '@/lib/product-strategy/types'
import { Plus, Trash2, Layers, Target } from 'lucide-react'

interface PillarEditorProps {
  pillars: StrategicPillar[]
  onChange: (pillars: StrategicPillar[]) => void
  hasEditAccess?: boolean
}

export function PillarEditor({ pillars = [], onChange, hasEditAccess = true }: PillarEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetMetric, setTargetMetric] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newPillar: StrategicPillar = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim(),
      target_metric: targetMetric.trim() || undefined
    }

    onChange([...pillars, newPillar])
    setTitle('')
    setDescription('')
    setTargetMetric('')
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    onChange(pillars.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Core Strategic Pillars
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {pillars.length}
          </span>
        </div>

        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Pillar
          </button>
        )}
      </div>

      {/* Add New Pillar Inline Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-indigo-200 dark:border-indigo-900/40 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
            New Strategic Pillar
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                required
                placeholder="Pillar Title (e.g., AI-Driven Automation)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Target KPI / Metric (e.g., 50% faster onboarding)"
                value={targetMetric}
                onChange={(e) => setTargetMetric(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              placeholder="Brief operational objective or value delivered by this strategic pillar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-sm"
            >
              Add Pillar
            </button>
          </div>
        </form>
      )}

      {/* Pillars List */}
      {pillars.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No strategic pillars defined yet. Define core focus areas guiding this initiative.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.id}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 shrink-0" />
                    {pillar.title}
                  </h4>

                  {hasEditAccess && (
                    <button
                      type="button"
                      onClick={() => handleDelete(pillar.id)}
                      style={{ cursor: 'pointer' }}
                      className={`p-1 text-slate-400 hover:text-red-500 rounded transition-opacity ${
                        hoveredIndex === idx ? 'opacity-100' : 'opacity-0 focus:opacity-100'
                      }`}
                      title="Remove Pillar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {pillar.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {pillar.description}
                  </p>
                )}
              </div>

              {pillar.target_metric && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Target className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">Target: {pillar.target_metric}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
