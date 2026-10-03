import React from 'react'
import { Horizon } from '@/lib/product-roadmap/constants'
import { RoadmapItem } from '@/lib/product-roadmap/types'
import { RoadmapCard } from './RoadmapCard'

interface RoadmapColumnProps {
  horizon: Horizon
  items: RoadmapItem[]
  dragOverHorizon: Horizon | null
  onDragOver: (e: React.DragEvent, horizon: Horizon | null) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, horizon: Horizon) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  isGeneratingItem: string | null
  onGeneratePrd: (id: string) => void
  onThemeChange?: (id: string, theme: string) => void
  onEditItem?: (item: RoadmapItem) => void
  onDeleteItem?: (item: RoadmapItem) => void
}

export function RoadmapColumn({
  horizon,
  items,
  dragOverHorizon,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  isGeneratingItem,
  onGeneratePrd,
  onThemeChange,
  onEditItem,
  onDeleteItem
}: RoadmapColumnProps) {
  
  const isNow = horizon === 'Now'
  
  return (
    <div 
      className={`flex flex-col gap-3 rounded-2xl p-3 border transition-colors ${
        dragOverHorizon === horizon 
          ? 'bg-app-fg/5 border-app-border' 
          : 'bg-app-surface-solid border-transparent'
      }`}
      onDragOver={(e) => onDragOver(e, horizon)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, horizon)}
    >
      <div className="flex items-center justify-between px-2 mb-2">
        <h4 className="font-bold text-app-fg flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            horizon === 'Now' ? 'bg-emerald-500' :
            horizon === 'Next' ? 'bg-indigo-500' :
            horizon === 'Later' ? 'bg-purple-500' :
            'bg-slate-400'
          }`} />
          {horizon}
        </h4>
        <span className="text-xs font-bold text-app-muted bg-app-bg px-2 py-0.5 rounded-full border">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[150px]">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-app-border rounded-xl text-xs text-app-muted/50 p-4 text-center">
            Drop items here
          </div>
        ) : (
          items.map(item => (
            <RoadmapCard 
              key={item.id} 
              item={item} 
              onDragStart={onDragStart} 
              isGenerating={isGeneratingItem === item.id}
              onGeneratePrd={onGeneratePrd}
              onThemeChange={onThemeChange}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))
        )}
      </div>
    </div>
  )
}
