'use client'

import { UserPlus } from 'lucide-react'

interface SkillsMatrixHeaderProps {
  methodology: string
  membersCount: number
  maxSpecialists: number
  onAddClick: () => void
  onLimitReached: () => void
}

export function SkillsMatrixHeader({
  methodology,
  membersCount,
  maxSpecialists,
  onAddClick,
  onLimitReached
}: SkillsMatrixHeaderProps) {
  return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Team Competency & Capacity Matrix
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {methodology} resource engine
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Retrieve database team specialists, assign technical competencies, and balance operational sprint velocity against billable man-hours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (membersCount >= maxSpecialists) {
              onLimitReached()
              return
            }
            onAddClick()
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Specialist / Team Member</span>
        </button>
      </div>
  )
}
