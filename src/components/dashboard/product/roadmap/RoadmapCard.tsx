'use client'

import { useState } from 'react'
import { CalendarDays, AlertTriangle } from 'lucide-react'
import { updateRoadmapHorizon } from '@/lib/product-roadmap/actions'

export function RoadmapCard({ item, onUpdate, showToast, draggedItemId, onDragStart }: any) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Project Bridge Logic: Check if the WBS element schedule violates the Horizon expectation
  let varianceWarning = null
  if (item.wbs_element?.iteration?.end_date) {
    const endDate = new Date(item.wbs_element.iteration.end_date)
    const now = new Date()
    const diffMonths = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (item.horizon === 'Now' && diffMonths > 3) {
      varianceWarning = 'Scheduled iteration is far in the future.'
    } else if (item.horizon === 'Next' && diffMonths > 6) {
      varianceWarning = 'Scheduled iteration is beyond the Next horizon.'
    }
  }

  const isDragged = draggedItemId === item.id

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className={`group relative bg-app-surface border rounded-xl p-3.5 shadow-xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing
        ${isDragged ? 'opacity-40 border-dashed scale-95 bg-indigo-500/5' : 'hover:border-slate-300 dark:hover:border-slate-600 border-app-border'}
      `}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {item.theme && (
          <span className="inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold rounded shrink-0">
            {item.theme}
          </span>
        )}
        <span className="text-[10px] text-slate-400 font-medium ml-auto">
          {item.moscow_status 
            ? `MoSCoW: ${item.moscow_status}` 
            : (item.rice_score ? `RICE: ${item.rice_score}` : '')}
        </span>
      </div>
      
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-2">{item.title}</h4>
      
      {item.okr && (
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Goal:</span> {item.okr.title}
        </div>
      )}

      {item.wbs_element && (
        <div className="mt-2.5 flex items-center justify-between border-t border-app-border pt-2.5">
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
            <CalendarDays className="w-3 h-3" />
            <span>
              {item.wbs_element.iteration 
                ? item.wbs_element.iteration.name 
                : 'Unscheduled'}
            </span>
          </div>
          
          {varianceWarning && (
            <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded" title={varianceWarning}>
              <AlertTriangle className="w-3 h-3" />
              Variance
            </div>
          )}
        </div>
      )}
    </div>
  )
}
