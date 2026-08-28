'use client'

import { Activity, Clock, Layers, Zap } from 'lucide-react'

export default function FlowMetricsWidget() {
  // In a real implementation, these would come from useProjectDashboardData or similar.
  // For now, we use realistic mock values.
  const metrics = {
    leadTime: 12.4, // days
    cycleTime: 5.2, // days
    throughput: 18, // items per week
    flowEfficiency: 42 // percentage
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-app-fg">Flow Metrics</h3>
          <Activity className="h-5 w-5 text-violet-500" />
        </div>

        {/* Lead and Cycle Time Mini Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              Lead Time
            </div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {metrics.leadTime} <span className="text-xs font-semibold text-app-muted">days</span>
            </div>
            <div className="text-[10px] text-app-muted mt-1">Avg. requested to done</div>
          </div>

          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Cycle Time
            </div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.cycleTime} <span className="text-xs font-semibold text-app-muted">days</span>
            </div>
            <div className="text-[10px] text-app-muted mt-1">Avg. started to done</div>
          </div>
        </div>

        {/* Throughput and Efficiency */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-app-hover rounded-xl p-3 border border-app-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-app-fg">Throughput</div>
                <div className="text-[10px] text-app-muted">Items completed / week</div>
              </div>
            </div>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              {metrics.throughput}
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-50 dark:bg-app-hover rounded-xl p-3 border border-app-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-app-fg">Flow Efficiency</div>
                <div className="text-[10px] text-app-muted">Active work vs wait time</div>
              </div>
            </div>
            <span className="font-black text-lg text-violet-600 dark:text-violet-400">
              {metrics.flowEfficiency}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
