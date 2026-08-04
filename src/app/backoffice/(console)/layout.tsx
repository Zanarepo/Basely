import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/backoffice/auth'
import Link from 'next/link'
import { BackofficeShell } from '@/components/backoffice/BackofficeShell'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staff = await getStaffSession()
  
  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg p-4">
        <div className="max-w-md w-full p-6 bg-app-surface-solid rounded-2xl shadow-sm border border-app-border text-center">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>

          <h2 className="text-xl font-bold text-app-fg mb-2">Restricted Access</h2>
          <p className="text-sm text-app-muted mb-6">
            This console is strictly for platform administration. Your account does not have internal staff privileges.
          </p>
          <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <BackofficeShell staffEmail={staff.email} staffRole={staff.role}>
      {children}
    </BackofficeShell>
  )
}
