'use client'

import React, { useState } from 'react'
import type { StrategicBet } from '@/lib/product-strategy/types'
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface StrategicBetsEditorProps {
  bets: StrategicBet[]
  onChange: (bets: StrategicBet[]) => void
  hasEditAccess?: boolean
}

export function StrategicBetsEditor({ bets = [], onChange, hasEditAccess = true }: StrategicBetsEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [bet, setBet] = useState('')
  const [whyItMatters, setWhyItMatters] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBet, setEditBet] = useState('')
  const [editWhyItMatters, setEditWhyItMatters] = useState('')
  const [editExpectedOutcome, setEditExpectedOutcome] = useState('')
  const [editConfidence, setEditConfidence] = useState<'high' | 'medium' | 'low'>('medium')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bet.trim() || !whyItMatters.trim() || !expectedOutcome.trim()) return

    const newBet: StrategicBet = {
      id: Math.random().toString(36).substring(2, 9),
      bet: bet.trim(),
      why_it_matters: whyItMatters.trim(),
      expected_outcome: expectedOutcome.trim(),
      confidence
    }

    onChange([...bets, newBet])
    setBet('')
    setWhyItMatters('')
    setExpectedOutcome('')
    setConfidence('medium')
    setIsAdding(false)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBet.trim() || !editWhyItMatters.trim() || !editExpectedOutcome.trim()) return

    onChange(bets.map(b => b.id === editingId ? {
      ...b,
      bet: editBet.trim(),
      why_it_matters: editWhyItMatters.trim(),
      expected_outcome: editExpectedOutcome.trim(),
      confidence: editConfidence
    } : b))
    
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(bets.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
            Strategic Bets & Approach
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {bets.length}
          </span>
        </div>
        
        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Bet
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-3">
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase">
            New Strategic Bet
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
            <input
              type="text"
              required
              placeholder="The Bet (e.g., Vertical integration into payments)"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <EnterpriseSelect
              value={confidence}
              onChange={(val) => setConfidence(val as 'high' | 'medium' | 'low')}
              options={[
                { value: 'high', label: 'High Confidence' },
                { value: 'medium', label: 'Medium Confidence' },
                { value: 'low', label: 'Low Confidence' }
              ]}
              size="sm"
            />
          </div>
          <textarea
            required
            rows={2}
            placeholder="Why it matters (The rationale)..."
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y"
          />
          <textarea
            required
            rows={2}
            placeholder="Expected outcome (What happens if we're right)..."
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y"
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
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm"
            >
              Save Bet
            </button>
          </div>
        </form>
      )}

      {bets.length === 0 && !isAdding ? (
        <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          No strategic bets defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bets.map((b, idx) => {
            if (editingId === b.id) {
              return (
                <form key={b.id} onSubmit={handleSaveEdit} className="col-span-full md:col-span-1 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase">
                    Edit Strategic Bet
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
                    <input
                      type="text"
                      required
                      placeholder="The Bet"
                      value={editBet}
                      onChange={(e) => setEditBet(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <EnterpriseSelect
                      value={editConfidence}
                      onChange={(val) => setEditConfidence(val as 'high' | 'medium' | 'low')}
                      options={[
                        { value: 'high', label: 'High Confidence' },
                        { value: 'medium', label: 'Medium Confidence' },
                        { value: 'low', label: 'Low Confidence' }
                      ]}
                      size="sm"
                    />
                  </div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Why it matters"
                    value={editWhyItMatters}
                    onChange={(e) => setEditWhyItMatters(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Expected outcome"
                    value={editExpectedOutcome}
                    onChange={(e) => setEditExpectedOutcome(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y"
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
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div
                key={b.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider pr-2">{b.bet}</span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.confidence === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : b.confidence === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {b.confidence}
                      </span>
                      {hasEditAccess && (
                        <div className={`flex items-center space-x-1 transition-opacity ${hoveredIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(b.id)
                              setEditBet(b.bet)
                              setEditWhyItMatters(b.why_it_matters)
                              setEditExpectedOutcome(b.expected_outcome)
                              setEditConfidence(b.confidence)
                            }}
                            style={{ cursor: 'pointer' }}
                            className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                            title="Edit Bet"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            style={{ cursor: 'pointer' }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                            title="Delete Bet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 prose prose-sm prose-amber dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{`**Why:** ${b.why_it_matters}`}</ReactMarkdown>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 prose prose-sm prose-amber dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{`**Outcome:** ${b.expected_outcome}`}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
