'use client'

import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { WorkspaceProvider, type Workspace } from './WorkspaceContext'
import { GlobalSearchOverlay } from './GlobalSearchOverlay'
import { Menu, Search, LayoutDashboard } from 'lucide-react'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { DowngradeBanner, UpgradePromptModal } from './billing'

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
  const [createWsOpen, setCreateWsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const { tier, isTrialing, isWorkspaceLocked, workspaceLockReason, daysRemaining, switchPlan } = useWorkspaceTier(activeWorkspace?.id)

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
          onCreateWorkspace={() => setCreateWsOpen(true)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Mobile Header Bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface-solid/95 backdrop-blur-xl md:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-app-muted hover:text-app-fg rounded-xl hover:bg-app-hover transition-colors cursor-pointer"
                aria-label="Open sidebar navigation"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-linear-to-tr from-violet-600 to-indigo-600 shadow-sm">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight text-app-fg">Baseline</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="p-2 text-app-muted hover:text-app-fg rounded-xl hover:bg-app-hover transition-colors cursor-pointer"
              aria-label="Search (Cmd+K)"
            >
              <Search className="w-5 h-5" />
            </button>
          </header>

          <main className="relative flex-1 min-w-0 overflow-auto">
            <DowngradeBanner
              isTrialing={isTrialing}
              daysRemaining={daysRemaining}
              isWorkspaceLocked={isWorkspaceLocked}
              workspaceLockReason={workspaceLockReason}
              canUpgrade={activeWorkspace?.isOwner || activeWorkspace?.role === 'Admin'}
              onOpenUpgrade={() => setUpgradeModalOpen(true)}
            />
            {children}
          </main>
        </div>
        
        <GlobalSearchOverlay />
      </div>

      <CreateWorkspaceModal open={createWsOpen} onClose={() => setCreateWsOpen(false)} />
      <UpgradePromptModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentTier={tier}
        organizationId={activeWorkspace?.id || ''}
        onSelectTier={async (targetTier) => {
          if (switchPlan) {
            await switchPlan(targetTier)
          }
        }}
      />
    </WorkspaceProvider>
  )
}
