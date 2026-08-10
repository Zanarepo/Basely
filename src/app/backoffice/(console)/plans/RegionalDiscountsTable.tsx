'use client'

import React, { useState } from 'react'
import { updateRegionalDiscount } from '@/lib/backoffice/plans-actions'
import { Edit2, Globe, ChevronDown, ChevronUp, X } from 'lucide-react'

export function RegionalDiscountsTable({ discounts }: { discounts: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editMultiplier, setEditMultiplier] = useState<string>('')
  const [editExchangeRate, setEditExchangeRate] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (region: any) => {
    setEditingCode(region.country_code)
    setEditMultiplier(region.discount_multiplier.toString())
    setEditExchangeRate(region.exchange_rate_to_usd.toString())
  }

  const handleCancel = () => {
    setEditingCode(null)
  }

  const handleSave = async () => {
    if (!editingCode) return

    setIsSaving(true)
    const multiplier = parseFloat(editMultiplier)
    const rate = parseFloat(editExchangeRate)
    
    if (isNaN(multiplier) || isNaN(rate)) {
      alert('Please enter valid numbers.')
      setIsSaving(false)
      return
    }

    const res = await updateRegionalDiscount(editingCode, {
      discount_multiplier: multiplier,
      exchange_rate_to_usd: rate
    })

    if (res.success) {
      setEditingCode(null)
    } else {
      alert(`Error updating: ${res.error}`)
    }
    setIsSaving(false)
  }

  const activeEditRegion = discounts.find(r => r.country_code === editingCode)

  return (
    <div className="bg-app-surface-solid rounded-2xl border border-app-border shadow-sm mb-16 overflow-hidden">
      <div 
        className="p-6 border-b border-app-border flex items-center justify-between cursor-pointer hover:bg-app-surface-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-fg">Regional Discounts</h2>
            <p className="text-sm text-app-muted">Manage PPP (Purchasing Power Parity) discounts per country code.</p>
          </div>
        </div>
        <div className="text-app-muted p-2 hover:text-app-fg rounded-lg hover:bg-app-surface-muted transition-colors cursor-pointer">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-app-surface-muted text-xs uppercase text-app-subtle font-bold border-b border-app-border">
              <tr>
                <th className="px-6 py-4">Country / Currency</th>
                <th className="px-6 py-4">Exchange Rate (to 1 USD)</th>
                <th className="px-6 py-4">Multiplier (e.g. 0.4 = 60% off)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-app-muted">
                    No regional discounts configured.
                  </td>
                </tr>
              ) : (
                discounts.map((r) => {
                  return (
                    <tr key={r.country_code} className="group border-b border-app-border last:border-0 hover:bg-app-surface-muted/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-app-fg flex items-center gap-2">
                        <span className="inline-block w-8 text-center bg-gray-100 dark:bg-gray-800 rounded text-gray-500 text-xs py-0.5 border border-gray-200 dark:border-gray-700">{r.country_code}</span>
                        {r.currency}
                      </td>
                      <td className="px-6 py-4 text-app-fg">
                        {r.exchange_rate_to_usd}
                      </td>
                      <td className="px-6 py-4 text-app-fg">
                        <span className={`font-mono ${r.discount_multiplier < 1 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                          {r.discount_multiplier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(r)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-app-subtle hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal Popup */}
      {editingCode && activeEditRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-app-surface-solid border border-app-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-app-border">
              <div>
                <h3 className="text-lg font-bold text-app-fg">Edit Discount: {activeEditRegion.country_code}</h3>
                <p className="text-xs text-app-muted">Update local pricing parameters</p>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface-muted transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1">Exchange Rate ({activeEditRegion.currency} to 1 USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editExchangeRate} 
                  onChange={(e) => setEditExchangeRate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-app-fg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1">Discount Multiplier</label>
                <p className="text-xs text-app-muted mb-2">e.g. 1 = standard price. 0.4 = 60% discount.</p>
                <input 
                  type="number" 
                  step="0.01"
                  value={editMultiplier} 
                  onChange={(e) => setEditMultiplier(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-app-fg"
                />
              </div>
            </div>
            <div className="p-5 border-t border-app-border bg-app-surface flex justify-end gap-3">
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold text-app-fg hover:bg-app-surface-muted rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
