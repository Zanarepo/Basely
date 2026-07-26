'use client'

import React, { useEffect, useState } from 'react'
import { getProcurementEntries, ProcurementEntry } from '@/lib/planning/procurement-actions'
import { DollarSign } from 'lucide-react'

export function ProcurementPlanResolver({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<ProcurementEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEntries = async () => {
      const res = await getProcurementEntries(projectId)
      if (!res.error && res.entries) {
        setEntries(res.entries)
      }
      setIsLoading(false)
    }
    fetchEntries()
  }, [projectId])

  if (isLoading) return <div className="p-4 text-sm text-app-muted">Loading procurement plan...</div>

  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val)
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-app-border bg-app-surface/50">
              <th className="px-4 py-3 text-xs font-medium text-app-muted uppercase tracking-wider">Vendor / Scope</th>
              <th className="px-4 py-3 text-xs font-medium text-app-muted uppercase tracking-wider">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-app-muted italic">
                  No procurement entries defined.
                </td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id} className="hover:bg-app-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-app-fg text-sm">{entry.vendor_name}</div>
                    {entry.contract_scope && (
                      <div className="text-xs text-app-muted mt-1 whitespace-pre-wrap">{entry.contract_scope}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.linked_cost_account_id && entry.cost_accounts ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded text-xs font-medium">
                        <DollarSign className="w-3.5 h-3.5" />
                        Linked: {formatCurrency(entry.cost_accounts.budgeted_total, entry.cost_accounts.currency)}
                      </div>
                    ) : entry.cost ? (
                      <span className="text-sm text-app-fg">{formatCurrency(entry.cost)}</span>
                    ) : (
                      <span className="text-xs text-app-muted italic">No cost defined</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
