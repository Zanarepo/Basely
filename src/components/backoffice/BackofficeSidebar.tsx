'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  BarChart3,
  Building2,
  LogOut,
  Loader2,
  Shield,
  ChevronUp,
  ArrowLeft,
  X,
  Layers,
  Tag,
  CreditCard,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

type BackofficeSidebarProps = {
  staffEmail: string
  staffRole: string
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function BackofficeSidebar({ staffEmail, staffRole, mobileOpen = false, onCloseMobile }: BackofficeSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [isFooterOpen, setIsFooterOpen] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // Auto-close mobile sidebar when navigation occurs
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile()
    }
  }, [pathname])

  const navItems = [
    { href: '/backoffice', label: 'Platform Metrics', icon: BarChart3, exact: true },
    { href: '/backoffice/tenants', label: 'Tenant Directory', icon: Building2, exact: false },
    { href: '/backoffice/staff', label: 'Staff Directory', icon: Shield, exact: false },
    { href: '/backoffice/plans', label: 'Plans & Features', icon: Layers, exact: false },
    { href: '/backoffice/promos', label: 'Promos & Coupons', icon: Tag, exact: false },
    { href: '/backoffice/subscriptions', label: 'Subscriptions & Payments', icon: CreditCard, exact: false },
  ]

  const roleLabel = staffRole.replace(/_/g, ' ')

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
          mobileOpen ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0 md:w-64'
        } shrink-0`}
      >
        {/* Header — matching the customer sidebar branding */}
        <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-app-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-2 rounded-xl bg-linear-to-tr from-amber-600 to-orange-500 shadow-lg shadow-orange-600/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-app-fg tracking-tight truncate">
                Baseline
              </p>
              <p className="text-[10px] text-app-subtle uppercase tracking-widest">
                Backoffice
              </p>
            </div>
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                active
                  ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/25'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-indigo-500 dark:text-indigo-400' : ''}`} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          )
        })}

        {/* Back to Customer Dashboard */}
        <div className="pt-2 mt-2 border-t border-app-border/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Customer Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Footer — matching customer sidebar pattern */}
      <div className="mt-auto border-t border-app-border p-2 space-y-1">
        {/* Accordion Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFooterOpen ? 'max-h-48 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="space-y-1 p-1">
            <div className="px-1 py-1">
              <ThemeToggle collapsed={false} />
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign out"
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-app-muted hover:text-rose-500 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              ) : (
                <LogOut className="h-5 w-5 shrink-0" />
              )}
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        </div>

        {/* Accordion Trigger */}
        <button
          onClick={() => setIsFooterOpen(!isFooterOpen)}
          className="w-full flex items-center justify-between rounded-xl p-2 hover:bg-app-hover transition-colors text-app-fg cursor-pointer border border-transparent hover:border-app-border/50"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <span className="font-semibold text-sm uppercase">{staffEmail ? staffEmail[0] : 'S'}</span>
            </div>
            <div className="min-w-0 text-left">
              <span className="text-sm font-medium truncate block">{staffEmail}</span>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider capitalize">{roleLabel}</span>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-app-muted shrink-0 transition-transform duration-300 ${isFooterOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
    </>
  )
}
