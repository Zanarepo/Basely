'use client'

import { useState } from 'react'
import { ProductBacklogItem } from '@/lib/product-strategy/types'
import { upsertBacklogItem, convertBacklogItemToExecution, deleteBacklogItem } from '@/lib/product-backlog/actions'
import { Loader2, Play, CheckCircle2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
      if (field === 'moscow_status' && value) {
        payload.reach = 0; payload.impact = 0; payload.confidence = 0; payload.effort = 0
      }
      if (['reach', 'impact', 'confidence', 'effort'].includes(field as string)) {
        payload.moscow_status = null
      }
      const { success, error } = await upsertBacklogItem(payload)
      if (!success) throw new Error(error)
      onUpdate()
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
      showToast(data?.usedAi
        ? 'Praz-AI deconstructed this item into an Epic!'
        : 'Created an Epic in the WBS.', 'success')
    } catch (err: any) {
      showToast('Failed: ' + err.message, 'error')
    } finally {
      setExecutingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    try {
      const { success, error } = await deleteBacklogItem(id)
      if (!success) throw new Error(error)
      onUpdate()
      showToast('Deleted', 'success')
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error')
    }
  }

  const COLS = 8

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2.5 font-semibold">Feature</th>
              <th className="px-2 py-2.5 font-semibold text-center w-32">MoSCoW</th>
              <th className="px-2 py-2.5 font-semibold text-center w-14">R</th>
              <th className="px-2 py-2.5 font-semibold text-center w-14">I</th>
              <th className="px-2 py-2.5 font-semibold text-center w-14">C%</th>
              <th className="px-2 py-2.5 font-semibold text-center w-14">E</th>
              <th className="px-2 py-2.5 font-semibold text-center w-20 text-violet-600 dark:text-violet-400">RICE</th>
              <th className="px-2 py-2.5 font-semibold text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(item => {
              const isExpanded = expandedIds.has(item.id)
              return (
                <>
                  {/* ── Main data row ── */}
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors group">

                    {/* Feature title — wraps naturally, full width */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        defaultValue={item.title}
                        onBlur={(e) => { if (e.target.value !== item.title) handleEdit(item, 'title', e.target.value) }}
                        className="font-medium text-slate-900 dark:text-white w-full bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded px-1 py-0.5 focus:border-violet-500 focus:outline-none transition-all text-xs leading-snug"
                        placeholder="Feature title"
                      />
                    </td>

                    <td className="px-2 py-2 text-center">
                      <EnterpriseSelect
                        value={item.moscow_status || ''}
                        onChange={(val) => {
                          const value = val === '' ? null : val
                          if (value !== item.moscow_status) handleEdit(item, 'moscow_status', value)
                        }}
                        size="sm"
                        placeholder="—"
                        options={[
                          { value: '', label: '—' },
                          { value: 'Must', label: '🔴 Must' },
                          { value: 'Should', label: '🟡 Should' },
                          { value: 'Could', label: '🟢 Could' },
                          { value: 'Wont', label: "⚪ Won't" },
                        ]}
                      />
                    </td>

                    {/* Compact number inputs */}
                    {(['reach', 'impact', 'confidence', 'effort'] as const).map(field => (
                      <td key={field} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          max={field === 'confidence' ? 100 : undefined}
                          defaultValue={item[field] as number}
                          onBlur={(e) => {
                            if (Number(e.target.value) !== item[field]) handleEdit(item, field, Number(e.target.value))
                          }}
                          className="w-10 text-center bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded py-0.5 focus:border-violet-500 focus:outline-none transition-all text-xs"
                        />
                      </td>
                    ))}

                    {/* RICE Score */}
                    <td className="px-2 py-2 text-center">
                      {savingId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mx-auto text-violet-500" />
                      ) : item.moscow_status ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : (
                        <span className="font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded text-xs">
                          {Number(item.rice_score).toFixed(0)}
                        </span>
                      )}
                    </td>

                    {/* Actions — compact icon buttons */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.wbs_element_id ? (
                          <span title="In Execution"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                        ) : (
                          <button
                            onClick={() => handleSendToExecution(item)}
                            disabled={executingId === item.id}
                            title="Send to Execution"
                            className="cursor-pointer p-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {executingId === item.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Play className="w-3.5 h-3.5 fill-current" />
                            }
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                          className="cursor-pointer opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Description accordion bar ── */}
                  <tr key={`${item.id}-toggle`}>
                    <td
                      colSpan={COLS}
                      onClick={() => toggleExpand(item.id)}
                      className="cursor-pointer px-4 py-0.5 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors border-t border-dashed border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-300 hover:text-violet-400 transition-colors select-none">
                        {isExpanded
                          ? <><ChevronDown className="w-2.5 h-2.5" />Hide description</>
                          : <><ChevronRight className="w-2.5 h-2.5" />Description</>
                        }
                      </div>
                    </td>
                  </tr>

                  {/* ── Description panel ── */}
                  {isExpanded && (
                    <tr key={`${item.id}-desc`} className="bg-violet-50/30 dark:bg-violet-900/10">
                      <td colSpan={COLS} className="px-6 pb-3 pt-2 border-t border-violet-100 dark:border-violet-800/30">
                        <textarea
                          key={`${item.id}-desc-ta`}
                          defaultValue={item.description || ''}
                          onBlur={(e) => {
                            if (e.target.value !== item.description) handleEdit(item, 'description', e.target.value)
                          }}
                          className="w-full text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-violet-400 focus:outline-none rounded-lg px-3 py-2 resize-none leading-relaxed transition-all"
                          placeholder="Feature description..."
                          rows={Math.max(2, Math.ceil((item.description?.length || 0) / 130))}
                        />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={COLS} className="px-6 py-10 text-center text-slate-400 text-xs">
                  No backlog items found. Click &quot;Generate from Opportunity Assessment&quot; or add items manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}