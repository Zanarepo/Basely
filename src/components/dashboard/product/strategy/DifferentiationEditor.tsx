'use client'

import React, { useState } from 'react'
import type { DifferentiationItem } from '@/lib/product-strategy/types'
import { Plus, Trash2, Zap, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface DifferentiationEditorProps {
  items: DifferentiationItem[]
  onChange: (items: DifferentiationItem[]) => void
  hasEditAccess?: boolean
}

export function DifferentiationEditor({ items = [], onChange, hasEditAccess = true }: DifferentiationEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [defensibility, setDefensibility] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDefensibility, setEditDefensibility] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const newItem: DifferentiationItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim(),
      defensibility: defensibility.trim() || undefined
    }

    onChange([...items, newItem])
    setTitle('')
    setDescription('')
    setDefensibility('')
    setIsAdding(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editDescription.trim()) return

    onChange(items.map(item => item.id === editingId ? {
      ...item,
      title: editTitle.trim(),
      description: editDescription.trim(),
      defensibility: editDefensibility.trim() || undefined
    } : item))
    
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-pink-500" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Competitive Differentiation
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {items.length}
          </span>
        </div>
        
        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Advantage
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-900/40 space-y-3">
          <h4 className="text-xs font-bold text-pink-800 dark:text-pink-200 uppercase">
            New Competitive Advantage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Advantage Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Defensibility (Why it's hard to copy)"
              value={defensibility}
              onChange={(e) => setDefensibility(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>
          <textarea
            required
            rows={2}
            placeholder="Description of the competitive differentiation..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none resize-y"
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 rounded-lg shadow-sm"
            >
              Save Advantage
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No competitive differentiation defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            if (editingId === item.id) {
              return (
                <form key={item.id} onSubmit={handleSaveEdit} className="p-4 bg-pink-50/50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-pink-800 dark:text-pink-200 uppercase">
                    Edit Advantage
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Advantage Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Defensibility"
                      value={editDefensibility}
                      onChange={(e) => setEditDefensibility(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none resize-y"
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
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-pink-500 hover:bg-pink-600 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative p-4 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-1 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">{item.title}</span>
                  {hasEditAccess && (
                    <div className={`flex items-center space-x-1 transition-opacity ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id)
                          setEditTitle(item.title)
                          setEditDescription(item.description)
                          setEditDefensibility(item.defensibility || '')
                        }}
                        style={{ cursor: 'pointer' }}
                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                        title="Edit Advantage"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{ cursor: 'pointer' }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Delete Advantage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 pr-6 prose prose-sm prose-pink dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                  <ReactMarkdown>{item.description}</ReactMarkdown>
                </div>
                {item.defensibility && (
                  <p className="text-[11px] text-pink-600/70 dark:text-pink-400/70 mt-2"><strong>Defensibility:</strong> {item.defensibility}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
