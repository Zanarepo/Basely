'use client'

import { Loader2, AlertCircle, RefreshCw, AlertOctagon, CheckCircle2 } from 'lucide-react'
import { useProjectDashboardData } from './hooks/useProjectDashboardData'
import ScheduleHealthWidget from './widgets/ScheduleHealthWidget'
import CostHealthWidget from './widgets/CostHealthWidget'
import MilestonesWidget from './widgets/MilestonesWidget'
import RisksWidget from './widgets/RisksWidget'
import ProjectActivityPanel from './widgets/ProjectActivityPanel'
import { useState } from 'react'
import { Activity } from 'lucide-react'

export default function ProjectDashboardWorkspace({
  projectId
}: {
  projectId: string
}) {
  const {
    loading,
    error,
    project,
    scheduleHealth,
    costHealth,
    ragStatus,
    upcomingMilestones,
    topRisks,
    refresh
  } = useProjectDashboardData(projectId)

  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-app-subtle">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Loading project dashboard metrics...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/50 rounded-3xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <span className="text-sm font-semibold text-red-800 dark:text-red-400 mt-4">Failed to load dashboard</span>
        <span className="text-xs text-red-600 dark:text-red-500 mt-2 max-w-md">{error || 'Project not found.'}</span>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/25 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  const getRagDetails = () => {
    switch (ragStatus) {
      case 'Red':
        return {
          bg: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/25',
          text: 'text-rose-700 dark:text-rose-400',
          title: 'Critical Attention Required',
          description: 'Significant cost overruns, schedule delays, or critical path slippage detected.',
          icon: <AlertOctagon className="h-6 w-6 text-rose-500 shrink-0" />
        }
      case 'Amber':
        return {
          bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25',
          text: 'text-amber-700 dark:text-amber-400',
          title: 'Caution / At Risk',
          description: 'Minor variance in schedule milestones or cost performance index observed.',
          icon: <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
        }
      case 'Green':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25',
          text: 'text-emerald-700 dark:text-emerald-400',
          title: 'Project on Track',
          description: 'Schedule milestones and budget thresholds are matching target baselines.',
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
        }
    }
  }

  const rag = getRagDetails()

  return (
    <div className="space-y-6">
      {/* RAG Banner / Title */}
      <div className={`border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all ${rag.bg}`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-2 bg-white dark:bg-app-surface rounded-2xl shadow-sm border border-app-border/40">
            {rag.icon}
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight ${rag.text}`}>
              RAG Status: {rag.title} ({ragStatus})
            </h2>
            <p className="text-xs text-app-muted mt-0.5">{rag.description}</p>
          </div>
        </div>

        <div className="self-start sm:self-center flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsActivityPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Activity className="h-4 w-4" />
            Activity Log
          </button>
          
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-app-surface text-app-fg border border-app-border rounded-xl hover:bg-gray-50 dark:hover:bg-app-hover text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Live Data
          </button>
        </div>
      </div>

      {/* Widgets Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget 1: Schedule Health */}
        {scheduleHealth && (
          <div className="lg:col-span-1">
            <ScheduleHealthWidget health={scheduleHealth} />
          </div>
        )}

        {/* Widget 2: Cost Health */}
        {costHealth && (
          <div className="lg:col-span-1">
            <CostHealthWidget health={costHealth} currency={project.currency} />
          </div>
        )}

        {/* Widget 3: Milestones List */}
        <div className="lg:col-span-1 md:col-span-2 lg:col-span-1">
          <MilestonesWidget milestones={upcomingMilestones} />
        </div>

        {/* Widget 4: Risks list */}
        <div className="lg:col-span-1 md:col-span-2 lg:col-span-1">
          <RisksWidget risks={topRisks} />
        </div>
      </div>

      {/* Slide-out Activity Panel */}
      <ProjectActivityPanel 
        projectId={projectId}
        isOpen={isActivityPanelOpen}
        onClose={() => setIsActivityPanelOpen(false)}
      />
    </div>
  )
}
