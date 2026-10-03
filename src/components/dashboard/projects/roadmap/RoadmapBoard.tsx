import React from 'react'
import { Horizon, HORIZONS, getThemeStyles } from '@/lib/product-roadmap/constants'
import { RoadmapItem } from '@/lib/product-roadmap/types'
import { RoadmapColumn } from './RoadmapColumn'

interface RoadmapBoardProps {
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

export function RoadmapBoard(props: RoadmapBoardProps) {
  
  // Extract all unique themes
  const themes = Array.from(new Set(props.items.map(i => i.theme || 'Uncategorized')))
  
  // To keep consistent ordering, sort themes alphabetically, but keep 'Uncategorized' at the bottom
  themes.sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  // Group items by theme
  const itemsByTheme: Record<string, RoadmapItem[]> = {}
  themes.forEach(theme => {
    itemsByTheme[theme] = props.items.filter(i => (i.theme || 'Uncategorized') === theme)
  })

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-y-auto pb-4 custom-scrollbar px-6">
      {themes.map(theme => {
        const themeItems = itemsByTheme[theme]
        const styles = getThemeStyles(theme)
        
        return (
          <div key={theme} className="flex flex-col gap-4">
            {/* Swimlane Header */}
            <div className="flex items-center gap-3 border-b border-app-border pb-2">
              <div className={`w-3 h-3 rounded-full ${styles.bg} border ${styles.border}`} />
              <h3 className={`text-lg font-bold ${styles.text}`}>
                {theme}
              </h3>
              <span className="text-xs font-medium text-app-muted bg-app-fg/5 px-2 py-0.5 rounded-full">
                {themeItems.length} initiatives
              </span>
            </div>
            
            {/* Swimlane Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {HORIZONS.map(horizon => {
                // Filter items for this horizon, treating null/undefined as 'Backlog'
                const horizonItems = themeItems.filter(i => (i.horizon || 'Backlog') === horizon)
                
                return (
                  <RoadmapColumn
                    key={`${theme}-${horizon}`}
                    horizon={horizon}
                    items={horizonItems}
                    dragOverHorizon={props.dragOverHorizon}
                    onDragOver={props.onDragOver}
                    onDragLeave={props.onDragLeave}
                    onDrop={props.onDrop}
                    onDragStart={props.onDragStart}
                    isGeneratingItem={props.isGeneratingItem}
                    onGeneratePrd={props.onGeneratePrd}
                    onThemeChange={props.onThemeChange}
                    onEditItem={props.onEditItem}
                    onDeleteItem={props.onDeleteItem}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
