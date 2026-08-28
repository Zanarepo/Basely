'use client'

import { LayoutDashboard, Zap, ListChecks } from 'lucide-react'
import BurndownChart from './charts/BurndownChart'
import VelocityChart from './charts/VelocityChart'
import CumulativeFlowDiagram from './charts/CumulativeFlowDiagram'

export default function AgileExecutionWorkspace({
  projectId
}: {
  projectId: string
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-app-border bg-white dark:bg-app-surface rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl">
            <LayoutDashboard className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-app-fg tracking-tight">Active Sprint Board & Metrics</h2>
            <p className="text-sm text-app-muted mt-1">
              Track the team's sprint execution, burndown, and historical velocity.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-app-hover border border-app-border rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
            <ListChecks className="h-4 w-4" />
            Sprint Backlog
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
            <Zap className="h-4 w-4" />
            Complete Sprint
          </button>
        </div>
      </div>

      {/* Primary Chart: Burndown */}
      <div className="w-full">
        <BurndownChart />
      </div>

      {/* Secondary Charts: Velocity & CFD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VelocityChart />
        <CumulativeFlowDiagram />
      </div>
    </div>
  )
}
