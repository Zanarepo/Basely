'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, eachDayOfInterval, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns'
import type { Iteration } from '@/lib/releases/types'

export default function BurndownChart({ activeSprint }: { activeSprint: Iteration }) {
  const { startDate, endDate, totalItems = 0, completedCount = 0, snapshots = [] } = activeSprint
  
  if (!startDate || !endDate) return null

  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))
  const today = startOfDay(new Date())

  // Generate all days in the sprint
  let days: Date[] = []
  try {
    days = eachDayOfInterval({ start, end })
  } catch (e) {
    // Fallback if dates are invalid
    days = [start, end]
  }

  const totalDays = days.length > 1 ? days.length - 1 : 1
  const idealStep = totalItems / totalDays

  const data = days.map((day, index) => {
    const isFuture = isAfter(day, today)
    
    // Ideal drops linearly
    const ideal = Math.max(0, totalItems - (idealStep * index))
    
    // Actual logic: look for a snapshot matching this day
    let actual: number | undefined = undefined
    
    if (!isFuture) {
      const snap = snapshots.find(s => isSameDay(new Date(s.snapshot_date), day))
      if (snap) {
        actual = (snap.total_items || 0) - (snap.completed_items || 0)
      } else if (isSameDay(day, today)) {
        // Use live current state for today if no snapshot yet
        actual = totalItems - completedCount
      } else {
        // If it's a past day with no snapshot, we might not have data. 
        // We'll leave it undefined to let the chart interpolate, or just use totalItems if it's day 0.
        if (index === 0) actual = totalItems
      }
    }

    return {
      day: format(day, 'MMM d'),
      ideal: Number(ideal.toFixed(1)),
      actual
    }
  })

  // Fill in gaps in actual data for past days if we want a continuous line
  let lastKnownActual = totalItems
  for (let i = 0; i < data.length; i++) {
    if (data[i].actual !== undefined) {
      lastKnownActual = data[i].actual as number
    } else if (!isAfter(days[i], today)) {
      data[i].actual = lastKnownActual
    }
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-app-fg mb-6">Sprint Burndown</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} strokeOpacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} strokeOpacity={0.5} label={{ value: 'Remaining Items', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-app-border)', backgroundColor: 'var(--bg-app-surface)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="ideal" name="Ideal Burndown" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

