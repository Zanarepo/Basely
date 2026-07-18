'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { ResourceRate, ActivityResourceAssignment } from '@/lib/cost/types'
import { assignResourceToActivity, deleteResourceAssignment } from '@/lib/cost/actions'
import { formatCurrency } from '@/lib/utils'

interface ActivityAssignmentSheetProps {
  wbsElementId: string
  wbsName: string
  resourceRates: ResourceRate[]
  existingAssignments: ActivityResourceAssignment[]
  projectCurrency: string
  globalOverhead: number
  onClose: () => void
  onDataChange: () => void
}

export default function ActivityAssignmentSheet({
  wbsElementId,
  wbsName,
  resourceRates,
  existingAssignments,
  projectCurrency,
  globalOverhead,
  onClose,
  onDataChange
}: ActivityAssignmentSheetProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(0)

  const directCost = existingAssignments.reduce((acc, a) => acc + (a.calculated_cost || 0), 0)
  const overheadAmount = directCost * (globalOverhead / 100)
  const totalCost = directCost + overheadAmount

  const handleAdd = async () => {
    if (!selectedRateId || quantity <= 0) return
    try {
      await assignResourceToActivity(wbsElementId, selectedRateId, quantity)
      onDataChange()
      setIsAdding(false)
      setSelectedRateId('')
      setQuantity(0)
    } catch (error) {
      console.error('Failed to assign resource:', error)
      alert('Failed to assign resource.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteResourceAssignment(id)
      onDataChange()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      alert('Failed to delete assignment.')
    }
  }

  const getUnitLabel = (rateId: string) => {
    const rate = resourceRates.find(r => r.id === rateId)
    return rate ? rate.unit : ''
  }

  return (
    <>
      {/* Backdrop overlay for click-outside to close */}
      <div 
        className="fixed inset-0 bg-black/5 dark:bg-black/20 z-40 animate-in fade-in duration-200 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Side Sheet Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] backdrop-blur-xl bg-app-surface border-l border-app-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right-8 duration-200">
      <div className="flex items-center justify-between p-6 border-b border-app-border">
        <div>
          <h2 className="text-lg font-bold text-app-fg">Resource Assignments</h2>
          <p className="text-sm text-app-muted truncate max-w-[300px]">{wbsName}</p>
        </div>
        <button onClick={onClose} className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Card */}
        <div className="bg-app-bg border border-app-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-app-muted">Direct Cost</span>
            <span className="font-medium text-app-fg">{formatCurrency(directCost, projectCurrency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-app-muted">Overhead ({globalOverhead}%)</span>
            <span className="font-medium text-app-fg">{formatCurrency(overheadAmount, projectCurrency)}</span>
          </div>
          <div className="pt-3 border-t border-app-border flex justify-between">
            <span className="font-semibold text-app-fg">Total Calculated Cost</span>
            <span className="font-bold text-indigo-400">{formatCurrency(totalCost, projectCurrency)}</span>
          </div>
        </div>

        {/* Existing Assignments */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-app-fg flex items-center justify-between">
            Assigned Resources
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </h3>

          {existingAssignments.map(a => (
            <div key={a.id} className="group flex items-center justify-between p-3 bg-app-bg border border-app-border rounded-lg">
              <div>
                <p className="text-sm font-medium text-app-fg">{a.resource?.name}</p>
                <p className="text-xs text-app-muted">
                  {formatCurrency(a.resource?.rate || 0, projectCurrency)}/{a.resource?.unit} × {a.quantity} {a.resource?.unit}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-app-fg">{formatCurrency(a.calculated_cost, projectCurrency)}</span>
                <button 
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {existingAssignments.length === 0 && !isAdding && (
            <div className="text-center py-6 border border-dashed border-app-border rounded-lg">
              <p className="text-sm text-app-muted">No resources assigned to this activity.</p>
            </div>
          )}

          {/* Add New Row */}
          {isAdding && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-3">
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Resource</label>
                <select 
                  value={selectedRateId} 
                  onChange={e => setSelectedRateId(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a resource...</option>
                  {resourceRates.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({formatCurrency(r.rate, projectCurrency)}/{r.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Quantity {selectedRateId ? `(${getUnitLabel(selectedRateId)}s)` : ''}
                  </label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value))}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <button onClick={handleAdd} className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsAdding(false); setSelectedRateId(''); setQuantity(0); }} className="p-2 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
