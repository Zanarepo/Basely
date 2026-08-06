'use client'

import { useState } from 'react'
import { toggleSandboxStatusAction } from '@/lib/backoffice/sandbox-actions'
import { Beaker } from 'lucide-react'

export function SandboxToggleClient({ orgId, initialStatus }: { orgId: string, initialStatus: boolean }) {
  const [isSandbox, setIsSandbox] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const newStatus = !isSandbox
      await toggleSandboxStatusAction(orgId, newStatus)
      setIsSandbox(newStatus)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-app-surface border border-app-border rounded-2xl">
      <div>
        <h3 className="text-sm font-black text-app-fg flex items-center gap-2">
          <Beaker className="w-4 h-4 text-indigo-500" />
          Sandbox Organization
        </h3>
        <p className="text-xs text-app-muted mt-1 font-semibold max-w-sm">
          Mark this organization as a sandbox to exclude it from analytics, revenue reporting, and billing metrics.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
          isSandbox ? 'bg-indigo-500' : 'bg-app-border'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isSandbox ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
