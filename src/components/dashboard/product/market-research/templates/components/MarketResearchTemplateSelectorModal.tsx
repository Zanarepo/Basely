import React from 'react'
import { Search, X, LayoutTemplate, Sparkles } from 'lucide-react'
import {
  useMarketResearchTemplateSelector,
  MarketResearchCategoryFilter,
} from '../hooks/useMarketResearchTemplateSelector'
import { MarketResearchTemplateCard } from './MarketResearchTemplateCard'

interface MarketResearchTemplateSelectorModalProps {
  isOpen: boolean
  currentTemplateId?: string
  onClose: () => void
  onSelectTemplate: (templateId: string) => void
}

const CATEGORIES: { id: MarketResearchCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Frameworks' },
  { id: 'master_spec', label: '★ Master Spec (28 Sections)' },
  { id: 'competitive', label: 'Competitive Matrix' },
  { id: 'market_sizing', label: 'TAM / SAM / SOM' },
  { id: 'customer_icp', label: 'ICP & Personas' },
  { id: 'discovery', label: 'Customer Discovery' },
  { id: 'win_loss', label: 'Win / Loss' },
  { id: 'opportunity', label: 'Problem Validation' },
  { id: 'positioning', label: 'Positioning & Maps' },
  { id: 'trends', label: 'Trends Scan' },
  { id: 'pricing', label: 'Pricing & Value' },
  { id: 'voc', label: 'Voice of Customer' },
]

export function MarketResearchTemplateSelectorModal({
  isOpen,
  currentTemplateId,
  onClose,
  onSelectTemplate,
}: MarketResearchTemplateSelectorModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    totalCount,
  } = useMarketResearchTemplateSelector()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-app-border flex items-center justify-between bg-gradient-to-r from-violet-500/5 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-app-fg tracking-tight">
                  Choose Market Research Template
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  {totalCount} Frameworks Available
                </span>
              </div>
              <p className="text-xs text-app-muted mt-0.5">
                Select a research framework tailored to your discovery goals — TAM/SAM/SOM, Competitive Matrix, ICP Personas, Pricing, or Master Research Spec.
              </p>
            </div>
          </div>

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 border-b border-app-border bg-app-surface-solid/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-violet-500 text-white shadow-xs'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-app-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search research templates..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-app-surface border border-app-border text-xs text-app-fg placeholder:text-app-muted focus:outline-hidden focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-fg text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Templates Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-app-bg/50">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-app-border rounded-2xl">
              <Sparkles className="w-8 h-8 text-app-muted mb-2 animate-bounce" />
              <h3 className="text-sm font-bold text-app-fg">No Market Research Templates Found</h3>
              <p className="text-xs text-app-muted mt-1 max-w-sm">
                No templates matched &quot;{searchQuery}&quot;. Try clearing your search query or switching categories.
              </p>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-xl text-xs font-bold hover:bg-violet-600 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((variant) => (
                <MarketResearchTemplateCard
                  key={variant.id}
                  variant={variant}
                  isActive={currentTemplateId === variant.id}
                  onSelect={onSelectTemplate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-app-border bg-app-surface flex items-center justify-between text-xs text-app-muted">
          <span>
            Clicking a research template instantly switches the document structure and preserves your notes.
          </span>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-app-border text-app-fg hover:bg-app-hover font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
