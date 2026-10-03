import React from 'react'
import { Search, X, Sparkles } from 'lucide-react'
import {
  useRoadmapTemplateSelector,
  RoadmapCategoryFilter,
} from '../hooks/useRoadmapTemplateSelector'
import { RoadmapTemplateCard } from './RoadmapTemplateCard'

interface RoadmapTemplateSelectorModalProps {
  isOpen: boolean
  currentTemplateId?: string
  onClose: () => void
  onSelectTemplate: (variantId: string) => void
}

const CATEGORIES: { id: RoadmapCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Frameworks' },
  { id: 'master_spec', label: '★ Master Roadmap (20 Sections)' },
  { id: 'exec_board', label: 'Exec & Board' },
  { id: 'theme', label: 'Theme-Based' },
  { id: 'timeline', label: 'Timeline & Release' },
  { id: 'outcome', label: 'Outcome-Based' },
  { id: 'lean_kanban', label: 'Lean / Kanban' },
  { id: 'gist', label: 'GIST Framework' },
  { id: 'okr_linked', label: 'OKR-Tied' },
  { id: 'portfolio', label: 'Multi-Product Portfolio' },
  { id: 'public', label: 'Public / Customer' },
]

export function RoadmapTemplateSelectorModal({
  isOpen,
  currentTemplateId,
  onClose,
  onSelectTemplate,
}: RoadmapTemplateSelectorModalProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredVariants,
  } = useRoadmapTemplateSelector()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Choose Product Roadmap Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Select an altitude and framework to communicate sequencing, outcomes, and releases to stakeholders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Scrollable Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ cursor: 'pointer' }}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roadmap templates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVariants.map((variant) => (
            <RoadmapTemplateCard
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
