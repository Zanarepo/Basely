'use client'

import React, { useState, useMemo } from 'react'
import { CheckSquare, Square, Trash2, Plus, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import type { Release, ReleaseReadinessItem } from '@/lib/releases/types'
import { formatDistanceToNow } from 'date-fns'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ReleaseReadinessSectionProps {
  release: Release
  hasEditAccess: boolean
  onToggleItem: (id: string, releaseId: string, isChecked: boolean) => Promise<any>
  onAddItem: (releaseId: string, category: string, itemText: string) => Promise<any>
  onDeleteItem: (id: string, releaseId: string) => Promise<any>
  onLoadDefaults: (releaseId: string) => Promise<any>
}

export function ReleaseReadinessSection({
  release,
  hasEditAccess,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onLoadDefaults
}: ReleaseReadinessSectionProps) {
  const [loading, setLoading] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [newCategory, setNewCategory] = useState('Product')

  const items = release.readinessItems || []
  
  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ReleaseReadinessItem[]> = {}
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])

  const categories = Object.keys(groupedItems).sort()

  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  const handleToggle = async (item: ReleaseReadinessItem) => {
    if (!hasEditAccess) return
    setTogglingItemId(item.id)
    await onToggleItem(item.id, release.id, !item.isChecked)
    setTogglingItemId(null)
  }

  const handleDelete = async (id: string) => {
    if (!hasEditAccess) return
    setTogglingItemId(id)
    await onDeleteItem(id, release.id)
    setTogglingItemId(null)
  }

  const handleAdd = async () => {
    if (!newItemText.trim() || !hasEditAccess) return
    setLoading(true)
    await onAddItem(release.id, newCategory, newItemText)
    setNewItemText('')
    setLoading(false)
  }

  const handleLoadDefaults = async () => {
    if (!hasEditAccess) return
    setLoading(true)
    await onLoadDefaults(release.id)
    setLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-app-border rounded-xl bg-app-surface/30">
        <CheckSquare className="h-10 w-10 text-app-muted mb-3" />
        <h3 className="text-sm font-bold text-app-fg">No Readiness Items</h3>
        <p className="text-xs text-app-muted max-w-sm mt-1 mb-4">
          Establish a checklist to verify all aspects of the release are ready before promotion.
        </p>
        {hasEditAccess && (
          <button
            onClick={handleLoadDefaults}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Load Organizational Defaults</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-app-muted flex items-center gap-2">
            {category} 
            <span className="px-2 py-0.5 rounded-full bg-app-surface border border-app-border text-[10px]">
              {groupedItems[category].filter(i => i.isChecked).length} / {groupedItems[category].length}
            </span>
          </h4>
          <div className="space-y-2">
            {groupedItems[category].map(item => (
              <div 
                key={item.id} 
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  item.isChecked 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-app-card border-app-border hover:border-indigo-500/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  disabled={togglingItemId === item.id || loading || !hasEditAccess}
                  className="mt-0.5 shrink-0 text-app-muted hover:text-indigo-500 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {togglingItemId === item.id ? (
                    <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                  ) : item.isChecked ? (
                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-all ${item.isChecked ? 'text-app-muted line-through' : 'text-app-fg'}`}>
                    {item.itemText}
                  </p>
                  {item.isChecked && item.checkedAt && (
                    <p className="text-[10px] text-emerald-500/70 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Checked {formatDistanceToNow(new Date(item.checkedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                {hasEditAccess && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={togglingItemId === item.id || loading}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {hasEditAccess && (
        <div className="pt-4 mt-6 border-t border-app-border flex items-center gap-3">
          <div className="w-44 shrink-0">
            <EnterpriseSelect
              value={newCategory}
              onChange={(val) => setNewCategory(val)}
              options={[
                { value: 'Product', label: 'Product', description: 'Product & UX verification' },
                { value: 'Engineering', label: 'Engineering', description: 'Code & build readiness' },
                { value: 'QA', label: 'QA', description: 'Quality assurance signoffs' },
                { value: 'DevOps', label: 'DevOps', description: 'Deployment & CI/CD status' },
                { value: 'Security', label: 'Security', description: 'Vulnerability & review signoff' },
                { value: 'Documentation', label: 'Documentation', description: 'User & API docs readiness' },
              ]}
            />
          </div>
          <input
            type="text"
            placeholder="Add new readiness verification item..."
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-2 text-sm bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newItemText.trim() || loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </div>
      )}
    </div>
  )
}
