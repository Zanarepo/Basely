'use client'

import { useState } from 'react'
import { updatePlanFeature, updatePlanLimit, updatePlanDetails } from '@/lib/backoffice/plans-actions'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type TierFeature = {
  id: string
  feature_key: string
  display_name: string
  module: string
  enabled: boolean
}

type TierLimit = {
  id: string
  limit_key: string
  max_value: number
}

type PlanEditorProps = {
  tierId: string
  initialTier: any
  features: TierFeature[]
  limits: TierLimit[]
}

export function PlanEditor({ tierId, initialTier, features, limits }: PlanEditorProps) {
  const router = useRouter()
  
  // Basic Details State
  const [price, setPrice] = useState(initialTier.price_per_seat)
  const [desc, setDesc] = useState(initialTier.description || '')
  const [savingDetails, setSavingDetails] = useState(false)

  // Optimistic Features State
  const [localFeatures, setLocalFeatures] = useState<TierFeature[]>(features)

  // Features State (group by module)
  const groupedFeatures = localFeatures.reduce((acc, f) => {
    if (!acc[f.module]) acc[f.module] = []
    acc[f.module].push(f)
    return acc
  }, {} as Record<string, TierFeature[]>)

  const handleToggleFeature = async (featureKey: string, currentVal: boolean) => {
    // Optimistic UI update
    setLocalFeatures(prev => 
      prev.map(f => f.feature_key === featureKey ? { ...f, enabled: !currentVal } : f)
    )
    
    // Background update
    await updatePlanFeature(tierId, featureKey, !currentVal)
    router.refresh()
  }

  const handleUpdateLimit = async (limitKey: string, val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) return
    await updatePlanLimit(tierId, limitKey, num)
    router.refresh()
  }

  const handleSaveDetails = async () => {
    setSavingDetails(true)
    await updatePlanDetails(tierId, { price_per_seat: price, description: desc })
    setSavingDetails(false)
    router.refresh()
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Basic Settings */}
      <div className="bg-app-surface-solid rounded-2xl border border-app-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-app-fg mb-4">Plan Settings</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-app-muted mb-2">Price per Seat (USD)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2 text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-muted mb-2">Description</label>
            <input 
              type="text" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2 text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSaveDetails}
            disabled={savingDetails || (price === initialTier.price_per_seat && desc === initialTier.description)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-app-surface-solid rounded-2xl border border-app-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-app-fg mb-4">Usage Limits</h2>
        <p className="text-sm text-app-muted mb-6">Set hard limits for resources. Use -1 for unlimited.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {limits.map((l) => (
            <div key={l.id}>
              <label className="block text-sm font-medium text-app-muted mb-2 capitalize">{l.limit_key.replace(/_/g, ' ')}</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  defaultValue={l.max_value}
                  onBlur={(e) => handleUpdateLimit(l.limit_key, e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2 text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="bg-app-surface-solid rounded-2xl border border-app-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-app-border">
          <h2 className="text-xl font-bold text-app-fg mb-1">Feature Matrix</h2>
          <p className="text-sm text-app-muted">Toggle specific modules and capabilities for this tier.</p>
        </div>

        <div className="divide-y divide-app-border">
          {Object.entries(groupedFeatures).map(([moduleName, modFeatures]) => (
            <div key={moduleName} className="p-6">
              <h3 className="text-lg font-semibold text-app-fg mb-4 text-indigo-500">{moduleName}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {modFeatures.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-app-bg hover:border-indigo-500/30 transition-colors">
                    <div>
                      <p className="font-medium text-app-fg text-sm">{f.display_name}</p>
                      <p className="text-xs text-app-subtle font-mono mt-1">{f.feature_key}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={f.enabled}
                        onChange={() => handleToggleFeature(f.feature_key, f.enabled)}
                      />
                      <div className="w-11 h-6 bg-app-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
