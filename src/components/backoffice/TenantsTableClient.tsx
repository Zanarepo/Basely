'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, ShieldBan, Tag, ArrowRight } from 'lucide-react'
import { bulkOverrideTenantsAction } from '@/lib/backoffice/bulk-actions'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

type TenantRow = {
  id: string
  name: string
  created_at: string
  tier: string
  status: string
  seats: number
  churnScore: number
}

export function TenantsTableClient({ tenants }: { tenants: TenantRow[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'tier' | 'status' | 'tag'>('tier')
  const [bulkValue, setBulkValue] = useState('premium')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(tenants.map(t => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleBulkAction = async () => {
    if (!justification.trim() || selectedIds.length === 0) return
    
    setLoading(true)
    try {
      await bulkOverrideTenantsAction(selectedIds, bulkActionType, bulkValue, justification)
      setShowBulkModal(false)
      setSelectedIds([])
      setJustification('')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: 'tier' | 'status' | 'tag') => {
    setBulkActionType(type)
    setShowBulkModal(true)
  }

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-app-surface border border-app-border rounded-2xl shadow-2xl p-3 flex items-center gap-4 text-sm animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold rounded-lg">
            <span className="w-5 h-5 flex items-center justify-center bg-indigo-500 text-white rounded text-xs">{selectedIds.length}</span>
            Selected
          </div>
          <div className="h-6 w-px bg-app-border"></div>
          <div className="flex gap-2">
            <button 
              onClick={() => openModal('tier')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-app-border hover:bg-app-hover flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-app-muted" />
              Change Tier
            </button>
            <button 
              onClick={() => openModal('status')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-app-border hover:bg-app-hover flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldBan className="w-3.5 h-3.5 text-app-muted" />
              Set Status
            </button>
            <button 
              onClick={() => openModal('tag')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-app-border hover:bg-app-hover flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-app-muted" />
              Add Tag
            </button>
          </div>
        </div>
      )}

      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-surface border-b border-app-border">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === tenants.length && tenants.length > 0}
                    className="w-4 h-4 rounded border-app-border text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-2 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Organization Name</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Seats</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Churn Risk</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className={`group hover:bg-app-hover transition-colors ${selectedIds.includes(tenant.id) ? 'bg-indigo-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(tenant.id)}
                      onChange={() => handleSelect(tenant.id)}
                      className="w-4 h-4 rounded border-app-border text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-app-muted-surface flex items-center justify-center font-bold text-app-fg text-xs uppercase border border-app-border">
                        {tenant.name.substring(0,2)}
                      </div>
                      <div>
                        <div className="font-bold text-app-fg text-sm">{tenant.name}</div>
                        <div className="text-[10px] text-app-muted font-mono mt-0.5">{tenant.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      tenant.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                      tenant.tier === 'premium' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-app-bg text-app-muted border border-app-border'
                    }`}>
                      {tenant.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        tenant.status === 'active' ? 'bg-emerald-500' :
                        tenant.status === 'trialing' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-xs font-semibold text-app-fg capitalize">{tenant.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-app-fg">{tenant.seats}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-app-surface-solid rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${tenant.churnScore > 60 ? 'bg-red-500' : tenant.churnScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${tenant.churnScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold ${tenant.churnScore > 60 ? 'text-red-500' : tenant.churnScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {tenant.churnScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <Link 
                        href={`/backoffice/tenants/${tenant.id}`}
                        className="px-3 py-1.5 bg-app-surface border border-app-border text-app-fg hover:bg-app-hover text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>View Detail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-app-muted">
                    No organizations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-app-fg mb-1">
              Bulk {bulkActionType === 'tier' ? 'Tier Change' : bulkActionType === 'status' ? 'Status Update' : 'Tag'}
            </h3>
            <p className="text-sm font-semibold text-app-muted mb-6">
              Applying to {selectedIds.length} organizations.
            </p>
            
            <div className="space-y-4 mb-6">
              {bulkActionType === 'tier' && (
                <div>
                  <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-2">New Tier</label>
                  <EnterpriseSelect 
                    value={bulkValue}
                    onChange={setBulkValue}
                    options={[
                      { label: 'Free', value: 'free' },
                      { label: 'Pro', value: 'pro' },
                      { label: 'Premium', value: 'premium' },
                      { label: 'Enterprise', value: 'enterprise' }
                    ]}
                  />
                </div>
              )}
              {bulkActionType === 'status' && (
                <div>
                  <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-2">New Status</label>
                  <EnterpriseSelect 
                    value={bulkValue}
                    onChange={setBulkValue}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Trialing', value: 'trialing' },
                      { label: 'Suspended', value: 'suspended' },
                    ]}
                  />
                </div>
              )}
              {bulkActionType === 'tag' && (
                <div>
                  <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-2">Tag Name</label>
                  <input 
                    type="text"
                    value={bulkValue}
                    onChange={e => setBulkValue(e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-fg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    placeholder="e.g. beta-tester"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-2 mt-4 text-red-500">Justification (Required)</label>
                <textarea 
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Enter reason for this bulk operation for audit logs..."
                  rows={3}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-fg focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-sm font-bold text-app-muted hover:text-app-fg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={loading || !justification.trim()}
                onClick={handleBulkAction}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
