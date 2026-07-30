'use client'

import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, ScatterChart } from 'lucide-react'
import { RiceMatrixTable } from './RiceMatrixTable'
import { EffortImpactScatterPlot } from './EffortImpactScatterPlot'
import { ProductBacklogItem } from '@/lib/product-strategy/types'
import { getBacklogItems, upsertBacklogItem } from '@/lib/product-backlog/actions'
import { Loader2, Plus } from 'lucide-react'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

export function PrioritizationDashboard({ 
  organizationId, 
  projectId 
}: { 
  organizationId: string, 
  projectId: string 
}) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'plot'>('matrix')
  const [items, setItems] = useState<ProductBacklogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, message }])
  }, [])

  const loadData = useCallback(async () => {
    try {
      const { success, data, error } = await getBacklogItems(projectId)
      if (success && data) {
        setItems(data)
      } else {
        showToast('Failed to load backlog items', 'error')
      }
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateNew = async () => {
    setIsCreating(true)
    try {
      const { success, error } = await upsertBacklogItem({
        project_id: projectId,
        organization_id: organizationId,
        title: 'New Feature Request',
        description: 'Describe the feature...',
        reach: 5,
        impact: 5,
        confidence: 80,
        effort: 5
      })
      if (success) {
        showToast('Created new backlog item', 'success')
        loadData()
      } else {
        showToast('Failed to create item: ' + error, 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">RICE Prioritization Engine</h2>
          <p className="text-sm text-slate-500 mt-1">Score and deconstruct backlog features into execution-ready tasks.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'matrix' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Matrix View
          </button>
          <button
            onClick={() => setActiveTab('plot')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'plot' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScatterChart className="w-4 h-4" />
            Scatter Plot
          </button>
        </div>
        
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Item
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'matrix' ? (
          <RiceMatrixTable 
            organizationId={organizationId}
            projectId={projectId}
            items={items}
            onUpdate={loadData}
            showToast={showToast}
          />
        ) : (
          <EffortImpactScatterPlot items={items} />
        )}
      </div>
    </div>
  )
}
