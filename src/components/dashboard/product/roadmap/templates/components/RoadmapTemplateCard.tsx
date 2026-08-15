import React from 'react'
import {
  Zap,
  Building,
  Compass,
  BarChart3,
  TrendingUp,
  Smartphone,
  GitMerge,
  FileCheck,
  Check,
  Layers,
} from 'lucide-react'
import { RoadmapTemplateVariant } from '../constants/roadmapTemplates'

interface RoadmapTemplateCardProps {
  variant: RoadmapTemplateVariant
  currentTemplateId?: string
  onSelect: (id: string) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Building,
  Compass,
  BarChart3,
  TrendingUp,
  Smartphone,
  GitMerge,
  FileCheck,
}

export function RoadmapTemplateCard({
  variant,
  currentTemplateId,
  onSelect,
}: RoadmapTemplateCardProps) {
  const IconComp = ICON_MAP[variant.iconName] || Layers

  const isSelected =
    currentTemplateId === variant.id ||
    (variant.id === 'now_next_later' &&
      (!currentTemplateId || currentTemplateId === 'product_roadmap_document_template' || currentTemplateId === 'roadmap_workspace_template'))

  return (
    <div
      onClick={() => onSelect(variant.id)}
      style={{ cursor: 'pointer' }}
      className={`group relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
        isSelected
          ? 'bg-violet-500/10 border-violet-500 ring-2 ring-violet-500/30 shadow-lg'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-xl'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div
            className={`p-3 rounded-2xl transition-colors ${
              isSelected
                ? 'bg-violet-600 text-white'
                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white'
            }`}
          >
            <IconComp className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {variant.category.replace('_', ' ')}
            </span>

            {isSelected && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">
            {variant.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{variant.subtitle}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Included Sections ({variant.section_definitions.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {variant.section_definitions.slice(0, 4).map((sec) => (
              <span
                key={sec.key}
                className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-400"
              >
                {sec.title}
              </span>
            ))}
            {variant.section_definitions.length > 4 && (
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                +{variant.section_definitions.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="font-bold text-slate-500 dark:text-slate-400">
          Best For: <span className="font-normal text-slate-700 dark:text-slate-300">{variant.bestFor}</span>
        </span>
        <span className="font-extrabold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
          {isSelected ? 'Currently Active' : 'Apply Template →'}
        </span>
      </div>
    </div>
  )
}
