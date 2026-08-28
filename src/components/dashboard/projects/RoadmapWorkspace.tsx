'use client'

import React from 'react'

interface RoadmapWorkspaceProps {
  projectId: string
}

export default function RoadmapWorkspace({ projectId }: RoadmapWorkspaceProps) {
  return (
    <div className="flex-1 p-6 flex flex-col space-y-6 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-emerald-500/10 border border-violet-500/20 rounded-3xl p-6">
        <h2 className="text-xl font-black text-app-fg">Now / Next / Later Roadmap</h2>
        <p className="text-sm text-app-muted mt-2">
          Visually plan your releases and track high-level epics across time horizons.
        </p>
      </div>
      <div className="flex-1 rounded-3xl border border-app-border border-dashed flex items-center justify-center text-app-muted">
        Roadmap Kanban Board Component
      </div>
    </div>
  )
}
