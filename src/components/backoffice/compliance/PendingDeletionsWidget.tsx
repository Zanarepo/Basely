'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { cancelDeletionRequestAction } from '@/lib/backoffice/actions'

export function PendingDeletionsWidget({ data }: { data: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleCancel = (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this deletion and restore the owner?')) return
    
    setLoadingId(id)
    startTransition(async () => {
      try {
        await cancelDeletionRequestAction(id)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setLoadingId(null)
      }
    })
  }

  if (data.length === 0) {
    return (
      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-6 mt-6">
        <h3 className="text-sm font-bold text-app-fg mb-2 uppercase tracking-wider">Pending GDPR Deletions</h3>
        <p className="text-sm text-app-muted">No organizations are currently in the 30-day grace period.</p>
      </div>
    )
  }

  return (
    <div className="bg-app-card rounded-2xl border border-red-500/20 shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-red-500/20 bg-red-500/5">
        <h3 className="font-bold text-red-500">Pending GDPR Deletions (30-day grace period)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-surface border-b border-app-border">
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Organization</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Requested At</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Execution Date</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {data.map((req) => (
              <tr key={req.id} className="hover:bg-app-hover">
                <td className="px-6 py-4">
                  <Link href={`/backoffice/tenants/${req.organization_id}`} className="font-bold text-app-fg text-sm hover:underline">
                    {req.organizations?.name || req.organization_id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-app-muted">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-red-500">
                    {new Date(req.grace_period_ends_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md uppercase tracking-wider">
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleCancel(req.id)}
                    disabled={isPending && loadingId === req.id}
                    className="px-3 py-1.5 bg-app-surface-solid hover:bg-app-hover border border-app-border text-xs font-bold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isPending && loadingId === req.id ? 'Restoring...' : 'Cancel & Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
