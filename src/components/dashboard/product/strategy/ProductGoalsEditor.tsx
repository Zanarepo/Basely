'use client'

import React, { useState } from 'react'
import type { ProductGoal } from '@/lib/product-strategy/types'
import { Plus, Trash2, Zap, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ProductGoalsEditorProps {
  goals: ProductGoal[]
  onChange: (goals: ProductGoal[]) => void
  hasEditAccess?: boolean
}

export function ProductGoalsEditor({ goals = [], onChange, hasEditAccess = true }: ProductGoalsEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [goal, setGoal] = useState('')
  const [category, setCategory] = useState<'business' | 'customer' | 'product'>('business')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGoal, setEditGoal] = useState('')
  const [editCategory, setEditCategory] = useState<'business' | 'customer' | 'product'>('business')
  const [editBaseline, setEditBaseline] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editTimeframe, setEditTimeframe] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return

    const newGoal: ProductGoal = {
      id: Math.random().toString(36).substring(2, 9),
      category,
      goal: goal.trim(),
      baseline: baseline.trim() || undefined,
      target: target.trim() || undefined,
      timeframe: timeframe.trim() || undefined
    }

    onChange([...goals, newGoal])
    setGoal('')
    setCategory('business')
    setBaseline('')
    setTarget('')
    setTimeframe('')
    setIsAdding(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editGoal.trim()) return

    onChange(goals.map(g => g.id === editingId ? {
      ...g,
      category: editCategory,
      goal: editGoal.trim(),
      baseline: editBaseline.trim() || undefined,
      target: editTarget.trim() || undefined,
      timeframe: editTimeframe.trim() || undefined
    } : g))
    
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(goals.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Business, Customer & Product Goals
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {goals.length}
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
            Add Goal
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase">
            New Strategic Goal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
            <input
              type="text"
              required
              placeholder="Goal Description (e.g., Increase user retention by 20%)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <EnterpriseSelect
              value={category}
              onChange={(val) => setCategory(val as 'business' | 'customer' | 'product')}
              options={[
                { value: 'business', label: 'Business Goal' },
                { value: 'customer', label: 'Customer Goal' },
                { value: 'product', label: 'Product Goal' }
              ]}
              size="sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Baseline (e.g., 45% retention)"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Target (e.g., 65% retention)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Timeframe (e.g., Q3 2024)"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No strategic goals defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((g, idx) => {
            if (editingId === g.id) {
              return (
                <form key={g.id} onSubmit={handleSaveEdit} className="col-span-full md:col-span-1 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase">
                    Edit Strategic Goal
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Goal Description"
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <EnterpriseSelect
                      value={editCategory}
                      onChange={(val) => setEditCategory(val as 'business' | 'customer' | 'product')}
                      options={[
                        { value: 'business', label: 'Business Goal' },
                        { value: 'customer', label: 'Customer Goal' },
                        { value: 'product', label: 'Product Goal' }
                      ]}
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Baseline"
                      value={editBaseline}
                      onChange={(e) => setEditBaseline(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Target"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Timeframe"
                      value={editTimeframe}
                      onChange={(e) => setEditTimeframe(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
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
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div
                key={g.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">{g.category} Goal</span>
                    <div className="flex items-center space-x-2">
                      {g.timeframe && <span className="text-[10px] text-slate-500 dark:text-slate-400">{g.timeframe}</span>}
                      {hasEditAccess && (
                        <div className={`flex items-center space-x-1 transition-opacity ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(g.id)
                              setEditGoal(g.goal)
                              setEditCategory(g.category)
                              setEditBaseline(g.baseline || '')
                              setEditTarget(g.target || '')
                              setEditTimeframe(g.timeframe || '')
                            }}
                            style={{ cursor: 'pointer' }}
                            className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                            title="Edit Goal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(g.id)}
                            style={{ cursor: 'pointer' }}
                            className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                            title="Delete Goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white pr-4 prose prose-sm prose-emerald dark:prose-invert max-w-none prose-p:my-0 prose-ul:my-0">
                    <ReactMarkdown>{g.goal}</ReactMarkdown>
                  </div>
                  {(g.baseline || g.target) && (
                    <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-2">
                      Baseline: {g.baseline || 'N/A'} → Target: {g.target || 'N/A'}
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
