'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { sprint: 'Sprint 1', committed: 40, completed: 35 },
  { sprint: 'Sprint 2', committed: 45, completed: 42 },
  { sprint: 'Sprint 3', committed: 42, completed: 45 },
  { sprint: 'Sprint 4', committed: 50, completed: 48 },
  { sprint: 'Sprint 5', committed: 48, completed: 52 },
]

export default function VelocityChart() {
  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-app-fg mb-6">Velocity (Last 5 Sprints)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="sprint" tick={{ fontSize: 12 }} strokeOpacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} strokeOpacity={0.5} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }} />
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
