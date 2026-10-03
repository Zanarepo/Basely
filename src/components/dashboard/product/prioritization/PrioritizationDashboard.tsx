'use client'

import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, ScatterChart, Sparkles, Loader2, Plus } from 'lucide-react'
import { RiceMatrixTable } from './RiceMatrixTable'
import { EffortImpactScatterPlot } from './EffortImpactScatterPlot'
import { ProductBacklogItem } from '@/lib/product-strategy/types'
import { getBacklogItems, upsertBacklogItem } from '@/lib/product-backlog/actions'
import { generateRiceItemsFromOpportunityAssessment } from '@/lib/documents/ai-chain-actions'
import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import { PmDiscoveryWorkflowGuide } from '../discovery/PmDiscoveryWorkflowGuide'

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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
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
    return <DocumentLoader message="Loading RICE Prioritization Engine..." />
  }

  const handleAiGenerate = async () => {
    if (isGeneratingAi) return
    setIsGeneratingAi(true)
    try {
      const res = await generateRiceItemsFromOpportunityAssessment(projectId, organizationId)
      if (res.ok) {
        showToast(`⚡ Generated ${res.count} RICE items from Opportunity Assessment!`, 'success')
        loadData()
      } else {
        showToast(res.error || 'Failed to generate items.', 'error')
      }
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      <PmDiscoveryWorkflowGuide currentStep={3} />

      {/* AI Generation Banner */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              AI RICE Prioritization
              <span className="bg-violet-600 text-white text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded">Praz-AI</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Auto-extract 6–12 scored feature initiatives from your Opportunity Assessment with RICE scores, MoSCoW classification, and effort estimates.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={isGeneratingAi}
          className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGeneratingAi ? 'Generating RICE items...' : 'Draft Backlog Items'}
        </button>
      </div>
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
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm' 
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
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm' 
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
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
