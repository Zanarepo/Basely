'use client'

import { useState } from 'react'
import { Users, UserPlus, User, ShieldCheck, Settings2, ScrollText, Lock } from 'lucide-react'
import {
  WorkspaceMembersPanel,
  type WorkspaceMember,
} from '@/components/dashboard/WorkspaceMembersPanel'
import { ProfileSettingsPanel } from '@/components/dashboard/ProfileSettingsPanel'
import { InviteTeamPanel } from './InviteTeamPanel'
import { SsoSettingsPanel } from './SsoSettingsPanel'
import { ApprovalPoliciesPanel } from './ApprovalPoliciesPanel'
import { GovernanceAuditLogPanel } from './GovernanceAuditLogPanel'
import { AiGovernancePanel } from './AiGovernancePanel'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { FeatureGateScreen } from '@/components/dashboard/billing'

type Tab = 'members' | 'invite' | 'governance' | 'profile'

type TabDef = {
  id: Tab
  label: string
  icon: React.ElementType
  description: string
  adminOnly?: boolean
  inviteOnly?: boolean
}

const TABS: TabDef[] = [
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    description: 'Manage team access, roles, and permissions',
  },
  {
    id: 'invite',
    label: 'Invite',
    icon: UserPlus,
    description: 'Invite new members via link or email',
    inviteOnly: true,
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: ShieldCheck,
    description: 'SSO, approval policies, and audit trail',
    adminOnly: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Your personal settings and display name',
  },
]

type TeamPageTabsProps = {
  organizationId: string
  orgName: string
  members: WorkspaceMember[]
  isOwner: boolean
  isAdmin: boolean
  canInvite: boolean
  callerUserId: string
  callerCanManageAllMembers: boolean
  profileName: string
  profileEmail: string
}

export function TeamPageTabs({
  organizationId,
  orgName,
  members,
  isOwner,
  isAdmin,
  canInvite,
  callerUserId,
  callerCanManageAllMembers,
  profileName,
  profileEmail,
}: TeamPageTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('members')
  const { activeWorkspace } = useWorkspace()
  const { tier, features } = useWorkspaceTier(activeWorkspace?.id ?? organizationId)
  const isEnterprise = tier === 'enterprise'
  
  // Use dynamic feature flag if available, fallback to tier check
  const isGovernanceEnabled = features['security.governance'] ?? isEnterprise
  const canUpgradeGovernance = isAdmin // only admins can upgrade

  const visibleTabs = TABS.filter((t) => {
    if (t.adminOnly && !isAdmin) return false
    if (t.inviteOnly && !canInvite) return false
    return true
  })

  const currentTabDef = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0]

  return (
    <div className="space-y-6">
      {/* ── Tab Navigation ── */}
      <div className="backdrop-blur-md bg-app-surface/80 border border-app-border rounded-2xl p-1.5">
        <nav className="flex gap-1" role="tablist" aria-label="Team settings">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            const isGovTab = tab.id === 'governance'
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex-1 justify-center sm:flex-initial ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 shadow-sm'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${ active ? 'text-indigo-500 dark:text-indigo-400' : 'text-app-muted group-hover:text-app-fg' }`} />
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold ${active ? 'text-app-fg' : 'text-app-muted group-hover:text-app-fg'}`}>
                        {tab.label}
                      </p>
                      {isGovTab && !isEnterprise && (
                        <span className="bg-purple-500/15 text-purple-500 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                          Enterprise
                        </span>
                      )}
                    </div>
                  </div>

                {/* Active indicator dot on mobile */}
                {active && (
                  <span className="sm:hidden absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-indigo-500" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Tab Context Bar ── */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2 text-sm text-app-muted">
          <Settings2 className="h-4 w-4 text-app-subtle" />
          <span>{currentTabDef.description}</span>
        </div>
        <div className="flex-1" />
        <span className="hidden sm:inline text-xs text-app-subtle px-2.5 py-1 rounded-lg bg-app-muted-surface border border-app-border">
          {orgName}
        </span>
      </div>

      {/* ── Tab Panels ── */}
      <div className="min-h-[400px]">
        {/* Members Panel */}
        {activeTab === 'members' && (
          <div
            id="panel-members"
            role="tabpanel"
            className="animate-fade-in"
          >
            <WorkspaceMembersPanel
              organizationId={organizationId}
              members={members}
              isOwner={isOwner}
              callerUserId={callerUserId}
              callerCanManageAllMembers={callerCanManageAllMembers}
            />
          </div>
        )}

        {/* Invite Panel */}
        {activeTab === 'invite' && canInvite && (
          <div
            id="panel-invite"
            role="tabpanel"
            className="animate-fade-in"
          >
            <section className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6">
              <InviteTeamPanel />
            </section>
          </div>
        )}

        {/* Governance Panel */}
        {activeTab === 'governance' && isAdmin && (
          <div
            id="panel-governance"
            role="tabpanel"
            className="animate-fade-in space-y-6"
          >
            {isGovernanceEnabled ? (
              <>
                <AiGovernancePanel organizationId={organizationId} />
                <ApprovalPoliciesPanel
                  organizationId={organizationId}
                  members={members}
                  isAdmin={isAdmin}
                />
                <SsoSettingsPanel
                  organizationId={organizationId}
                  members={members}
                  isAdmin={isAdmin}
                />
                <GovernanceAuditLogPanel
                  organizationId={organizationId}
                  isAdmin={isAdmin}
                />
              </>
            ) : (
              <FeatureGateScreen
                featureName="Workspace Governance"
                requiredTier="enterprise"
                description="SSO & identity provider configuration, formal approval workflows, granular RBAC, and compliance-grade audit logs. Available on the Enterprise plan."
                canUpgrade={canUpgradeGovernance}
              />
            )}
          </div>
        )}

        {/* Profile Panel */}
        {activeTab === 'profile' && (
          <div
            id="panel-profile"
            role="tabpanel"
            className="animate-fade-in"
          >
            <ProfileSettingsPanel
              currentName={profileName}
              email={profileEmail}
            />
          </div>
        )}
      </div>
    </div>
  )
}
