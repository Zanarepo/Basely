'use client'

import { useState, useEffect, useCallback } from 'react'
import { getReleaseGtm, upsertRolloutPhase, upsertFeatureFlag, toggleFeatureFlag, deleteRolloutPhase, deleteFeatureFlag } from '@/lib/product-gtm/actions'
import { Loader2, Plus, Flag, Trash2, Rocket } from 'lucide-react'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

export function GtmRolloutPanel({ releaseId }: { releaseId: string }) {
  const [phases, setPhases] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingPhase, setIsAddingPhase] = useState(false)
  const [isAddingFlag, setIsAddingFlag] = useState(false)
  
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), type, message }])
  }, [])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const { success, phases, flags, error } = await getReleaseGtm(releaseId)
      if (success) {
        setPhases(phases || [])
        setFlags(flags || [])
      } else {
        showToast('Failed to load GTM data: ' + error, 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [releaseId, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddPhase = async () => {
    setIsAddingPhase(true)
    const { success, error } = await upsertRolloutPhase({
      release_id: releaseId,
      phase_name: 'New Phase (e.g. Beta)',
      target_percentage: 10,
      status: 'planned'
    })
    if (success) {
      showToast('Phase added', 'success')
      loadData()
    } else {
      showToast('Error: ' + error, 'error')
    }
    setIsAddingPhase(false)
  }

  const handleAddFlag = async () => {
    setIsAddingFlag(true)
    const { success, error } = await upsertFeatureFlag({
      release_id: releaseId,
      flag_key: 'FEATURE_NEW_TOGGLE_' + Math.floor(Math.random() * 1000),
      is_enabled: false
    })
    if (success) {
      showToast('Flag added', 'success')
      loadData()
    } else {
      showToast('Error: ' + error, 'error')
    }
    setIsAddingFlag(false)
  }

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="space-y-8">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      
      {/* Rollout Phases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Targeted Rollout Phases</h3>
              <p className="text-xs text-slate-500">Manage release exposure percentage to users.</p>
            </div>
          </div>
          <button
            onClick={handleAddPhase}
            disabled={isAddingPhase}
            className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            {isAddingPhase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Phase
          </button>
        </div>
        
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Phase Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Target %</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-right text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {phases.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">No rollout phases defined.</td></tr>
              )}
              {phases.map((phase) => (
                <tr key={phase.id}>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      defaultValue={phase.phase_name} 
                      className="bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white font-medium"
                      onBlur={(e) => {
                        if(e.target.value !== phase.phase_name) {
                          upsertRolloutPhase({ id: phase.id, release_id: releaseId, phase_name: e.target.value }).then(() => loadData())
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      defaultValue={phase.target_percentage} 
                      className="bg-transparent border-none focus:ring-0 p-0 w-16 text-slate-900 dark:text-white"
                      onBlur={(e) => {
                        if(Number(e.target.value) !== phase.target_percentage) {
                          upsertRolloutPhase({ id: phase.id, release_id: releaseId, target_percentage: Number(e.target.value) }).then(() => loadData())
                        }
                      }}
                    />%
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <EnterpriseSelect
                      value={phase.status}
                      onChange={(val) => {
                        upsertRolloutPhase({ id: phase.id, release_id: releaseId, status: val }).then(() => loadData())
                      }}
                      size="sm"
                      options={[
                        { value: 'planned', label: '📅 Planned' },
                        { value: 'active', label: '🚀 Active' },
                        { value: 'complete', label: '✅ Complete' },
                      ]}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={async () => {
                        await deleteRolloutPhase(phase.id)
                        loadData()
                      }}
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Flags */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Feature Flags</h3>
              <p className="text-xs text-slate-500">Toggle code paths dynamically during this release.</p>
            </div>
          </div>
          <button
            onClick={handleAddFlag}
            disabled={isAddingFlag}
            className="cursor-pointer text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {isAddingFlag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Flag
          </button>
        </div>
        
        <div className="space-y-3">
          {flags.length === 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center text-slate-500 italic text-sm">
              No feature flags registered for this release.
            </div>
          )}
          {flags.map(flag => (
            <div key={flag.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900">
              <div>
                <input 
                  type="text" 
                  defaultValue={flag.flag_key} 
                  className="bg-transparent border-none focus:ring-0 p-0 font-mono text-sm font-semibold text-slate-900 dark:text-white mb-1"
                  onBlur={(e) => {
                    if(e.target.value !== flag.flag_key) {
                      upsertFeatureFlag({ id: flag.id, release_id: releaseId, flag_key: e.target.value }).then(() => loadData())
                    }
                  }}
                />
                <input 
                  type="text"
                  placeholder="Flag description..."
                  defaultValue={flag.description || ''} 
                  className="bg-transparent border-none focus:ring-0 p-0 text-xs text-slate-500 w-full block"
                  onBlur={(e) => {
                    if(e.target.value !== flag.description) {
                      upsertFeatureFlag({ id: flag.id, release_id: releaseId, description: e.target.value }).then(() => loadData())
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={flag.is_enabled}
                  onClick={async () => {
                    const checked = !flag.is_enabled
                    const { success } = await toggleFeatureFlag(flag.id, checked)
                    if (success) {
                      showToast(`Flag ${checked ? 'enabled' : 'disabled'}`, 'success')
                      loadData()
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    flag.is_enabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      flag.is_enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <button 
                  onClick={async () => {
                    await deleteFeatureFlag(flag.id)
                    loadData()
                  }}
                  className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
