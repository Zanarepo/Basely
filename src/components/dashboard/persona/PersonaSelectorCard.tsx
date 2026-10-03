'use client'

import React from 'react'
import type { UserPersona } from '@/lib/persona/types'

interface PersonaSelectorCardProps {
  currentPersona: UserPersona
  onSelectPersona: (persona: UserPersona) => void
}

export const PersonaSelectorCard: React.FC<PersonaSelectorCardProps> = ({
  currentPersona,
  onSelectPersona,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onSelectPersona('product_manager')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
          currentPersona === 'product_manager'
            ? 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400 shadow-xs'
            : 'bg-app-bg border-app-border text-app-fg hover:border-app-border/80'
        }`}
      >
        <div className="font-semibold text-sm flex items-center justify-between mb-1">
          <span>🎯 Product Manager</span>
          {currentPersona === 'product_manager' && <span className="text-xs font-bold">✓ Active</span>}
        </div>
        <p className="text-[11px] text-app-muted leading-tight">
          Roadmaps, Epics & User Stories (+ Add Epic). Hides budget clutter.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectPersona('project_manager')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
          currentPersona === 'project_manager'
            ? 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400 shadow-xs'
            : 'bg-app-bg border-app-border text-app-fg hover:border-app-border/80'
        }`}
      >
        <div className="font-semibold text-sm flex items-center justify-between mb-1">
          <span>📊 Project Manager</span>
          {currentPersona === 'project_manager' && <span className="text-xs font-bold">✓ Active</span>}
        </div>
        <p className="text-[11px] text-app-muted leading-tight">
          Phases & Control Accounts (+ Add Phase), Budgets & Financial Baselines.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectPersona('agile_member')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
          currentPersona === 'agile_member'
            ? 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400 shadow-xs'
            : 'bg-app-bg border-app-border text-app-fg hover:border-app-border/80'
        }`}
      >
        <div className="font-semibold text-sm flex items-center justify-between mb-1">
          <span>👥 Team Member / Field Specialist</span>
          {currentPersona === 'agile_member' && <span className="text-xs font-bold">✓ Active</span>}
        </div>
        <p className="text-[11px] text-app-muted leading-tight">
          Engineers, Surveyors, Foremen & QA. Adapts (+ Add Phase or + Add Epic) to your team lead.
        </p>
      </button>
    </div>
  )
}
