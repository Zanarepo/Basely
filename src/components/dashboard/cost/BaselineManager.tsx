'use client'

import { useState } from 'react'
import { FileDigit, Plus, Camera, History, ArrowLeft, Loader2, Edit2, Trash2, Check, X } from 'lucide-react'
import type { BudgetBaseline, BaselineCostSnapshot } from '@/lib/cost/types'
import { createBudgetBaseline, getBaselineSnapshots, updateBudgetBaseline, deleteBudgetBaseline } from '@/lib/cost/actions'
import { formatCurrency } from '@/lib/utils'

type Props = {
  projectId: string
  baselines: BudgetBaseline[]
  projectCurrency: string
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function BaselineManager({ projectId, baselines, projectCurrency, hasEditAccess, onDataChange }: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [newBaselineName, setNewBaselineName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<BaselineCostSnapshot[]>([])
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false)

  const [editingBaselineId, setEditingBaselineId] = useState<string | null>(null)
  const [editingBaselineName, setEditingBaselineName] = useState('')
  const [isEditingSaving, setIsEditingSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newBaselineName.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      await createBudgetBaseline(projectId, newBaselineName.trim())
      setIsCreating(false)
      setNewBaselineName('')
      onDataChange()
    } catch (err: any) {
      setError(err.message || 'Failed to create baseline snapshot')
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewData = async (baselineId: string) => {
    setIsCreating(false)
    setSelectedBaselineId(baselineId)
    setIsLoadingSnapshots(true)
    try {
      const data = await getBaselineSnapshots(baselineId)
      setSnapshots(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSnapshots(false)
    }
  }

  const handleUpdateBaseline = async (id: string) => {
    if (!editingBaselineName.trim()) return
    setIsEditingSaving(true)
    try {
      await updateBudgetBaseline(id, editingBaselineName.trim())
      setEditingBaselineId(null)
      onDataChange()
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsEditingSaving(false)
    }
  }

  const handleDeleteBaseline = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this baseline snapshot?")) return
    setIsDeletingId(id)
    try {
      await deleteBudgetBaseline(id)
      if (selectedBaselineId === id) setSelectedBaselineId(null)
      onDataChange()
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsDeletingId(null)
    }
  }

  const selectedBaseline = baselines.find(b => b.id === selectedBaselineId)

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px]">
      {/* Left List: Baselines */}
      <div className="w-full lg:w-1/3 h-[40vh] lg:h-full bg-app-surface border border-app-border rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-app-border bg-app-muted-surface flex justify-between items-center">
          <div>
            <h3 className="font-bold text-app-fg">Budget Baselines</h3>
            <p className="text-xs text-app-muted mt-1">Immutable snapshots</p>
          </div>
          {hasEditAccess && (
            <button
              onClick={() => {
                setSelectedBaselineId(null)
                setIsCreating(true)
              }}
              className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              title="Create new baseline"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {baselines.length === 0 ? (
            <p className="text-center text-app-muted text-sm mt-8">No baselines created yet.</p>
          ) : (
            baselines.map(baseline => (
              <div
                key={baseline.id}
                className="w-full text-left p-4 mb-2 rounded-xl border bg-app-surface border-app-border group/row hover:bg-app-hover transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  {editingBaselineId === baseline.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        type="text" 
                        autoFocus
                        value={editingBaselineName} 
                        onChange={e => setEditingBaselineName(e.target.value)} 
                        className="flex-1 px-2 py-1 bg-app-input border border-app-border rounded text-sm text-app-fg focus:outline-none focus:border-indigo-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdateBaseline(baseline.id)
                          if (e.key === 'Escape') setEditingBaselineId(null)
                        }}
                      />
                      <button onClick={() => handleUpdateBaseline(baseline.id)} disabled={isEditingSaving} className="p-1 hover:bg-green-100 text-green-600 rounded">
                        {isEditingSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingBaselineId(null)} disabled={isEditingSaving} className="p-1 hover:bg-red-100 text-red-600 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full h-7">
                      <span className="font-bold text-sm text-app-fg flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-app-muted" />
                        {baseline.name}
                      </span>
                      {hasEditAccess && (
                        <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                          <button 
                            onClick={() => {
                              setEditingBaselineId(baseline.id)
                              setEditingBaselineName(baseline.name)
                            }}
                            className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Rename Baseline"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBaseline(baseline.id)}
                            disabled={isDeletingId === baseline.id}
                            className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete Baseline"
                          >
                            {isDeletingId === baseline.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs text-app-muted mt-3">
                  <span>Saved: {new Date(baseline.saved_at).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleViewData(baseline.id)}
                    className="text-indigo-500 hover:text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    View Data
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Detail: Create Baseline or View */}
      <div className="w-full lg:w-2/3 bg-app-surface border border-app-border rounded-3xl flex flex-col shadow-sm p-6">
        {isCreating ? (
          <div className="flex-1 flex flex-col max-w-md mx-auto justify-center w-full">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-app-fg">Snapshot Current Budget</h2>
              <p className="text-sm text-app-muted mt-2">
                This will create an immutable copy of all current cost accounts, rates, and time-phase entries.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Baseline Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newBaselineName}
                  onChange={e => setNewBaselineName(e.target.value)}
                  className="w-full px-4 py-3 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Initial Approved Budget v1.0"
                />
              </div>

              {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newBaselineName.trim() || isSaving}
                  className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSaving ? 'Snapshotting...' : 'Create Snapshot'}
                </button>
              </div>
            </div>
          </div>
        ) : selectedBaselineId ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setSelectedBaselineId(null)}
                className="p-2 hover:bg-app-muted-surface rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-app-muted" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-app-fg">{selectedBaseline?.name}</h2>
                <p className="text-sm text-app-muted">
                  Snapshot taken on {selectedBaseline && new Date(selectedBaseline.saved_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {isLoadingSnapshots ? (
                <div className="flex flex-col items-center justify-center h-full text-app-subtle">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                  <p>Loading snapshot data...</p>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-app-subtle">
                  <FileDigit className="w-12 h-12 mb-4 opacity-20" />
                  <p>No budget records found for this baseline.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-app-muted uppercase tracking-wider border-b border-app-border">
                    <div className="col-span-8">WBS Element</div>
                    <div className="col-span-4 text-right">Baseline Total</div>
                  </div>
                  {snapshots.map(snap => (
                    <div key={snap.id} className="grid grid-cols-12 gap-4 p-4 bg-app-input border border-app-border rounded-xl items-center">
                      <div className="col-span-8">
                        <h4 className="font-bold text-sm text-app-fg">{snap.snapshotted_wbs_name}</h4>
                      </div>
                      <div className="col-span-4 text-right font-semibold text-app-fg">
                        {formatCurrency(snap.baseline_total, projectCurrency)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-4 border-t border-app-border flex justify-between items-center">
                    <span className="font-bold text-app-fg">Total Baseline Budget</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(snapshots.reduce((acc, curr) => acc + curr.baseline_total, 0), projectCurrency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-app-subtle">
            <History className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a baseline to view historical snapshots, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
