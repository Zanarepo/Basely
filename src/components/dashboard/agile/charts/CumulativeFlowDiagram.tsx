'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Day 1', done: 0, review: 0, inProgress: 10, todo: 90 },
  { day: 'Day 2', done: 5, review: 5, inProgress: 15, todo: 75 },
  { day: 'Day 3', done: 12, review: 8, inProgress: 20, todo: 60 },
  { day: 'Day 4', done: 25, review: 10, inProgress: 25, todo: 40 },
  { day: 'Day 5', done: 38, review: 12, inProgress: 20, todo: 30 },
  { day: 'Day 6', done: 45, review: 15, inProgress: 15, todo: 25 },
  { day: 'Day 7', done: 62, review: 10, inProgress: 18, todo: 10 },
  { day: 'Day 8', done: 75, review: 5, inProgress: 15, todo: 5 },
  { day: 'Day 9', done: 85, review: 5, inProgress: 10, todo: 0 },
  { day: 'Day 10', done: 95, review: 5, inProgress: 0, todo: 0 },
]

export default function CumulativeFlowDiagram() {
  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-app-fg mb-6">Cumulative Flow Diagram</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} strokeOpacity={0.5} />
            <YAxis tick={{ fontSize: 12 }} strokeOpacity={0.5} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-app-border)', backgroundColor: 'var(--bg-app-surface)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="done" name="Done" stackId="1" stroke="#10b981" fill="#10b981" />
            <Area type="monotone" dataKey="review" name="Review" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
            <Area type="monotone" dataKey="inProgress" name="In Progress" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
            <Area type="monotone" dataKey="todo" name="To Do" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
