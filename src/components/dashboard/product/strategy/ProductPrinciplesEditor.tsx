'use client'

import React, { useState } from 'react'
import type { ProductPrinciple } from '@/lib/product-strategy/types'
import { Plus, Trash2, Compass, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ProductPrinciplesEditorProps {
  principles: ProductPrinciple[]
  onChange: (principles: ProductPrinciple[]) => void
  hasEditAccess?: boolean
}

export function ProductPrinciplesEditor({ principles = [], onChange, hasEditAccess = true }: ProductPrinciplesEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const newPrinciple: ProductPrinciple = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim()
    }

    onChange([...principles, newPrinciple])
    setTitle('')
    setDescription('')
    setIsAdding(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editDescription.trim()) return

    onChange(principles.map(p => p.id === editingId ? {
      ...p,
      title: editTitle.trim(),
      description: editDescription.trim()
    } : p))
    
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(principles.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Product Principles
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {principles.length}
          </span>
        </div>
        
        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Principle
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-3">
          <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">
            New Product Principle
          </h4>
          <input
            type="text"
            required
            placeholder="Principle Title (e.g., Simple over easy)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <textarea
            required
            rows={2}
            placeholder="Description (How does this guide decision making?)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm"
            >
              Save Principle
            </button>
          </div>
        </form>
      )}

      {principles.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No product principles defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {principles.map((p, idx) => {
            if (editingId === p.id) {
              return (
                <form key={p.id} onSubmit={handleSaveEdit} className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">Edit Principle</h4>
                  <input
                    type="text"
                    required
                    placeholder="Principle Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
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
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">{p.title}</span>
                  {hasEditAccess && (
                    <div className={`flex items-center space-x-1 transition-opacity ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id)
                          setEditTitle(p.title)
                          setEditDescription(p.description)
                        }}
                        style={{ cursor: 'pointer' }}
                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                        title="Edit Principle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        style={{ cursor: 'pointer' }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Delete Principle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 pr-6 prose prose-sm prose-blue dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                  <ReactMarkdown>{p.description}</ReactMarkdown>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
