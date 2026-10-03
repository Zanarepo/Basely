'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, Zap, ListChecks, CalendarX } from 'lucide-react'
import BurndownChart from './charts/BurndownChart'
import VelocityChart from './charts/VelocityChart'
import CumulativeFlowDiagram from './charts/CumulativeFlowDiagram'
import { fetchProjectReleasesData } from '@/lib/releases/release-actions'
import { captureSprintSnapshot } from '@/lib/releases/snapshot-actions'
import { SprintBacklogModal } from './SprintBacklogModal'

export default function AgileExecutionWorkspace({
  projectId
}: {
  projectId: string
}) {
  const [hasActiveSprint, setHasActiveSprint] = useState<boolean | null>(null)
  const [activeSprint, setActiveSprint] = useState<any>(null)
  const [allIterations, setAllIterations] = useState<any[]>([])
  const [sprintItems, setSprintItems] = useState<any[]>([])
  const [isBacklogOpen, setIsBacklogOpen] = useState(false)

  useEffect(() => {
    async function checkActiveSprint() {
      // 1. Capture snapshot if needed (fire and forget)
      captureSprintSnapshot(projectId).catch(console.error)
      
      // 2. Load dashboard data
      const res = await fetchProjectReleasesData(projectId)
      if (res.ok && res.iterations) {
        setAllIterations(res.iterations)
        let targetSprint = res.iterations.find((i: any) => i.status === 'active')
        let isActive = !!targetSprint
        
        if (!targetSprint) {
          // Fallback to most recently completed sprint
          const completedSprints = res.iterations.filter((i: any) => i.status === 'completed')
          if (completedSprints.length > 0) {
            targetSprint = completedSprints.sort((a: any, b: any) => b.sequenceNumber - a.sequenceNumber)[0]
          }
        }

        setHasActiveSprint(isActive)
        setActiveSprint(targetSprint || null)
        
        if (targetSprint && res.availableWorkItems) {
          const itemsForSprint = res.availableWorkItems.filter((i: any) => i.iterationId === targetSprint.id)
          setSprintItems(itemsForSprint)
        }
      } else {
        setHasActiveSprint(false)
        setActiveSprint(null)
      }
    }
    checkActiveSprint()
  }, [projectId])

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
          <button 
            onClick={() => setIsBacklogOpen(true)}
            disabled={!hasActiveSprint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-app-hover border border-app-border rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ListChecks className="h-4 w-4" />
            Sprint Backlog
          </button>
          <button 
            disabled={!hasActiveSprint}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            Complete Sprint
          </button>
        </div>
      </div>

      <SprintBacklogModal 
        isOpen={isBacklogOpen} 
        onClose={() => setIsBacklogOpen(false)} 
        sprintName={activeSprint?.name}
        items={sprintItems}
      />

      {hasActiveSprint === false && !activeSprint ? (
        <div className="w-full flex flex-col items-center justify-center p-12 bg-app-surface border border-app-border rounded-3xl min-h-[400px]">
          <div className="p-4 bg-app-border/40 rounded-full mb-4">
            <CalendarX className="w-8 h-8 text-app-muted" />
          </div>
          <h3 className="text-lg font-bold text-app-fg mb-1">No Sprints Found</h3>
          <p className="text-app-muted text-center max-w-md">
            You do not have any active or completed sprints. Start a sprint from the Release Plan to see live execution metrics, burndown charts, and velocity tracking here.
          </p>
        </div>
      ) : (
        <>
          {hasActiveSprint === false && activeSprint && (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
              <strong className="font-semibold">Viewing Completed Sprint:</strong> There is no active sprint right now, so you are viewing the data for your most recently completed sprint ({activeSprint.name}).
            </div>
          )}

          {/* Primary Chart: Burndown */}
          <div className="w-full">
            {activeSprint && <BurndownChart activeSprint={activeSprint} />}
          </div>

          {/* Secondary Charts: Velocity & CFD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VelocityChart iterations={allIterations} />
            {activeSprint && <CumulativeFlowDiagram activeSprint={activeSprint} />}
          </div>
        </>
      )}
    </div>
  )
}

