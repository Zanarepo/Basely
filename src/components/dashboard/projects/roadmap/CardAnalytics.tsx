import React from 'react'
import { Target, Activity } from 'lucide-react'
import { RoadmapItem } from '@/lib/product-roadmap/types'

interface CardAnalyticsProps {
  item: RoadmapItem
}

export function CardAnalytics({ item }: CardAnalyticsProps) {
  return (
    <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-app-border/50">
      
      {/* OKR Display */}
      {item.okr && (
        <div className="flex items-start gap-1.5 text-xs text-app-muted">
          <Target className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
          <span className="line-clamp-2 leading-tight">
            {item.okr.title}
          </span>
        </div>
      )}

      {/* RICE Score Display */}
      {item.rice_score !== null && item.rice_score !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-app-fg">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>RICE: {Math.round(item.rice_score)}</span>
        </div>
      )}
      
    </div>
  )
}
