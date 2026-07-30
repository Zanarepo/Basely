'use client'

import { useState } from 'react'
import { ProductBacklogItem } from '@/lib/product-strategy/types'
import { upsertBacklogItem, convertBacklogItemToExecution, deleteBacklogItem } from '@/lib/product-backlog/actions'
import { Loader2, Play, CheckCircle2, Trash2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

type RiceMatrixTableProps = {
  organizationId: string
  projectId: string
  items: ProductBacklogItem[]
  onUpdate: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function RiceMatrixTable({ organizationId, projectId, items, onUpdate, showToast }: RiceMatrixTableProps) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)

  const handleEdit = async (item: ProductBacklogItem, field: keyof ProductBacklogItem, value: any) => {
    setSavingId(item.id)
    try {
      const payload: any = {
        id: item.id,
        project_id: projectId,
        organization_id: organizationId,
        title: item.title,
        [field]: value
      }

      // Mutually exclusive: If setting MoSCoW, clear RICE
      if (field === 'moscow_status' && value) {
        payload.reach = 0
        payload.impact = 0
        payload.confidence = 0
        payload.effort = 0
      }
      
      // Mutually exclusive: If setting RICE, clear MoSCoW
      if (['reach', 'impact', 'confidence', 'effort'].includes(field as string)) {
        payload.moscow_status = null
      }

      const { success, error } = await upsertBacklogItem(payload)
      if (!success) throw new Error(error)
      onUpdate()
      showToast('Saved RICE values', 'success')
    } catch (err: any) {
      showToast('Failed to save: ' + err.message, 'error')
    } finally {
      setSavingId(null)
    }
  }

  const handleSendToExecution = async (item: ProductBacklogItem) => {
    setExecutingId(item.id)
    try {
      const { success, error, data } = await convertBacklogItemToExecution(item.id)
      if (!success) throw new Error(error)
      onUpdate()
      if (data?.usedAi) {
        showToast('AI successfully deconstructed this item into an Epic and child work packages!', 'success')
      } else {
        showToast('Successfully created an Epic shell in the WBS.', 'success')
      }
    } catch (err: any) {
      showToast('Failed to send to execution: ' + err.message, 'error')
    } finally {
      setExecutingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backlog item?')) return
    try {
      const { success, error } = await deleteBacklogItem(id)
      if (!success) throw new Error(error)
      onUpdate()
      showToast('Deleted item', 'success')
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-6 py-4 font-semibold w-1/4">Title / Feature</th>
              <th className="px-4 py-4 font-semibold text-center w-28">MoSCoW</th>
              <th className="px-4 py-4 font-semibold text-center w-24">Reach</th>
              <th className="px-4 py-4 font-semibold text-center w-24">Impact</th>
              <th className="px-4 py-4 font-semibold text-center w-24">Confidence (%)</th>
              <th className="px-4 py-4 font-semibold text-center w-24">Effort</th>
              <th className="px-4 py-4 font-semibold text-center w-24 text-indigo-600 dark:text-indigo-400">RICE Score</th>
              <th className="px-6 py-4 font-semibold text-right w-56">Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    defaultValue={item.title}
                    onBlur={(e) => {
                      if (e.target.value !== item.title) {
                        handleEdit(item, 'title', e.target.value)
                      }
                    }}
                    className="font-medium text-slate-900 dark:text-white truncate w-full bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded px-1.5 py-0.5 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Feature Title"
                  />
                  <input
                    type="text"
                    defaultValue={item.description || ''}
                    onBlur={(e) => {
                      if (e.target.value !== item.description) {
                        handleEdit(item, 'description', e.target.value)
                      }
                    }}
                    className="text-xs text-slate-500 truncate w-full mt-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded px-1.5 py-0.5 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Feature description..."
                  />
                </td>
                
                <td className="px-4 py-4 text-center min-w-[140px]">
                  <EnterpriseSelect
                    value={item.moscow_status || ''}
                    onChange={(val) => {
                      const value = val === '' ? null : val
                      if (value !== item.moscow_status) {
                        handleEdit(item, 'moscow_status', value)
                      }
                    }}
                    size="sm"
                    placeholder="— Unset —"
                    options={[
                      { value: '', label: '— Unset —' },
                      { value: 'Must', label: '🔴 Must Have' },
                      { value: 'Should', label: '🟡 Should Have' },
                      { value: 'Could', label: '🟢 Could Have' },
                      { value: 'Wont', label: '⚪ Won\'t Have' },
                    ]}
                  />
                </td>

                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min="1"
                    defaultValue={item.reach}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== item.reach) {
                        handleEdit(item, 'reach', Number(e.target.value))
                      }
                    }}
                    className="w-16 text-center bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md py-1 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min="1"
                    defaultValue={item.impact}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== item.impact) {
                        handleEdit(item, 'impact', Number(e.target.value))
                      }
                    }}
                    className="w-16 text-center bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md py-1 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={item.confidence}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== item.confidence) {
                        handleEdit(item, 'confidence', Number(e.target.value))
                      }
                    }}
                    className="w-16 text-center bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md py-1 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min="1"
                    defaultValue={item.effort}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== item.effort) {
                        handleEdit(item, 'effort', Number(e.target.value))
                      }
                    }}
                    className="w-16 text-center bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md py-1 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </td>
                
                <td className="px-4 py-4 text-center">
                  {savingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-indigo-500" />
                  ) : item.moscow_status ? (
                    <span className="text-slate-400 font-medium text-xs">N/A</span>
                  ) : (
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md">
                      {Number(item.rice_score).toFixed(1)}
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.wbs_element_id ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm px-2">
                        <CheckCircle2 className="w-4 h-4" />
                        In Execution
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendToExecution(item)}
                        disabled={executingId === item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                      >
                        {executingId === item.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Send to Execution
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="cursor-pointer opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No backlog items found. Create a new PRD or Feedback item to start building your backlog!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
