'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { useWorkspace } from './WorkspaceContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

type DashboardSidebarProps = {
  userEmail: string
  onInviteTeam: () => void
}

const INVITE_ROLES = new Set(['Admin', 'PM'])

export function DashboardSidebar({
  userEmail,
  onInviteTeam,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeWorkspace } = useWorkspace()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const canInvite = INVITE_ROLES.has(activeWorkspace.role)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored === 'true') setCollapsed(true)
      setMounted(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]

  if (!mounted) {
    return (
      <aside className="shrink-0 w-64 border-r border-app-border bg-app-surface-solid/95" />
    )
  }

  return (
    <aside
      className={`shrink-0 flex flex-col h-screen sticky top-0 border-r border-app-border bg-app-surface-solid/95 backdrop-blur-xl transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div
        className={`flex items-center border-b border-app-border ${
          collapsed ? 'justify-center px-2 py-5' : 'gap-3 px-4 py-5'
        }`}
      >
        <div className="shrink-0 p-2 rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-600/20">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-app-fg tracking-tight truncate">
             Basely
            </p>
            <p className="text-[10px] text-app-subtle uppercase tracking-widest">
              Project Controls
            </p>
          </div>
        )}
      </div>

      <div className={`p-3 ${collapsed ? 'px-2' : ''}`}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <nav className={`flex-1 px-3 space-y-1 ${collapsed ? 'px-2' : ''}`}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/25'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? 'text-indigo-500 dark:text-indigo-400' : ''}`}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div
        className={`mt-auto border-t border-app-border p-3 space-y-2 ${
          collapsed ? 'px-2' : ''
        }`}
      >
        {canInvite && (
          <button
            type="button"
            onClick={onInviteTeam}
            title="Invite team"
            className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
          >
            <UserPlus className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Invite team</span>
            )}
          </button>
        )}

        <ThemeToggle collapsed={collapsed} />

        {!collapsed && (
          <p className="px-2 text-xs text-app-subtle truncate" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-rose-500 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
        >
          {signingOut ? (
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-app-toggle-bg border border-app-toggle-border text-app-toggle-fg hover:text-app-fg hover:border-indigo-500/50 shadow-lg transition-all cursor-pointer"
      >
        <ArrowRight
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            collapsed ? '' : 'rotate-180'
          }`}
        />
      </button>
    </aside>
  )
}
