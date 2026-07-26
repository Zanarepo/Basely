'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { ProcurementEntry } from '@/lib/planning/procurement-actions'

type ProcurementEntryFormProps = {
  entry: ProcurementEntry | null
  costAccounts: any[]
  onClose: () => void
  onSave: (entry: Partial<ProcurementEntry>) => Promise<string | void>
}

export function ProcurementEntryForm({ entry, costAccounts, onClose, onSave }: ProcurementEntryFormProps) {
  const [vendorName, setVendorName] = useState('')
  const [contractScope, setContractScope] = useState('')
  const [cost, setCost] = useState('')
  const [linkedCostAccountId, setLinkedCostAccountId] = useState('')
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (entry) {
      setVendorName(entry.vendor_name || '')
      setContractScope(entry.contract_scope || '')
      setCost(entry.cost ? entry.cost.toString() : '')
      setLinkedCostAccountId(entry.linked_cost_account_id || '')
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorName.trim()) return

    setSaving(true)
    setError(null)
    
    const err = await onSave({
      id: entry?.id,
      vendor_name: vendorName.trim(),
      contract_scope: contractScope.trim(),
      cost: cost ? parseFloat(cost) : null,
      linked_cost_account_id: linkedCostAccountId || null
    })
    
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
        onClick={onClose}
        aria-label="Close form"
      />
      <div className="fixed inset-y-0 right-0 w-96 bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col z-50 animate-fade-in-right">
        <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/50">
          <h3 className="font-bold text-app-fg text-lg">
            {entry ? 'Edit Vendor' : 'Add Vendor'}
          </h3>
          <button onClick={onClose} className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Vendor Name *</label>
              <input
                type="text"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                required
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Contract Scope</label>
              <textarea
                value={contractScope}
                onChange={e => setContractScope(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
                placeholder="Details of what is being procured..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Estimated Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-app-muted text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  disabled={!!linkedCostAccountId}
                  className="w-full bg-app-surface border border-app-border rounded-lg pl-7 pr-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
              {linkedCostAccountId && (
                <p className="text-[11px] text-app-muted mt-1">Cost is managed by the linked cost account.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Link to Cost Account</label>
              <select
                value={linkedCostAccountId}
                onChange={e => {
                  setLinkedCostAccountId(e.target.value)
                  if (e.target.value) setCost('')
                }}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- None --</option>
                {costAccounts.map(ca => (
                  <option key={ca.id} value={ca.id}>
                    {ca.wbs_elements?.code} {ca.wbs_elements?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-app-border bg-app-surface/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !vendorName.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Vendor'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
