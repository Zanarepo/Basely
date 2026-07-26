'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, Save, DollarSign, Calendar, LinkIcon, Loader2 } from 'lucide-react'
import { useProcurementPlan } from './hooks/useProcurementPlan'
import { ProcurementEntry } from '@/lib/planning/procurement-actions'
import { ProcurementEntryForm } from './ProcurementEntryForm'

interface ProcurementPlanEditorProps {
  projectId: string
  hasEditAccess?: boolean
  onShowToast?: (type: 'error' | 'success' | 'info', msg: string) => void
}

export function ProcurementPlanEditor({ 
  projectId, 
  hasEditAccess,
  onShowToast
}: ProcurementPlanEditorProps) {
  const { entries, costAccounts, isLoading, error, saveEntry, removeEntry } = useProcurementPlan(projectId)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ProcurementEntry | null>(null)

  useEffect(() => {
    if (error) {
      onShowToast?.('error', error)
    }
  }, [error, onShowToast])

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-app-muted" />
      </div>
    )
  }

  const startAdd = () => {
    setSelectedEntry(null)
    setIsModalOpen(true)
  }

  const startEdit = (entry: ProcurementEntry) => {
    setSelectedEntry(entry)
    setIsModalOpen(true)
  }

  const handleSaveEntry = async (entryData: Partial<ProcurementEntry>) => {
    const err = await saveEntry(entryData)
    if (err) return err
    onShowToast?.('success', 'Procurement entry saved')
    setIsModalOpen(false)
  }

  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val)
  }

  return (
    <div className="space-y-6">
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-app-fg">Procurement Register</h3>
            <p className="text-xs text-app-muted mt-1">Track vendors, contract scope, and costs.</p>
          </div>
          {hasEditAccess && (
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vendor
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-app-border bg-app-surface/50">
                <th className="px-4 py-3 text-xs font-medium text-app-muted uppercase tracking-wider">Vendor / Scope</th>
                <th className="px-4 py-3 text-xs font-medium text-app-muted uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-app-muted">
                    No procurement entries found.
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="group hover:bg-app-surface/50 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-sm text-app-fg">{entry.vendor_name}</div>
                      {entry.contract_scope && (
                        <div className="text-xs text-app-muted mt-1 line-clamp-2">{entry.contract_scope}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-app-fg font-medium">
                        {entry.cost ? formatCurrency(entry.cost) : '—'}
                      </div>
                      {entry.linked_cost_account_id && entry.cost_accounts && (
                        <div className="text-[10px] text-app-muted mt-1 flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          Linked ({formatCurrency(entry.cost_accounts.budgeted_total, entry.cost_accounts.currency)})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {hasEditAccess && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 text-app-muted hover:text-indigo-500 rounded hover:bg-app-hover transition-colors cursor-pointer"
                            title="Edit entry"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove this procurement entry?')) {
                                removeEntry(entry.id)
                              }
                            }}
                            className="p-1.5 text-app-muted hover:text-rose-500 rounded hover:bg-app-hover transition-colors cursor-pointer"
                            title="Remove entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProcurementEntryForm
          entry={selectedEntry}
          costAccounts={costAccounts}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  )
}
