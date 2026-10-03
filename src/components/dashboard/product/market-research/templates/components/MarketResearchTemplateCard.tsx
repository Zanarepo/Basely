import React from 'react'
import {
  Sparkles,
  Table,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart2,
  Target,
  Compass,
  Globe,
  DollarSign,
  PieChart,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { MarketResearchTemplateVariant } from '../constants/marketResearchTemplates'

interface MarketResearchTemplateCardProps {
  variant: MarketResearchTemplateVariant
  isActive: boolean
  onSelect: (id: string) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Table,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart2,
  Target,
  Compass,
  Globe,
  DollarSign,
  PieChart,
}

const CATEGORY_LABELS: Record<string, string> = {
  master_spec: '★ Master Spec (28 Sections)',
  competitive: 'Competitive Matrix',
  market_sizing: 'TAM / SAM / SOM',
  customer_icp: 'ICP & Personas',
  discovery: 'Customer Interviews',
  win_loss: 'Win / Loss Analysis',
  opportunity: 'Problem Validation',
  positioning: 'Positioning & Maps',
  trends: 'Trends & Scanning',
  pricing: 'Pricing & Value',
  voc: 'Voice of Customer',
}

export function MarketResearchTemplateCard({
  variant,
  isActive,
  onSelect,
}: MarketResearchTemplateCardProps) {
  const IconComponent = ICON_MAP[variant.iconName] || FileText

  return (
    <button
      type="button"
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(variant.id)}
      className={`group relative flex flex-col justify-between text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isActive
          ? 'bg-gradient-to-br from-violet-500/10 via-app-surface to-violet-500/5 border-violet-500 ring-2 ring-violet-500/20 shadow-lg'
          : 'bg-white dark:bg-app-surface border-app-border hover:border-violet-500/50 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Active Selection Badge */}
      {isActive && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Active</span>
        </div>
      )}

      <div>
        {/* Category Pill & Icon */}
        <div className="flex items-center justify-between mb-3.5 pr-14">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl border ${
                isActive
                  ? 'bg-violet-500 text-white border-violet-400'
                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:bg-violet-500 group-hover:text-white transition-colors'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              {CATEGORY_LABELS[variant.category] || variant.category}
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-base font-bold text-app-fg group-hover:text-violet-500 transition-colors mb-1.5 line-clamp-1">
          {variant.name}
        </h3>
        <p className="text-xs text-app-muted line-clamp-2 leading-relaxed mb-4">
          {variant.subtitle}
        </p>

        {/* Section Definition Badges */}
        <div className="mb-4">
          <span className="text-[10px] font-extrabold text-app-subtle uppercase tracking-wider block mb-1.5">
            Key Sections ({variant.section_definitions.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {variant.section_definitions.slice(0, 4).map((sec) => (
              <span
                key={sec.key}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-app-muted-surface/70 text-app-fg border border-app-border line-clamp-1 max-w-[140px]"
              >
                {sec.title}
              </span>
            ))}
            {variant.section_definitions.length > 4 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                +{variant.section_definitions.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Best-For Summary */}
      <div className="pt-3 border-t border-app-border/60 flex items-center justify-between mt-auto">
        <span className="text-[10px] text-app-muted font-medium line-clamp-1">
          <strong className="text-app-fg font-semibold">Best for:</strong> {variant.bestFor}
        </span>
        <ArrowRight className="w-4 h-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-1 group-hover:translate-x-0 shrink-0 ml-2" />
      </div>
    </button>
  )
}
