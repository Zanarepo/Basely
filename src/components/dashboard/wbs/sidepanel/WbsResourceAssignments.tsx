'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, X, Loader2, DollarSign, Layers } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { assignResourceToActivity, deleteResourceAssignment } from '@/lib/cost/actions'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import type { ResourceRate, ActivityResourceAssignment } from '@/lib/cost/types'

interface WbsResourceAssignmentsProps {
  wbsElementId: string
  wbsName: string
  projectId: string
  hasEditAccess: boolean
  currency?: string
  onAssignmentsChanged?: () => void
}

export function WbsResourceAssignments({
  wbsElementId,
  wbsName,
  projectId,
  hasEditAccess,
  currency = 'USD',
  onAssignmentsChanged
}: WbsResourceAssignmentsProps) {
  const [loading, setLoading] = useState(true)
  const [resourceRates, setResourceRates] = useState<ResourceRate[]>([])
  const [assignments, setAssignments] = useState<ActivityResourceAssignment[]>([])
  const [globalOverhead, setGlobalOverhead] = useState<number>(0)
  
  const [isAdding, setIsAdding] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // 1. Fetch project global overhead
      const { data: project } = await supabase
        .from('projects')
        .select('global_overhead_percentage')
        .eq('id', projectId)
        .single()
      
      setGlobalOverhead(project?.global_overhead_percentage || 0)

      // 2. Fetch available resource rates
      const { data: rates, error: rErr } = await supabase
        .from('resource_rates')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (rErr) throw rErr
      setResourceRates(rates || [])

      // 3. Fetch existing assignments for this WBS element
      const { data: assigns, error: aErr } = await supabase
        .from('activity_resource_assignments')
        .select('*, resource:resource_rates(*)')
        .eq('wbs_element_id', wbsElementId)

      if (aErr) throw aErr
      setAssignments(assigns || [])
    } catch (err: any) {
      console.error('Error fetching resource assignments:', err)
      setError(err.message || 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [projectId, wbsElementId])

  useEffect(() => {
    if (wbsElementId && projectId) {
      fetchData()
    }
  }, [wbsElementId, projectId, fetchData])

  const directCost = assignments.reduce((acc, a) => acc + (a.calculated_cost || 0), 0)
  const overheadAmount = directCost * (globalOverhead / 100)
  const totalCost = directCost + overheadAmount

  const handleAdd = async () => {
    if (!selectedRateId || quantity <= 0) return
    setIsSaving(true)
    setError(null)

    try {
      await assignResourceToActivity(wbsElementId, selectedRateId, quantity)
      await fetchData()
      if (onAssignmentsChanged) onAssignmentsChanged()
      setIsAdding(false)
      setSelectedRateId('')
      setQuantity(0)
    } catch (err: any) {
      console.error('Failed to assign resource:', err)
      setError(err.message || 'Failed to assign resource.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    setError(null)

    try {
      await deleteResourceAssignment(id)
      await fetchData()
      if (onAssignmentsChanged) onAssignmentsChanged()
    } catch (err: any) {
      console.error('Failed to delete assignment:', err)
      setError(err.message || 'Failed to delete assignment.')
    } finally {
      setIsSaving(false)
    }
  }

  const getUnitLabel = (rateId: string) => {
    const rate = resourceRates.find(r => r.id === rateId)
    return rate ? rate.unit : ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-app-muted text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-violet-500" />
        Loading resources...
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-2">
      {error && (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-900/40">
          {error}
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-app-bg border border-app-border rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-app-muted">Direct Resource Cost</span>
          <span className="font-semibold text-app-fg">
            <CurrencyDisplay amount={directCost} currency={currency} compactThreshold={1000} />
          </span>
        </div>
        {globalOverhead > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-app-muted">Overhead ({globalOverhead}%)</span>
            <span className="font-medium text-violet-600 dark:text-violet-400">
              <CurrencyDisplay amount={overheadAmount} currency={currency} compactThreshold={1000} />
            </span>
          </div>
        )}
        <div className="pt-2 border-t border-app-border flex justify-between items-center text-xs">
          <span className="font-bold text-app-fg">Total Calculated Cost</span>
          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
            <CurrencyDisplay amount={totalCost} currency={currency} compactThreshold={1000} />
          </span>
        </div>
      </div>

      {/* Assigned Resources List Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-violet-500" />
          Assigned Resources ({assignments.length})
        </h4>
        {hasEditAccess && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Resource
          </button>
        )}
      </div>

      {/* Existing Resource Assignments */}
      {assignments.length === 0 && !isAdding ? (
        <div className="text-center py-5 border border-dashed border-app-border rounded-xl bg-app-surface/50">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-app-muted opacity-40" />
          <p className="text-xs text-app-muted">No resources assigned to this package yet.</p>
          {hasEditAccess && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-2 text-xs font-semibold text-violet-500 hover:underline cursor-pointer"
            >
              + Assign first resource
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="group flex items-center justify-between p-2.5 bg-app-surface border border-app-border rounded-xl text-xs hover:border-violet-500/30 transition-all"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-app-fg flex items-center gap-1.5">
                  {a.resource?.name || 'Assigned Resource'}
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-normal uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {a.resource?.type || 'cost'}
                  </span>
                </div>
                <div className="text-[11px] text-app-muted">
                  <CurrencyDisplay amount={a.resource?.rate || 0} currency={currency} compactThreshold={1000} />/{a.resource?.unit || 'unit'} × {a.quantity} {a.resource?.unit || 'unit'}s
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-app-fg">
                  <CurrencyDisplay amount={a.calculated_cost} currency={currency} compactThreshold={1000} />
                </span>
                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={isSaving}
                    className="p-1 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Resource Inline Form */}
      {isAdding && (
        <div className="p-3.5 bg-violet-500/5 border border-violet-500/25 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-violet-700 dark:text-violet-300">
            <span>Assign Resource Rate</span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setSelectedRateId('')
                setQuantity(0)
              }}
              className="text-app-muted hover:text-app-fg p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-app-muted mb-1">Select Resource</label>
            {resourceRates.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                No resource rates defined in project yet. Create rates on the Budget/Cost page.
              </p>
            ) : (
              <EnterpriseSelect
                value={selectedRateId}
                onChange={(val) => setSelectedRateId(val)}
                placeholder="Choose resource rate..."
                size="sm"
                options={[
                  { value: '', label: 'Select a resource rate...' },
                  ...resourceRates.map((r) => ({
                    value: r.id,
                    label: `${r.name} (${currency || '$'}${r.rate.toLocaleString()}/${r.unit})`,
                    description: `Type: ${r.type} | Rate: ${currency || '$'}${r.rate} per ${r.unit}`
                  }))
                ]}
              />
            )}
          </div>

          {selectedRateId && (
            <div className="flex items-end gap-3 pt-1">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-app-muted mb-1">
                  Quantity ({getUnitLabel(selectedRateId)}s)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 40"
                  className="w-full bg-app-input border border-app-border rounded-lg px-3 py-1.5 text-xs text-app-fg focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex items-center gap-1.5 pb-0.5">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isSaving || !selectedRateId || quantity <= 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Assign
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
