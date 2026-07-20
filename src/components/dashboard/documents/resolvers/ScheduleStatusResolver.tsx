'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface ScheduleStatusResolverProps {
  projectId: string
  periodEnd: Date
  frozenData?: any
}

export default function ScheduleStatusResolver({ projectId, periodEnd, frozenData }: ScheduleStatusResolverProps) {
  const [data, setData] = useState<any>(frozenData)
  const [loading, setLoading] = useState(!frozenData)

  useEffect(() => {
    if (frozenData) {
      setData(frozenData)
      setLoading(false)
      return
    }

    async function loadData() {
      const supabase = createClient()
      
      // Fetch activities to determine schedule health as of periodEnd
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId)

      if (error || !activities) {
        setLoading(false)
        return
      }

      // Fetch the latest baseline
      const { data: baselines } = await supabase
        .from('baselines')
        .select('id')
        .eq('project_id', projectId)
        .order('saved_at', { ascending: false })
        .limit(1)
        
      let baselineSnapshots: any[] = []
      if (baselines && baselines.length > 0) {
        const { data: snaps } = await supabase
          .from('baseline_activity_snapshots')
          .select('activity_id, baseline_finish')
          .eq('baseline_id', baselines[0].id)
        if (snaps) baselineSnapshots = snaps
      }

      // Merge baseline dates into activities
      const actsWithBaseline = activities.map(act => {
        const snap = baselineSnapshots.find(s => s.activity_id === act.id)
        return {
          ...act,
          baseline_finish: snap ? snap.baseline_finish : null
        }
      })

      const periodEndDate = periodEnd.toISOString().split('T')[0]

      // Determine how many tasks were supposed to be done vs actually done
      let totalPlanned = 0
      let totalCompleted = 0
      let totalCritical = 0
      let criticalAtRisk = 0

      const milestones = []

      for (const act of actsWithBaseline) {
        const isMilestone = act.duration === 0

        // If baseline end date is before or on periodEnd, it was planned to be finished
        const plannedToFinish = act.baseline_finish && act.baseline_finish <= periodEndDate
        // Rely on percent_complete === 100 since actual_finish is not directly tracked
        const actuallyFinished = act.percent_complete === 100

        if (plannedToFinish) totalPlanned++
        if (actuallyFinished) totalCompleted++

        if (act.is_critical) {
          totalCritical++
          // If it's critical, planned to finish, but not actually finished, it's at risk
          if (plannedToFinish && !actuallyFinished) {
            criticalAtRisk++
          }
        }

        if (isMilestone) {
          milestones.push({
            id: act.id,
            name: act.name,
            plannedDate: act.baseline_finish || act.ef, // Use early finish if no baseline
            isCompleted: actuallyFinished,
            isAtRisk: plannedToFinish && !actuallyFinished
          })
        }
      }

      // Sort milestones by date
      milestones.sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())

      // Upcoming milestones: not completed, and within next 30 days of periodEnd
      const upcomingMilestones = milestones
        .filter(m => !m.isCompleted)
        .slice(0, 5)

      const overallComplete = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
      const criticalPathHealth = criticalAtRisk > 0 ? 'At Risk' : 'On Track'

      setData({
        overallComplete,
        criticalPathHealth,
        criticalAtRisk,
        totalCritical,
        upcomingMilestones
      })
      setLoading(false)
    }
    
    loadData()
  }, [projectId, periodEnd, frozenData])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!data) return null

  const isAtRisk = data.criticalPathHealth === 'At Risk'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Completion */}
        <div className="bg-app-surface border border-app-border rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="text-sm text-app-muted font-medium mb-1">Schedule Completion (vs Baseline)</div>
            <div className="text-2xl font-bold text-app-fg">
              {data.overallComplete}% <span className="text-sm font-normal text-app-muted ml-1">of planned tasks</span>
            </div>
          </div>
        </div>

        {/* Critical Path Health */}
        <div className={`bg-app-surface border rounded-xl p-5 flex items-center gap-4 ${isAtRisk ? 'border-amber-500/30' : 'border-app-border'}`}>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isAtRisk ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
            {isAtRisk ? (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            )}
          </div>
          <div>
            <div className="text-sm text-app-muted font-medium mb-1">Critical Path Health</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isAtRisk ? 'text-amber-500' : 'text-emerald-500'}`}>
                {data.criticalPathHealth}
              </span>
              {data.totalCritical > 0 && (
                <span className="text-sm text-app-muted">
                  ({data.criticalAtRisk} of {data.totalCritical} delayed)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5">
        <h4 className="text-sm font-bold text-app-fg flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-app-muted" />
          Upcoming Milestones
        </h4>
        
        {data.upcomingMilestones.length > 0 ? (
          <div className="space-y-3">
            {data.upcomingMilestones.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-app-border bg-app-bg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${m.isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="font-medium text-app-fg text-sm">{m.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-app-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(m.plannedDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-app-muted text-center py-4">No upcoming milestones</div>
        )}
      </div>
    </div>
  )
}
