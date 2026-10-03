'use client'

import React from 'react'
import { X, Sparkles, Search } from 'lucide-react'
import { useStrategyTemplateSelector } from '../hooks/useStrategyTemplateSelector'
import { StrategyTemplateCard } from './StrategyTemplateCard'

interface StrategyTemplateSelectorModalProps {
  isOpen: boolean
  currentTemplateId?: string
  onClose: () => void
  onSelectTemplate: (variantId: string) => void
}

export function StrategyTemplateSelectorModal({
  isOpen,
  currentTemplateId,
  onClose,
  onSelectTemplate,
}: StrategyTemplateSelectorModalProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredVariants,
  } = useStrategyTemplateSelector()

  if (!isOpen) return null

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
              { id: 'master_spec', label: '★ Master Spec (28 Sections)' },
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
          {filteredVariants.map((variant) => (
            <StrategyTemplateCard
              key={variant.id}
              variant={variant}
              currentTemplateId={currentTemplateId}
              onSelect={(id) => {
                onSelectTemplate(id)
                onClose()
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
