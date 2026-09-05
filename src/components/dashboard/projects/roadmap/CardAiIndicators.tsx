import React from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { RoadmapItem } from '@/lib/product-roadmap/types'

interface CardAiIndicatorsProps {
  item: RoadmapItem
  isGenerating: boolean
  onGenerate: (itemId: string) => void
}

export function CardAiIndicators({ item, isGenerating, onGenerate }: CardAiIndicatorsProps) {
  
  // A helper to render an indicator badge
  const Indicator = ({ label, active }: { label: string, active: boolean }) => (
    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
      active 
        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
        : 'border-app-border bg-app-bg text-app-muted'
    }`}>
      {label}
    </div>
  )

  const isNow = item.horizon === 'Now'
  const isFullyGenerated = item.hasPrd && item.hasWbs

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center gap-1.5">
        <Indicator label="SD" active={!!item.hasSolutionDesign} />
        <Indicator label="PRD" active={!!item.hasPrd} />
        <Indicator label="EPICS" active={!!item.hasWbs || !!item.wbs_element_id} />
      </div>

      {/* Backlog Generation Action (Hover Only unless generating) */}
      {(!item.horizon || item.horizon === 'Backlog') && !item.hasSolutionDesign && (
        <div className={`grid transition-all duration-300 ease-in-out ${isGenerating ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] group-hover:grid-rows-[1fr]'}`}>
          <div className="overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); onGenerate(item.id) }}
              disabled={isGenerating}
              className="mt-2 w-full flex items-center justify-center gap-2 text-[11px] font-bold py-1.5 px-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Designing Solution...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Solution Design
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
