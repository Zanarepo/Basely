'use client'

import React, { useState } from 'react'
import {
  X,
  Zap,
  Building,
  Compass,
  BarChart3,
  TrendingUp,
  Smartphone,
  GitMerge,
  FileCheck,
  Check,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react'
import { STRATEGY_TEMPLATE_VARIANTS, StrategyTemplateVariant } from '@/lib/documents/strategy-templates'

interface StrategyTemplateSelectorModalProps {
  isOpen: boolean
  currentTemplateId?: string
  onClose: () => void
  onSelectTemplate: (variantId: string) => void
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

export function StrategyTemplateSelectorModal({
  isOpen,
  currentTemplateId,
  onClose,
  onSelectTemplate,
}: StrategyTemplateSelectorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  if (!isOpen) return null

  const variants = Object.values(STRATEGY_TEMPLATE_VARIANTS)

  const filteredVariants = variants.filter((v) => {
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bestFor.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Choose Product Strategy Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Select an altitude and framework to structure your product vision, bets, and trade-offs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Frameworks' },
              { id: 'startup', label: 'Startup' },
              { id: 'leadership', label: 'Exec & Board' },
              { id: 'growth', label: 'Growth & OKRs' },
              { id: 'go_to_market', label: 'GTM Launch' },
              { id: 'portfolio', label: 'Portfolio' },
              { id: 'product_area', label: 'Product Area' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{ cursor: 'pointer' }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategy templates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVariants.map((variant) => {
            const IconComp = ICON_MAP[variant.iconName] || Layers
            const isSelected = currentTemplateId === variant.id

            return (
              <div
                key={variant.id}
                onClick={() => onSelectTemplate(variant.id)}
                style={{ cursor: 'pointer' }}
                className={`relative group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-500 shadow-md ring-2 ring-violet-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {variant.category.replace('_', ' ')}
                      </span>

                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-1">
                    {variant.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                    {variant.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                    <span>Best For:</span>
                    <span className="font-normal text-slate-700 dark:text-slate-300 truncate">
                      {variant.bestFor}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{variant.section_definitions.length} Structured Sections</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                      Apply Template &rarr;
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
