'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { BackofficeSidebar } from './BackofficeSidebar'
import { Menu, Search, Shield } from 'lucide-react'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

type BackofficeShellProps = {
  staffEmail: string
  staffRole: string
  children: React.ReactNode
}

function BackofficeToastManager() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('invite_accepted') === 'true') {
      setToasts([{ id: 'invite-accepted', type: 'success', message: 'Invitation accepted successfully!' }])
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('invite_accepted')
      router.replace(`${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`)
    }
  }, [searchParams, pathname, router])

  return <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
}

export function BackofficeShell({
  staffEmail,
  staffRole,
  children,
}: BackofficeShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
    <div className="flex min-h-screen bg-app-bg font-sans transition-colors duration-200">
      <BackofficeSidebar
        staffEmail={staffEmail}
        staffRole={staffRole}
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
              <div className="p-1.5 rounded-lg bg-linear-to-tr from-amber-600 to-orange-500 shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-app-fg">Baseline Backoffice</span>
            </div>
          </div>
        </header>

        <main className="relative flex-1 min-w-0 overflow-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    <Suspense fallback={null}>
      <BackofficeToastManager />
    </Suspense>
    </>
  )
}
