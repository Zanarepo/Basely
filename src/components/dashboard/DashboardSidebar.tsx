'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Loader2,
  Users,
  CheckSquare,
  Settings,
  Search,
  X,
  Terminal,
  ChevronUp,
  Database,
  Shield,
} from 'lucide-react'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { useWorkspace } from './WorkspaceContext'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'
import { NotificationBell } from './notifications/NotificationBell'
import { usePlatformStaff } from '@/hooks/use-platform-staff'

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

type DashboardSidebarProps = {
  userEmail: string
  onCreateWorkspace: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function DashboardSidebar({
  userEmail,
  onCreateWorkspace,
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { activeWorkspace } = useWorkspace()
  const { tier } = useWorkspaceTier(activeWorkspace?.id)
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isFooterOpen, setIsFooterOpen] = useState(false)
  const { isPlatformStaff } = usePlatformStaff()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)

    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored === 'true') setCollapsed(true)
      setMounted(true)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Auto-close mobile sidebar when navigation occurs
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile()
    }
  }, [pathname])

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
    // Approvals requires governance.approval_workflows (Enterprise only)
    ...(tier === 'enterprise' ? [{ href: '/dashboard/approvals', label: 'Approvals', icon: CheckSquare }] : []),
    { href: '/dashboard/team', label: 'Team', icon: Users },
  ]

  if (activeWorkspace.role === 'Admin' && tier !== 'free') {
    navItems.push({ href: '/dashboard/settings/templates', label: 'Templates', icon: Settings })
  }

  if (!mounted) {
    return (
      <aside className="hidden md:flex shrink-0 w-64 border-r border-app-border bg-app-surface-solid/95" />
    )
  }

  const effectivelyCollapsed = collapsed && !isMobile

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[55] md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-[60] md:z-50 h-screen transition-all duration-300 ease-in-out bg-app-surface-solid/95 backdrop-blur-xl border-r border-app-border flex flex-col ${
          mobileOpen ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
        } ${effectivelyCollapsed ? 'md:w-18' : 'md:w-64'} shrink-0`}
      >
        <div
          className={`flex items-center justify-between border-b border-app-border ${
            effectivelyCollapsed ? 'md:justify-center md:px-2 py-5' : 'gap-3 px-4 py-5'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-2 rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-600/20">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            {!effectivelyCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-app-fg tracking-tight truncate">
                  Baseline
                </p>
                <p className="text-[10px] text-app-subtle uppercase tracking-widest">
                  Project Controls
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-hover md:hidden transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-3 ${effectivelyCollapsed ? 'px-2' : ''}`}>
          <WorkspaceSwitcher collapsed={effectivelyCollapsed} onCreateWorkspace={onCreateWorkspace} />
        </div>

        <div className={`px-3 mb-2 ${effectivelyCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile()
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
            }}
            title={effectivelyCollapsed ? 'Search (Cmd+K)' : undefined}
            className={`w-full flex items-center rounded-xl border border-app-border bg-app-surface hover:bg-app-hover transition-colors text-app-muted hover:text-app-fg cursor-pointer ${
              effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-3'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!effectivelyCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm">Search</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-app-bg px-1.5 font-mono text-[10px] font-medium text-app-muted border border-app-border">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            )}
          </button>
        </div>

        <nav className={`flex-1 px-3 space-y-1 overflow-y-auto ${effectivelyCollapsed ? 'px-2' : ''}`}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={effectivelyCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                  effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/25'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${active ? 'text-indigo-500 dark:text-indigo-400' : ''}`}
                />
                {!effectivelyCollapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </Link>
            )
          })}

          <div className="pt-2 mt-2 border-t border-app-border/50">
            <NotificationBell collapsed={effectivelyCollapsed} />
          </div>

          {/* Platform Backoffice Link — only visible to internal staff */}
          {isPlatformStaff && (
            <div className="pt-2 mt-2 border-t border-app-border/50">
              <Link
                href="/backoffice"
                title={effectivelyCollapsed ? 'Platform Backoffice' : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 ${
                  effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                }`}
              >
                <Shield className="h-5 w-5 shrink-0" />
                {!effectivelyCollapsed && (
                  <span className="text-sm font-bold">Backoffice</span>
                )}
              </Link>
            </div>
          )}
        </nav>

        <div
          className={`mt-auto border-t border-app-border p-2 space-y-1 ${
            effectivelyCollapsed ? 'px-2' : ''
          }`}
        >
          {/* Accordion Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFooterOpen ? 'max-h-48 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="space-y-1 p-1">
              {(activeWorkspace.role === 'Admin' || activeWorkspace.role === 'Owner') && tier === 'enterprise' && (
                <>
                  <Link
                    href="/dashboard/settings/integrations"
                    title={effectivelyCollapsed ? 'ERP Connectors' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 border border-transparent transition-all cursor-pointer ${
                      effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                    }`}
                  >
                    <Database className="h-5 w-5 shrink-0" />
                    {!effectivelyCollapsed && <span className="text-sm font-medium">ERP Connectors</span>}
                  </Link>
                  <Link
                    href="/dashboard/settings/developers"
                    title={effectivelyCollapsed ? 'Developers' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 border border-transparent transition-all cursor-pointer ${
                      effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                    }`}
                  >
                    <Terminal className="h-5 w-5 shrink-0" />
                    {!effectivelyCollapsed && <span className="text-sm font-medium">Developers</span>}
                  </Link>
                </>
              )}
              
              <div className={effectivelyCollapsed ? 'flex justify-center p-1' : 'px-1 py-1'}>
                <ThemeToggle collapsed={effectivelyCollapsed} />
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                title="Sign out"
                className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-rose-500 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 ${
                  effectivelyCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                }`}
              >
                {signingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                ) : (
                  <LogOut className="h-5 w-5 shrink-0" />
                )}
                {!effectivelyCollapsed && <span className="text-sm font-medium">Sign out</span>}
              </button>
            </div>
          </div>

          {/* Accordion Trigger */}
          <button
            onClick={() => setIsFooterOpen(!isFooterOpen)}
            title={effectivelyCollapsed ? userEmail : undefined}
            className={`w-full flex items-center justify-between rounded-xl hover:bg-app-hover transition-colors text-app-fg cursor-pointer border border-transparent hover:border-app-border/50 ${
              effectivelyCollapsed ? 'p-2 justify-center' : 'p-2'
            }`}
          >
            <div className="flex items-center gap-3 truncate">
               <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <span className="font-semibold text-sm uppercase">{userEmail ? userEmail[0] : 'U'}</span>
               </div>
               {!effectivelyCollapsed && (
                 <span className="text-sm font-medium truncate">{userEmail}</span>
               )}
            </div>
            {!effectivelyCollapsed && (
              <ChevronUp className={`w-4 h-4 text-app-muted shrink-0 transition-transform duration-300 ${isFooterOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>

        {/* Expand/Collapse Toggle Button (Desktop only) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-[10000] h-6 w-6 items-center justify-center rounded-full bg-app-toggle-bg border border-app-toggle-border text-app-toggle-fg hover:text-app-fg hover:border-indigo-500/50 shadow-lg transition-all cursor-pointer"
        >
          <ArrowRight
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              collapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </aside>
    </>
  )
}
