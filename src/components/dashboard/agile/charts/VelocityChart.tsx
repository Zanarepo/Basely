'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Iteration } from '@/lib/releases/types'

export default function VelocityChart({ iterations }: { iterations: Iteration[] }) {
  // Sort by sequence number and get up to 5 completed or past sprints
  const sorted = [...iterations].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  const pastSprints = sorted.filter(i => i.status === 'completed' || i.status === 'active').slice(-5)

  const data = pastSprints.map(i => ({
    sprint: i.name,
    committed: i.totalItems || 0,
    completed: i.completedCount || 0
  }))

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center h-[380px]">
        <h3 className="text-base font-bold text-app-fg mb-2">Velocity</h3>
        <p className="text-sm text-app-muted">No completed sprints yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-app-fg mb-6">Velocity (Last {data.length} Sprints)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="sprint" tick={{ fontSize: 12 }} strokeOpacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} strokeOpacity={0.5} label={{ value: 'Items / Stories', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-app-border)', backgroundColor: 'var(--bg-app-surface)' }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="committed" name="Committed" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

