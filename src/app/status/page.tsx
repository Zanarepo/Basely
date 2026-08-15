import React from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export const metadata = {
  title: 'System Status | Prazaner',
  description: 'Prazaner system status and uptime monitoring',
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-app-bg text-app-fg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-app-surface border border-app-border rounded-2xl shadow-sm p-8 text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-app-fg mb-3">System Status</h1>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Coming Soon
        </div>

        <p className="text-app-muted mb-8 text-sm">
          We are currently setting up our public real-time system monitoring dashboard. 
          Check back soon for live updates on our database, API, and server health.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-app-border pt-6">
          <Link 
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-app-surface-solid border border-app-border text-app-fg font-semibold hover:bg-app-hover transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
