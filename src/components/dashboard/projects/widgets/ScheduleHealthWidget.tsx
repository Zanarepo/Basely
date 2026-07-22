'use client'

import { Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import type { ScheduleHealth } from '../hooks/useProjectDashboardData'

export default function ScheduleHealthWidget({
  health
}: {
  health: ScheduleHealth
}) {
  const {
    overallPercentComplete,
    criticalPathStatus,
    slippageDays,
    milestoneHit,
    milestoneMissed,
    milestoneUpcoming
  } = health

  const pct = Math.min(100, Math.max(0, overallPercentComplete))

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-app-fg">Schedule Health</h3>
          <Calendar className="h-5 w-5 text-indigo-500" />
        </div>

        {/* Circular Progress & Overall Percent */}
        <div className="flex items-center gap-6 my-4">
          <div className="relative flex items-center justify-center h-20 w-20">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="text-gray-100 dark:text-app-hover"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className="text-indigo-500 transition-all duration-500 ease-out"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - pct / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-lg font-black text-app-fg">{pct}%</span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="text-xs text-app-muted font-bold uppercase tracking-wider">Critical Path Status</div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                criticalPathStatus === 'On Track' ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />
              <span className="text-sm font-bold text-app-fg">{criticalPathStatus}</span>
            </div>
            {slippageDays > 0 ? (
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3" />
                {slippageDays} {slippageDays === 1 ? 'day' : 'days'} slippage detected
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-500">No schedule slippage</span>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Counts Grid */}
      <div className="border-t border-app-border pt-4 mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 dark:bg-app-hover rounded-xl">
          <div className="text-emerald-500 flex justify-center mb-1">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-sm font-black text-app-fg">{milestoneHit}</div>
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Hit</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-app-hover rounded-xl">
          <div className="text-rose-500 flex justify-center mb-1">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-sm font-black text-app-fg">{milestoneMissed}</div>
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Missed</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-app-hover rounded-xl">
          <div className="text-indigo-500 flex justify-center mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-sm font-black text-app-fg">{milestoneUpcoming}</div>
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Pending</div>
        </div>
      </div>
    </div>
  )
}
