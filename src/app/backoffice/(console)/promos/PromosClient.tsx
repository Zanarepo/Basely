'use client'

import { useState } from 'react'
import { Tag, Plus, Edit, Trash2, ShieldAlert, Loader2, X } from 'lucide-react'
import { togglePromotion, createPromotion, editPromotion, deletePromotion } from '@/lib/backoffice/promos-actions'
import { OrganizationSelector } from './OrganizationSelector'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

type Promotion = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  duration: 'once' | 'repeating' | 'forever'
  duration_in_months: number | null
  max_uses: number | null
  current_uses: number
  valid_until: string | null
  is_active: boolean
  promotion_organizations?: { organizations: { id: string, name: string } }[]
  creator: { email: string } | null
  created_at: string
}

export function PromosClient({ initialPromotions, isSuperadmin }: { initialPromotions: any[], isSuperadmin: boolean }) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!isSuperadmin) return
    setLoadingId(`toggle-${id}`)
    const res = await togglePromotion(id, !currentStatus)
    if (res.success) {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
    } else {
      alert(`Failed to toggle: ${res.error}`)
    }
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!isSuperadmin) return
    if (!confirm('Are you sure you want to delete this promotion? This cannot be undone.')) return
    
    setLoadingId(`delete-${id}`)
    const res = await deletePromotion(id)
    if (res.success) {
      setPromotions(prev => prev.filter(p => p.id !== id))
    } else {
      alert(`Failed to delete: ${res.error}`)
    }
    setLoadingId(null)
  }

  const handleSave = (savedPromo: Promotion) => {
    if (editingPromo) {
      setPromotions(prev => prev.map(p => p.id === savedPromo.id ? savedPromo : p))
    } else {
      setPromotions([savedPromo, ...promotions])
    }
    setIsModalOpen(false)
    setEditingPromo(null)
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-app-border">
        <h2 className="text-sm font-semibold text-app-fg">All Campaigns</h2>
        {isSuperadmin ? (
          <button
            onClick={() => {
              setEditingPromo(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Promo
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-app-surface-solid rounded-lg text-sm font-medium text-app-muted border border-app-border">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Superadmin only
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-app-border bg-app-surface-solid/50">
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider">Code</th>
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider">Discount</th>
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider">Duration</th>
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider">Uses</th>
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-medium text-app-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-app-muted">
                  No promotions found.
                </td>
              </tr>
            ) : promotions.map((promo) => {
              const orgLinks = promo.promotion_organizations || []
              return (
                <tr key={promo.id} className="group hover:bg-app-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-app-fg">{promo.code}</span>
                    </div>
                    {orgLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {orgLinks.map(link => (
                          <span key={link.organizations.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {link.organizations.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-app-fg">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`} OFF
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-app-muted capitalize">
                      {promo.duration} {promo.duration === 'repeating' ? `(${promo.duration_in_months} mos)` : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-app-muted">
                      {promo.current_uses} {promo.max_uses ? `/ ${promo.max_uses}` : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      promo.is_active 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-app-surface-solid text-app-muted border border-app-border'
                    }`}>
                      {promo.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {isSuperadmin && (
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <button
                          onClick={() => handleToggle(promo.id, promo.is_active)}
                          disabled={loadingId === `toggle-${promo.id}`}
                          className="text-xs font-medium text-app-muted hover:text-app-fg transition-colors cursor-pointer"
                        >
                          {loadingId === `toggle-${promo.id}` ? '...' : promo.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPromo(promo)
                            setIsModalOpen(true)
                          }}
                          className="text-app-muted hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          disabled={loadingId === `delete-${promo.id}`}
                          className="text-app-muted hover:text-red-500 transition-colors cursor-pointer"
                        >
                          {loadingId === `delete-${promo.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PromoModal 
          promo={editingPromo} 
          onClose={() => {
            setIsModalOpen(false)
            setEditingPromo(null)
          }} 
          onSave={handleSave} 
        />
      )}
    </div>
  )
}

function PromoModal({ promo, onClose, onSave }: { promo: Promotion | null, onClose: () => void, onSave: (promo: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrgs, setSelectedOrgs] = useState<{id: string, name: string}[]>(
    promo?.promotion_organizations ? promo.promotion_organizations.map(l => l.organizations) : []
  )
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>(promo?.discount_type || 'percentage')
  const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>(promo?.duration || 'once')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data: any = {
      code: formData.get('code') as string,
      discount_type: discountType,
      discount_value: Number(formData.get('discount_value')),
      duration: duration,
      duration_in_months: formData.get('duration_in_months') ? Number(formData.get('duration_in_months')) : undefined,
      max_uses: formData.get('max_uses') ? Number(formData.get('max_uses')) : undefined,
      organization_ids: selectedOrgs.map(o => o.id)
    }

    if (promo) {
      const res = await editPromotion(promo.id, data)
      if (res.success) {
        // Mock updated promo for UI
        onSave({ 
          ...promo, 
          ...data, 
          promotion_organizations: selectedOrgs.map(o => ({ organizations: o })) 
        })
      } else {
        setError(res.error || 'Failed to update promotion')
        setLoading(false)
      }
    } else {
      const res = await createPromotion(data)
      if (res.success) {
        onSave({
          ...res.data,
          promotion_organizations: selectedOrgs.map(o => ({ organizations: o }))
        })
      } else {
        setError(res.error || 'Failed to create promotion')
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h3 className="font-semibold text-app-fg">{promo ? 'Edit Promo' : 'Create New Promo'}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-app-muted hover:text-app-fg hover:bg-app-hover cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-app-muted mb-1">Promo Code</label>
            <input 
              required
              name="code"
              defaultValue={promo?.code}
              placeholder="e.g. SUMMER50"
              className="w-full bg-app-surface-solid border border-app-border rounded-lg px-3 py-2 text-app-fg text-sm focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-muted mb-1">Type</label>
              <EnterpriseSelect 
                value={discountType}
                onChange={(val) => setDiscountType(val)}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed_amount', label: 'Fixed Amount ($)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted mb-1">Value</label>
              <input 
                required
                type="number"
                name="discount_value"
                defaultValue={promo?.discount_value}
                min="1"
                placeholder="e.g. 50"
                className="w-full bg-app-surface-solid border border-app-border rounded-lg px-3 py-2 text-app-fg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-muted mb-1">Duration</label>
              <EnterpriseSelect 
                value={duration}
                onChange={(val) => setDuration(val)}
                options={[
                  { value: 'once', label: 'Once' },
                  { value: 'repeating', label: 'Repeating (Months)' },
                  { value: 'forever', label: 'Forever' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app-muted mb-1">Months (if repeating)</label>
              <input 
                type="number"
                name="duration_in_months"
                defaultValue={promo?.duration_in_months || ''}
                min="1"
                placeholder="e.g. 3"
                className="w-full bg-app-surface-solid border border-app-border rounded-lg px-3 py-2 text-app-fg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-muted mb-1">Max Uses (Optional)</label>
            <input 
              type="number"
              name="max_uses"
              defaultValue={promo?.max_uses || ''}
              min="1"
              placeholder="e.g. 100"
              className="w-full bg-app-surface-solid border border-app-border rounded-lg px-3 py-2 text-app-fg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-muted mb-1">Target Organizations (Leave empty for everyone)</label>
            <OrganizationSelector 
              selectedOrgs={selectedOrgs}
              onChange={setSelectedOrgs}
            />
          </div>

          <div className="pt-2 border-t border-app-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {promo ? 'Save Changes' : 'Create Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
