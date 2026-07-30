'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRoadmapItems } from '@/lib/product-roadmap/actions'
import { RoadmapCard } from './RoadmapCard'
import { Loader2, Plus } from 'lucide-react'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

import { updateRoadmapHorizon } from '@/lib/product-roadmap/actions'

export function RoadmapDashboard({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverHorizon, setDragOverHorizon] = useState<string | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, message }])
  }, [])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { success, data, error } = await getRoadmapItems(projectId)
      if (success && data) {
        setItems(data)
      } else {
        showToast('Failed to load roadmap: ' + error, 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, horizon: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverHorizon !== horizon) setDragOverHorizon(horizon)
  }

  const handleDragLeave = () => {
    setDragOverHorizon(null)
  }

  const handleDrop = async (e: React.DragEvent, targetHorizon: 'Now' | 'Next' | 'Later' | null) => {
    e.preventDefault()
    setDragOverHorizon(null)
    
    if (!draggedItemId) return
    const itemId = draggedItemId
    setDraggedItemId(null)
    
    const itemToMove = items.find(i => i.id === itemId)
    if (!itemToMove || itemToMove.horizon === targetHorizon) return
    
    // Optimistic update
    const previousItems = [...items]
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, horizon: targetHorizon } : i))
    
    // Background API call
    const { success, error } = await updateRoadmapHorizon(itemId, targetHorizon as any)
    if (success) {
      showToast(targetHorizon ? `Moved to ${targetHorizon}` : 'Moved to Backlog', 'success')
    } else {
      showToast('Failed to move item: ' + error, 'error')
      setItems(previousItems) // Revert on failure
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const horizons = ['Now', 'Next', 'Later']

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Outcome-Driven Roadmap</h2>
          <p className="text-sm text-slate-500 mt-1">Visualize strategic themes across time horizons. Variances with Gantt schedules will be flagged automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Backlog Column */}
        <div 
          className={`bg-app-surface-solid border border-app-border rounded-2xl flex flex-col h-[calc(100vh-250px)] shadow-sm transition-all duration-300
            ${dragOverHorizon === 'Backlog' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-lg ring-2 ring-indigo-500/30' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, 'Backlog')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="flex items-center gap-2 p-3.5 pb-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Backlog</h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2">
              {items.filter(i => !i.horizon).length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 custom-scrollbar">
            {items.filter(i => !i.horizon).length === 0 ? (
              <div className="text-center py-6 text-xs text-app-subtle border-2 border-dashed border-app-border/40 rounded-xl">
                No cards in this stage
              </div>
            ) : (
              items.filter(i => !i.horizon).map(item => (
                <RoadmapCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={loadData}
                  showToast={showToast}
                  draggedItemId={draggedItemId}
                  onDragStart={handleDragStart}
                />
              ))
            )}
          </div>
        </div>

        {/* Horizons */}
        {horizons.map(horizon => {
          const columnItems = items.filter(i => i.horizon === horizon)
          const dotColor = horizon === 'Now' ? '#6366f1' : horizon === 'Next' ? '#10b981' : '#f59e0b'
          
          return (
            <div 
              key={horizon} 
              className={`bg-app-surface-solid border border-app-border rounded-2xl flex flex-col h-[calc(100vh-250px)] shadow-sm transition-all duration-300
                ${dragOverHorizon === horizon ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-lg ring-2 ring-indigo-500/30' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, horizon)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, horizon as any)}
            >
              <div className="flex items-center gap-2 p-3.5 pb-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{horizon}</h3>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2">
                  {columnItems.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 p-3 custom-scrollbar">
                {columnItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-app-subtle border-2 border-dashed border-app-border/40 rounded-xl">
                    No cards in this stage
                  </div>
                ) : (
                  columnItems.map(item => (
                    <RoadmapCard 
                      key={item.id} 
                      item={item} 
                      onUpdate={loadData}
                      showToast={showToast}
                      draggedItemId={draggedItemId}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
