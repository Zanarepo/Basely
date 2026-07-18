'use client'

import { useState, useMemo } from 'react'
import { Save, AlertCircle, RefreshCw, Search } from 'lucide-react'
import type { WbsCostData, EstimationMethod, ResourceRate } from '@/lib/cost/types'
import { saveCostEstimate, reconcileBottomUpEstimate } from '@/lib/cost/actions'
import ActivityAssignmentSheet from './ActivityAssignmentSheet'
import { formatCurrency } from '@/lib/utils'

type Props = {
  projectId: string
  wbsCostData: WbsCostData[]
  resourceRates: ResourceRate[]
  projectCurrency: string
  globalOverhead: number
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function CostEstimationView({ 
  projectId, wbsCostData, resourceRates, projectCurrency, globalOverhead, hasEditAccess, onDataChange 
}: Props) {
  const [selectedWbsId, setSelectedWbsId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form State
  const [method, setMethod] = useState<EstimationMethod>('bottom_up')
  const [total, setTotal] = useState<string>('')
  const [rate, setRate] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [note, setNote] = useState<string>('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const workPackages = wbsCostData.filter(w => w.isWorkPackage)
  
  const filteredWorkPackages = useMemo(() => {
    if (!searchTerm.trim()) return workPackages;
    const lowerSearch = searchTerm.toLowerCase();
    return workPackages.filter(wp => 
      wp.wbsCode.toLowerCase().includes(lowerSearch) || 
      wp.wbsName.toLowerCase().includes(lowerSearch)
    );
  }, [workPackages, searchTerm]);

  const selectedWp = workPackages.find(w => w.wbsId === selectedWbsId)

  const handleSelect = (wp: WbsCostData) => {
    setSelectedWbsId(wp.wbsId)
    setError(null)
    if (wp.costAccount) {
      setMethod(wp.costAccount.estimation_method)
      setTotal(wp.costAccount.budgeted_total.toString())
      setRate(wp.costAccount.rate?.toString() || '')
      setQuantity(wp.costAccount.quantity?.toString() || '')
      setNote(wp.costAccount.analogous_reference_note || '')
    } else {
      setMethod('bottom_up')
      setTotal('')
      setRate('')
      setQuantity('')
      setNote('')
    }
  }

  const handleSave = async () => {
    if (!selectedWbsId) return
    setIsSaving(true)
    setError(null)

    try {
      let finalTotal = parseFloat(total) || 0

      // If parametric, calculate total from rate and quantity
      if (method === 'parametric') {
        const r = parseFloat(rate) || 0
        const q = parseFloat(quantity) || 0
        finalTotal = r * q
      }

      await saveCostEstimate(selectedWbsId, {
        estimation_method: method,
        budgeted_total: finalTotal,
        rate: method === 'parametric' ? parseFloat(rate) : null,
        quantity: method === 'parametric' ? parseFloat(quantity) : null,
        analogous_reference_note: method === 'analogous' ? note : null,
        currency: projectCurrency
      })

      // Update local form state for parametric total reflection
      if (method === 'parametric') {
        setTotal(finalTotal.toString())
      }

      onDataChange() // refresh global cost data
    } catch (err: any) {
      setError(err.message || 'Failed to save estimate')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReconcile = async () => {
    if (!selectedWp?.costAccount) return
    try {
      setIsSaving(true)
      await reconcileBottomUpEstimate(selectedWp.costAccount.id, selectedWp.costAccount.resource_calculated_total)
      setTotal(selectedWp.costAccount.resource_calculated_total.toString())
      onDataChange()
    } catch (err: any) {
      setError(err.message || 'Failed to reconcile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px]">
      {/* Left List: Work Packages */}
      <div className="w-full lg:w-1/3 h-[40vh] lg:h-full bg-app-surface border border-app-border rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="shrink-0 p-4 border-b border-app-border bg-app-muted-surface">
          <h3 className="font-bold text-app-fg mb-3">Work Packages</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-app-fg"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredWorkPackages.length === 0 ? (
            <p className="text-center text-app-muted text-sm mt-8">
              {searchTerm ? 'No packages match your search.' : 'No work packages found. Create them in the WBS tab first.'}
            </p>
          ) : (
            filteredWorkPackages.map(wp => (
              <button
                key={wp.wbsId}
                onClick={() => handleSelect(wp)}
                className={`w-full text-left p-3 mb-2 rounded-xl transition-all duration-200 border cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                  selectedWbsId === wp.wbsId
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                    : 'bg-app-surface border-transparent hover:bg-app-hover hover:border-app-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-app-fg">{wp.wbsCode} - {wp.wbsName}</span>
                  <div className="flex flex-col items-end">
                    {wp.costAccount ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(wp.costAccount.budgeted_total)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-app-subtle italic">Unestimated</span>
                    )}
                    {wp.actualCosts && wp.actualCosts.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                        Act: {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(wp.actualCosts.reduce((a, c) => a + c.amount, 0))}
                      </span>
                    )}
                  </div>
                </div>
                {wp.costAccount && (
                  <div className="mt-1 flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {wp.costAccount.estimation_method.replace('_', '-')}
                    </span>
                    {(wp.costAccount.estimation_method === 'bottom_up' 
                      ? wp.costAccount.reconciliation_status === 'pending' 
                      : wp.resourceAssignments?.length === 0) && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        Pending Resources
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Detail: Estimation Form */}
      <div className="w-full lg:w-2/3 bg-app-surface border border-app-border rounded-3xl flex flex-col shadow-sm">
        {!selectedWp ? (
          <div className="flex-1 flex flex-col items-center justify-center text-app-subtle">
            <DollarSign className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a Work Package to define its cost estimate</p>
          </div>
        ) : (
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-app-fg">Cost Estimate</h2>
              {hasEditAccess && (
                <button
                  onClick={() => setIsSheetOpen(true)}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:scale-105 hover:shadow-sm transition-all duration-200"
                >
                  Assign Resources
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Estimation Method</label>
                <div className="flex gap-2 p-1 bg-app-muted-surface rounded-xl inline-flex">
                  <button
                    onClick={() => setMethod('bottom_up')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 ${method === 'bottom_up' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-app-subtle hover:text-app-fg hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Bottom-Up
                  </button>
                  <button
                    onClick={() => setMethod('parametric')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 ${method === 'parametric' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-app-subtle hover:text-app-fg hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Parametric
                  </button>
                  <button
                    onClick={() => setMethod('analogous')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 ${method === 'analogous' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-app-subtle hover:text-app-fg hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Analogous
                  </button>
                </div>
              </div>

              <div className="h-px bg-app-border" />

              {/* Dynamic Form */}
              {method === 'bottom_up' && (
                <div className="space-y-4">
                  {selectedWp.costAccount?.reconciliation_status === 'pending' && selectedWp.costAccount.resource_calculated_total > 0 && selectedWp.costAccount.resource_calculated_total !== selectedWp.costAccount.budgeted_total ? (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Variance Detected</h4>
                        <p className="text-xs text-red-700 dark:text-red-500/80 mt-1 mb-3">
                          The manual placeholder estimate ({formatCurrency(selectedWp.costAccount.budgeted_total, projectCurrency)}) differs from the newly calculated resource total ({formatCurrency(selectedWp.costAccount.resource_calculated_total, projectCurrency)}).
                        </p>
                        {hasEditAccess && (
                          <button
                            onClick={handleReconcile}
                            disabled={isSaving}
                            className="text-xs font-semibold px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          >
                            Confirm & Reconcile to {formatCurrency(selectedWp.costAccount.resource_calculated_total, projectCurrency)}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Placeholder Estimate</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">
                          Bottom-up estimates entered here are flagged as "Pending Reconciliation". Assigning actual resources to this activity will calculate the true cost and flag any variance against this placeholder.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Total Budget ({projectCurrency})</label>
                    <input
                      type="number"
                      disabled={!hasEditAccess || (selectedWp.costAccount?.reconciliation_status === 'reconciled')}
                      value={total}
                      onChange={e => setTotal(e.target.value)}
                      className="w-full md:w-1/2 px-4 py-3 bg-app-input border border-app-border rounded-xl text-app-fg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      placeholder="0.00"
                    />
                    {selectedWp.costAccount?.reconciliation_status === 'reconciled' && (
                      <p className="text-xs text-green-500 mt-2 font-medium">Reconciled with resource assignments.</p>
                    )}
                  </div>
                </div>
              )}

              {method === 'parametric' && (
                <div className="space-y-4">
                  <p className="text-sm text-app-subtle">
                    Define a quantifiable rate and quantity. The total budget is automatically calculated.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Rate ({projectCurrency} per unit)</label>
                      <input
                        type="number"
                        disabled={!hasEditAccess}
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                        className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. 150"
                      />
                    </div>
                    <div className="flex items-center justify-center pt-6 text-app-subtle">
                      ×
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Quantity</label>
                      <input
                        type="number"
                        disabled={!hasEditAccess}
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. 40"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-app-border">
                    <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Calculated Total</label>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format((parseFloat(rate) || 0) * (parseFloat(quantity) || 0))}
                    </div>
                  </div>
                </div>
              )}

              {method === 'analogous' && (
                <div className="space-y-4">
                  <p className="text-sm text-app-subtle">
                    Estimate based on historical data or comparable past projects.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Total Budget ({projectCurrency})</label>
                    <input
                      type="number"
                      disabled={!hasEditAccess}
                      value={total}
                      onChange={e => setTotal(e.target.value)}
                      className="w-full md:w-1/2 px-4 py-3 bg-app-input border border-app-border rounded-xl text-app-fg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Historical Reference Note (Optional)</label>
                    <textarea
                      disabled={!hasEditAccess}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                      placeholder="e.g. Based on actuals from Project Phoenix Phase 1..."
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Error & Save */}
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-app-border">
              <div className="text-red-500 text-sm font-semibold">{error}</div>
              {hasEditAccess && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Estimate
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isSheetOpen && selectedWp && (
        <ActivityAssignmentSheet
          wbsElementId={selectedWp.wbsId}
          wbsName={selectedWp.wbsName}
          resourceRates={resourceRates}
          existingAssignments={selectedWp.resourceAssignments || []}
          projectCurrency={projectCurrency}
          globalOverhead={globalOverhead}
          onClose={() => setIsSheetOpen(false)}
          onDataChange={onDataChange}
        />
      )}
    </div>
  )
}
import { DollarSign } from 'lucide-react'
