'use client'

import React, { useState } from 'react'
import type { StrategicPillar } from '@/lib/product-strategy/types'
import { Plus, Trash2, Layers, Target, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTargetMetric, setEditTargetMetric] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editDescription.trim()) return

    onChange(pillars.map(p => p.id === editingId ? {
      ...p,
      title: editTitle.trim(),
      description: editDescription.trim(),
      target_metric: editTargetMetric.trim() || undefined
    } : p))
    
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(pillars.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-violet-500" />
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
            className="inline-flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Pillar
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-200 dark:border-violet-900/40 space-y-3">
          <h4 className="text-xs font-bold text-violet-800 dark:text-violet-200 uppercase">
            New Strategic Pillar
          </h4>
          <input
            type="text"
            required
            placeholder="Pillar Title (e.g., Enterprise Readiness)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
          <textarea
            required
            rows={2}
            placeholder="Pillar Description (What it means and why it matters)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-y"
          />
          <input
            type="text"
            placeholder="Target Metric / KPI (Optional)"
            value={targetMetric}
            onChange={(e) => setTargetMetric(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm"
            >
              Save Pillar
            </button>
          </div>
        </form>
      )}

      {pillars.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No strategic pillars defined yet. Add the core focus areas for this product.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar, idx) => {
            if (editingId === pillar.id) {
              return (
                <form key={pillar.id} onSubmit={handleSaveEdit} className="p-4 bg-violet-50/50 dark:bg-violet-900/10 rounded-xl border border-violet-200 dark:border-violet-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-violet-800 dark:text-violet-200 uppercase">Edit Pillar</h4>
                  <input
                    type="text"
                    required
                    placeholder="Pillar Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Pillar Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-y"
                  />
                  <input
                    type="text"
                    placeholder="Target Metric (Optional)"
                    value={editTargetMetric}
                    onChange={(e) => setEditTargetMetric(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{ cursor: 'pointer' }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ cursor: 'pointer' }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div
                key={pillar.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white pr-6">
                        {pillar.title}
                      </h4>
                    </div>
                    {hasEditAccess && (
                      <div className={`flex items-center space-x-1 transition-opacity ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(pillar.id)
                            setEditTitle(pillar.title)
                            setEditDescription(pillar.description)
                            setEditTargetMetric(pillar.target_metric || '')
                          }}
                          style={{ cursor: 'pointer' }}
                          className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                          title="Edit Pillar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pillar.id)}
                          style={{ cursor: 'pointer' }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Delete Pillar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed prose prose-sm prose-violet dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{pillar.description}</ReactMarkdown>
                  </div>
                </div>
                {pillar.target_metric && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Target className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="break-words">Target: {pillar.target_metric}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
