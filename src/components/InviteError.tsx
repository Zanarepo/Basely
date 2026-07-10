import Link from 'next/link'
import { AuthPageShell } from '@/components/AuthPageShell'
import { ShieldAlert, ArrowRight } from 'lucide-react'

type InviteErrorProps = {
  message: string
}

export function InviteError({ message }: InviteErrorProps) {
  return (
    <AuthPageShell>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-500/20 mb-4">
          <ShieldAlert className="h-7 w-7 text-rose-500 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-app-fg">
          Invitation unavailable
        </h1>
        <p className="mt-2 text-sm text-app-muted max-w-sm mx-auto">{message}</p>
      </div>

      <div className="auth-card text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
        >
          Go to sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthPageShell>
  )
}
