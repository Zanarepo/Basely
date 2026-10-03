'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, eachDayOfInterval, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns'
import type { Iteration } from '@/lib/releases/types'

export default function CumulativeFlowDiagram({ activeSprint }: { activeSprint: Iteration }) {
  const { startDate, endDate, totalItems = 0, completedCount = 0, inProgressCount = 0, snapshots = [] } = activeSprint
  
  if (!startDate || !endDate) return null

  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))
  const today = startOfDay(new Date())

  let days: Date[] = []
  try {
    days = eachDayOfInterval({ start, end })
  } catch (e) {
    days = [start, end]
  }

  const data = days.map((day) => {
    const isFuture = isAfter(day, today)
    
    // For future days, return nulls so they don't render in the area chart
    if (isFuture) {
      return {
        day: format(day, 'MMM d'),
        done: null,
        inProgress: null,
        todo: null,
      }
    }

    let done = 0
    let inProgress = 0
    let todo = 0
    
    const snap = snapshots.find(s => isSameDay(new Date(s.snapshot_date), day))
    if (snap) {
      done = snap.completed_items || 0
      inProgress = snap.in_progress_items || 0
      todo = snap.planned_items || 0
    } else if (isSameDay(day, today)) {
      // Use live current state for today
      done = completedCount
      inProgress = inProgressCount
      todo = Math.max(0, totalItems - completedCount - inProgressCount)
    } else {
      // Missing snapshot for past day, approximate based on start
      todo = totalItems
    }

    return {
      day: format(day, 'MMM d'),
      done,
      inProgress,
      todo,
    }
  })

  // We don't really need to forward fill if we just set past days to 'todo = totalItems'
  // But if we want to smooth it out, we can backward fill from today if there are no snapshots at all.
  // For now, returning actual 0s and totalItems is fine for recharts Area to render properly.

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-app-fg mb-6">Cumulative Flow Diagram</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} strokeOpacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} strokeOpacity={0.5} label={{ value: 'Items / Stories', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-app-border)', backgroundColor: 'var(--bg-app-surface)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="done" name="Done" stackId="1" stroke="#10b981" fill="#10b981" connectNulls />
            <Area type="monotone" dataKey="inProgress" name="In Progress" stackId="1" stroke="#f59e0b" fill="#f59e0b" connectNulls />
            <Area type="monotone" dataKey="todo" name="To Do" stackId="1" stroke="#94a3b8" fill="#94a3b8" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

