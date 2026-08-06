'use client'

import React, { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { SubscriptionDetailModal } from './SubscriptionDetailModal'
import { getTenantBillingDetailsAction } from '@/lib/backoffice/actions'

export type SubscriptionTenant = {
  id: string
  name: string
  owner_email: string
  owner_name: string
  tier: string
  status: string
  period_end: string | null
}

export function SubscriptionsClient({ initialData }: { initialData: SubscriptionTenant[] }) {
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>(null)

  const handleOpenDetail = async (id: string) => {
    setLoadingId(id)
    try {
      const data = await getTenantBillingDetailsAction(id)
      setModalData(data)
    } catch (err) {
      console.error(err)
      alert("Failed to load details.")
    } finally {
      setLoadingId(null)
    }
  }

  // Filter data client-side
  let filtered = initialData

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
  }
  if (tierFilter && tierFilter !== 'all') {
    filtered = filtered.filter(t => t.tier === tierFilter)
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter)
  }

  const getDaysUntilExpiration = (dateString: string | null) => {
    if (!dateString) return null
    const end = new Date(dateString)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search organizations by name or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-app-surface-solid border border-app-border rounded-xl text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500 transition-all h-[38px]"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="w-[160px]">
            <EnterpriseSelect
              value={tierFilter}
              onChange={(val) => setTierFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Tiers' },
                { value: 'free', label: 'Free Starter' },
                { value: 'premium', label: 'Premium' },
                { value: 'enterprise', label: 'Enterprise' }
              ]}
              placeholder="All Tiers"
            />
          </div>
          <div className="w-[160px]">
            <EnterpriseSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'trialing', label: 'Trialing' },
                { value: 'past_due', label: 'Past Due' },
                { value: 'expired', label: 'Expired' }
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-surface border-b border-app-border">
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {filtered.map((tenant) => {
                const daysLeft = getDaysUntilExpiration(tenant.period_end)
                return (
                  <tr key={tenant.id} className="group hover:bg-app-hover transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-app-muted-surface flex items-center justify-center font-bold text-app-fg text-xs uppercase border border-app-border shrink-0">
                          {tenant.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-app-fg text-sm truncate">{tenant.name}</div>
                          <div className="text-xs text-app-muted truncate" title={tenant.owner_name}>
                            {tenant.owner_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tenant.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                            tenant.tier === 'premium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                              'bg-app-surface text-app-muted border border-app-border'
                          }`}>
                          {tenant.tier}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' :
                              tenant.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
                          <span className="text-[10px] font-semibold text-app-muted capitalize">{tenant.status}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {daysLeft !== null ? (
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-app-fg'}`}>
                            {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
                          </span>
                          <span className="text-[10px] text-app-muted mt-0.5">{new Date(tenant.period_end!).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-app-muted">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(tenant.id)}
                        disabled={loadingId !== null}
                        className="px-3 py-1.5 bg-app-surface-solid border border-app-border text-app-fg hover:text-indigo-500 hover:border-indigo-500/30 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingId === tenant.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Loading</>
                        ) : (
                          <><span>Details</span><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-app-muted">
                    No subscriptions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalData && (
        <SubscriptionDetailModal
          data={modalData}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  )
}
