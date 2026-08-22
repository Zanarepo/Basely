import React from 'react'
import { FileText, Target, Layers, Search, Route } from 'lucide-react'

interface DocumentCenterHeaderProps {
  activeSuite: 'product' | 'project'
  searchQuery: string
  selectedCategory: string
  onSuiteChange: (suite: 'product' | 'project') => void
  onSearchChange: (query: string) => void
  onCategoryChange: (category: string) => void
  showWorkflowsDrawer?: boolean
  onToggleWorkflowsDrawer?: () => void
}

export default function DocumentCenterHeader({
  activeSuite,
  searchQuery,
  selectedCategory,
  onSuiteChange,
  onSearchChange,
  onCategoryChange,
  showWorkflowsDrawer = false,
  onToggleWorkflowsDrawer,
}: DocumentCenterHeaderProps) {
  const categoryPills =
    activeSuite === 'project'
      ? [
          { id: 'all', label: 'All Documents' },
          { id: 'initiation', label: 'Initiation' },
          { id: 'planning', label: 'Planning' },
          { id: 'execution', label: 'Execution & Control' },
          { id: 'closure', label: 'Project Closure' },
        ]
      : [
          { id: 'all', label: 'All Documents' },
          { id: 'strategy', label: 'Vision & Strategy' },
          { id: 'requirements', label: 'Discovery & Requirements' },
          { id: 'prioritization', label: 'Prioritization & Roadmap' },
          { id: 'execution', label: 'Performance & Reports' },
        ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-app-fg tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-violet-500" />
            <span>Document Center</span>
          </h1>
          <p className="text-xs text-app-muted">
            Enterprise document suite for product strategy, PRDs, roadmaps, and project governance.
          </p>
        </div>

        {/* Suite Switcher Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-2xl bg-app-muted-surface border border-app-border">
            <button
              type="button"
              onClick={() => onSuiteChange('product')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSuite === 'product'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-app-muted hover:text-app-fg'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Product Suite</span>
            </button>

            <button
              type="button"
              onClick={() => onSuiteChange('project')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSuite === 'project'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-app-muted hover:text-app-fg'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Project Suite</span>
            </button>
          </div>

          {/* PM Workflows Button */}
          {onToggleWorkflowsDrawer && (
            <button
              type="button"
              onClick={onToggleWorkflowsDrawer}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showWorkflowsDrawer
                  ? 'bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'bg-app-surface border-app-border text-app-muted hover:text-app-fg'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span className="hidden sm:inline-block">Workflows</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-app-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search PRDs, strategy, charters..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-app-bg border border-app-border focus:border-violet-500 focus:outline-none text-app-fg"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categoryPills.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                  : 'bg-app-bg text-app-muted border border-app-border hover:bg-app-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
