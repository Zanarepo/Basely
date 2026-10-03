import React, { useState, useEffect, useRef } from 'react'
import { RoadmapItem } from '@/lib/product-roadmap/types'
import { getThemeStyles, ROADMAP_THEMES } from '@/lib/product-roadmap/constants'
import { CardAnalytics } from './CardAnalytics'
import { CardAiIndicators } from './CardAiIndicators'
import { ChevronDown, Check, Pencil, Trash2 } from 'lucide-react'

interface RoadmapCardProps {
  item: RoadmapItem
  onDragStart: (e: React.DragEvent, id: string) => void
  isGenerating: boolean
  onGeneratePrd: (id: string) => void
  onThemeChange?: (id: string, theme: string) => void
  onEditItem?: (item: RoadmapItem) => void
  onDeleteItem?: (item: RoadmapItem) => void
}

export function RoadmapCard({ item, onDragStart, isGenerating, onGeneratePrd, onThemeChange, onEditItem, onDeleteItem }: RoadmapCardProps) {
  const styles = getThemeStyles(item.theme)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
  // List of themes to show in the dropdown (excluding 'Default')
  const availableThemes = Object.keys(ROADMAP_THEMES).filter(t => t !== 'Default')
  const dropdownOptions = ['Uncategorized', ...availableThemes]

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className={`relative rounded-xl border p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all 
        bg-app-bg dark:bg-app-fg/5 hover:-translate-y-1 group
        ${styles.border} overflow-hidden`}
    >
      {/* Subtle background gradient based on theme */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-50 pointer-events-none`} />

      {/* Edit/Delete Buttons (Hover Only) */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEditItem?.(item)
          }}
          className="p-1.5 rounded-md bg-app-surface-solid border border-app-border text-app-muted hover:text-indigo-400 hover:border-indigo-500/30 shadow-sm cursor-pointer transition-colors"
          aria-label="Edit Initiative"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {onDeleteItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteItem(item)
            }}
            className="p-1.5 rounded-md bg-app-surface-solid border border-app-border text-app-muted hover:text-rose-400 hover:border-rose-500/30 shadow-sm cursor-pointer transition-colors"
            aria-label="Delete Initiative"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-2 relative">
          
          {/* Custom Enterprise Theme Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen) }}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer outline-none ${styles.bg} ${styles.text} ${styles.border}`}
            >
              <span className="truncate max-w-[120px]">{item.theme || 'Uncategorized'}</span>
              <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-1.5 space-y-0.5 animate-in fade-in duration-150">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Assign Theme
                </div>
                {dropdownOptions.map(t => {
                  const isSelected = (item.theme || 'Uncategorized') === t
                  return (
                    <button
                      key={t}
                      onClick={(e) => {
                        e.stopPropagation()
                        onThemeChange?.(item.id, t)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* MoSCoW Tag */}
          {item.moscow_status && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-fg/10 text-app-muted">
              {item.moscow_status}
            </span>
          )}
        </div>

        <h4 className="text-sm font-bold text-app-fg mb-1 leading-snug">
          {item.title}
        </h4>

        {item.description && (
          <p className="text-xs text-app-muted line-clamp-2 mt-1">
            {item.description}
          </p>
        )}

        <CardAnalytics item={item} />
        
        <CardAiIndicators 
          item={item} 
          isGenerating={isGenerating} 
          onGenerate={onGeneratePrd} 
        />
        
        {/* Delivery Progress Info */}
        {item.wbs_element_id && (
          <div className="flex items-center justify-between text-[10px] font-bold text-app-muted mt-4">
            <span>Execution Active</span>
            <span className={item.wbsProgressPercent === 100 ? 'text-emerald-500' : ''}>
              {item.wbsProgressPercent || 0}% Delivered
            </span>
          </div>
        )}
      </div>

      {/* Base Progress Bar */}
      {item.wbs_element_id && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-app-border/50">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${item.wbsProgressPercent || 0}%` }}
          />
        </div>
      )}
    </div>
  )
}
