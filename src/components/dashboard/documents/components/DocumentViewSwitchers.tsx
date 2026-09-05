import React from 'react'
import { Compass, Globe, FileText, Kanban, Table } from 'lucide-react'

interface RoadmapViewSwitcherProps {
  roadmapViewMode: 'document' | 'kanban'
  setRoadmapViewMode: (mode: 'document' | 'kanban') => void
}

export function RoadmapViewSwitcher({ roadmapViewMode, setRoadmapViewMode }: RoadmapViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-violet-500/5 dark:bg-violet-500/10 border-b border-app-border">
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
          Roadmap Visualization Mode:
        </span>
      </div>
      <div className="flex items-center p-0.5 bg-app-surface border border-app-border rounded-xl shadow-xs">
        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={() => setRoadmapViewMode('document')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            roadmapViewMode === 'document'
              ? 'bg-violet-500 text-white shadow-xs font-bold'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Spec View</span>
        </button>

        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={() => setRoadmapViewMode('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            roadmapViewMode === 'kanban'
              ? 'bg-violet-500 text-white shadow-xs font-bold'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </button>
      </div>
    </div>
  )
}

interface CompetitiveViewSwitcherProps {
  competitiveViewMode: 'document' | 'matrix'
  setCompetitiveViewMode: (mode: 'document' | 'matrix') => void
}

export function CompetitiveViewSwitcher({ competitiveViewMode, setCompetitiveViewMode }: CompetitiveViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-violet-500/5 dark:bg-violet-500/10 border-b border-app-border">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
          Market Intelligence Visualization Mode:
        </span>
      </div>
      <div className="flex items-center p-0.5 bg-app-surface border border-app-border rounded-xl shadow-xs">
        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={() => setCompetitiveViewMode('document')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            competitiveViewMode === 'document'
              ? 'bg-violet-500 text-white shadow-xs font-bold'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Spec</span>
        </button>

        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={() => setCompetitiveViewMode('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            competitiveViewMode === 'matrix'
              ? 'bg-violet-500 text-white shadow-xs font-bold'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Feature Matrix & Moats</span>
        </button>
      </div>
    </div>
  )
}
