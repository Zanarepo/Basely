'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Map } from 'lucide-react'
import { toast } from 'sonner'
import { getRoadmapItems } from '@/lib/product-roadmap/actions'
import { RoadmapBoard } from './roadmap/RoadmapBoard'
import { useRoadmapDnD } from './roadmap/hooks/useRoadmapDnD'
import { useAiGeneration } from './roadmap/hooks/useAiGeneration'
import { useRoadmapTheme } from './roadmap/hooks/useRoadmapTheme'
import { RoadmapItem } from '@/lib/product-roadmap/types'
import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'
import { RoadmapItemModal } from './roadmap/components/RoadmapItemModal'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface RoadmapWorkspaceProps {
  projectId: string
  organizationId: string
}

export default function RoadmapWorkspace({ projectId, organizationId }: RoadmapWorkspaceProps) {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<RoadmapItem | null | 'new'>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') toast.success(message)
    else if (type === 'error') toast.error(message)
    else toast(message)
  }, [])

  const loadData = useCallback(async () => {
    try {
      if (items.length === 0) setIsLoading(true)
      const { success, data, error } = await getRoadmapItems(projectId)
      if (success && data) {
        const typedData: RoadmapItem[] = data.map((d: any) => ({
          ...d,
          hasPrd: !!d.wbs_element_id,
          hasWbs: !!d.wbs_element_id,
          hasSolutionDesign: !!d.wbs_element_id,
          wbsProgressPercent: d.wbsProgressPercent || 0
        }))
        setItems(typedData)
      } else {
        showToast('Failed to load roadmap: ' + error, 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, showToast, items.length])

  useEffect(() => {
    loadData()
  }, [loadData])

  const dnd = useRoadmapDnD(items, setItems, showToast)
  const ai = useAiGeneration(projectId, organizationId, loadData, showToast)
  const themeHook = useRoadmapTheme(items, setItems, showToast)

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <DocumentLoader message="Loading Kanban items..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-app-bg pt-4">
      <div className="px-6 pb-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-app-fg">
            <Map className="w-5 h-5 text-brand-primary" />
            Now/Next/Later Roadmap
          </h2>
        </div>
        <button
          onClick={() => setEditingItem('new')}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-brand-fg px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Initiative
        </button>
      </div>

      <RoadmapBoard 
        items={items}
        dragOverHorizon={dnd.dragOverHorizon}
        onDragOver={dnd.handleDragOver}
        onDragLeave={dnd.handleDragLeave}
        onDrop={dnd.handleDrop}
        onDragStart={dnd.handleDragStart}
        isGeneratingItem={ai.generatingItemId}
        onGeneratePrd={ai.handleGeneratePrd}
        onThemeChange={themeHook.handleThemeChange}
        onEditItem={setEditingItem}
        onDeleteItem={async (item) => {
           setItems(prev => prev.filter(i => i.id !== item.id))
        }}
      />

      <RoadmapItemModal
        projectId={projectId}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem === 'new' ? null : editingItem}
        onSaved={() => {
          setEditingItem(null)
          loadData()
        }}
      />{/* Upgrade Prompt Modal */}
      <UpgradePromptModal {...ai.UpgradePromptModalProps} />
    </div>
  )
}
