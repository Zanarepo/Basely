import React from 'react'
import { verifySignoffToken } from '@/lib/projects/signoff-actions'
import { ExternalSignoffForm } from '@/components/signoff/ExternalSignoffForm'
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'External Project Sign-Off | Basely PM',
  description: 'Secure token-based external stakeholder project closure acceptance portal.'
}

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ExternalSignoffPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token || ''

  const verification = await verifySignoffToken(token)

  return (
    <div className="min-h-screen bg-app-bg text-app-fg py-12 px-4 sm:px-6 md:px-12 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <header className="w-full max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          BASELY CONTROLS
        </div>
        <div className="flex items-center gap-1 text-xs text-app-muted font-mono font-bold bg-app-surface px-3 py-1 rounded-full border border-app-border">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>TLS 256-bit Encrypted Token Access</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        {!verification.ok || !verification.signoff ? (
          <div className="w-full max-w-lg p-6 sm:p-10 bg-app-surface border border-rose-500/30 rounded-3xl text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-app-fg tracking-tight">
                Acceptance Link Unavailable
              </h2>
              <p className="text-xs sm:text-sm text-app-muted leading-relaxed">
                {verification.error || 'The security token associated with this acceptance link is invalid, expired, or has already been fully processed.'}
              </p>
            </div>
            <p className="text-[11px] text-app-muted italic pt-4 border-t border-app-border">
              Please contact your designated Project Manager or organization administrator to request a renewed tokenized sign-off invitation URL.
            </p>
          </div>
        ) : (
          <ExternalSignoffForm
            token={token}
            signoff={verification.signoff}
            project={verification.project}
          />
        )}
      </main>

      <footer className="w-full max-w-4xl mx-auto mt-12 text-center text-[11px] text-app-muted font-medium py-4 border-t border-app-border/40">
        &copy; {new Date().getFullYear()} Basely Enterprise PMO Engine. All rights reserved. Immutable Compliance Records Powered by PostgreSQL Architecture.
      </footer>
    </div>
  )
}
