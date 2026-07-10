'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { InviteTeamModal } from './InviteTeamModal'
import { WorkspaceProvider, type Workspace } from './WorkspaceContext'

type DashboardShellProps = {
  workspaces: Workspace[]
  activeWorkspace: Workspace
  userEmail: string
  children: React.ReactNode
}

export function DashboardShell({
  workspaces,
  activeWorkspace,
  userEmail,
  children,
}: DashboardShellProps) {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <WorkspaceProvider workspaces={workspaces} activeWorkspace={activeWorkspace}>
      <div className="flex min-h-screen bg-app-bg font-sans transition-colors duration-200">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
            style={{ backgroundColor: 'var(--app-orb-violet)' }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
            style={{ backgroundColor: 'var(--app-orb-indigo)' }}
          />
        </div>

        <DashboardSidebar
          userEmail={userEmail}
          onInviteTeam={() => setInviteOpen(true)}
        />

        <main className="relative flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
      <InviteTeamModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </WorkspaceProvider>
  )
}
