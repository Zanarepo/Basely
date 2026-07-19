'use client'

import { Users } from 'lucide-react'

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type ProjectTeamRosterProps = {
  members: WorkspaceMember[]
  assignedUserIds: string[]
}

export function ProjectTeamRoster({ members, assignedUserIds }: ProjectTeamRosterProps) {
  const assignedMembers = members.filter(m => assignedUserIds.includes(m.userId))

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 bg-app-surface border border-app-border rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
          <Users className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-app-fg">Project Team</span>
        <span className="text-xs font-semibold text-app-muted bg-app-muted-surface px-2 py-0.5 rounded-full border border-app-border">
          {assignedMembers.length}
        </span>
      </div>
      
      {assignedMembers.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 sm:ml-4">
          {assignedMembers.map(m => {
            const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <div
                key={m.userId}
                title={`${m.name} (${m.email}) - ${m.role}`}
                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-app-muted-surface border border-app-border cursor-default hover:bg-app-hover hover:border-indigo-500/30 transition-colors"
              >
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20 shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-app-fg truncate max-w-[100px]">{m.name}</span>
                  <span className="text-[10px] text-app-muted truncate leading-none">{m.role}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-app-subtle sm:ml-4 italic">No team members assigned</p>
      )}
    </div>
  )
}
