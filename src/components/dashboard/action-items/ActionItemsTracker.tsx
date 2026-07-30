'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2, CheckCircle2, Circle, Clock, Filter, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { deleteActionItem } from '@/lib/actions/action-items'
import { ActionItemModal } from './ActionItemModal'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ActionItemsTrackerProps {
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ActionItemsTracker({ projectId, hasEditAccess, onShowToast }: ActionItemsTrackerProps) {
  const [items, setItems] = useState<any[]>([])
  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    setIsLoading(true)
    const [itemsRes, shRes] = await Promise.all([
      supabase.from('action_items').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('stakeholders').select('id, name, role_title').eq('project_id', projectId)
    ])
    
    if (itemsRes.data) setItems(itemsRes.data)
    if (shRes.data) setStakeholders(shRes.data)
    setIsLoading(false)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this action item?')) return
    
    const res = await deleteActionItem(id, projectId)
    if (res.success) {
      onShowToast?.('success', 'Action item deleted')
      fetchData()
    } else {
      onShowToast?.('error', res.error || 'Failed to delete')
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.description.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [items, search, statusFilter])

  const openEditModal = (id: string) => {
    setEditingItemId(id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setEditingItemId(null)
    setIsModalOpen(true)
  }

  const getStakeholderName = (id: string) => {
    const s = stakeholders.find(x => x.id === id)
    return s ? s.name : 'Unassigned'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />
      default: return <Circle className="w-4 h-4 text-indigo-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'in_progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    }
  }

  return (
    <div className="flex flex-col h-full bg-app-bg text-app-fg">
      <div className="flex items-center justify-between p-6 border-b border-app-border shrink-0">
        <div>
          <h2 className="text-lg font-bold">Action Items Tracker</h2>
          <p className="text-sm text-app-muted mt-1">Lightweight tasks and decisions distinct from the schedule.</p>
        </div>
        {hasEditAccess && (
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Action Item
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 p-4 sm:p-6 pb-0 shrink-0 border-b border-transparent">
        <div className="flex-1 bg-app-card border border-app-border rounded-xl flex items-center px-4 py-2 focus-within:border-indigo-500 transition-colors">
          <Search className="w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm px-3 py-1 flex-1 text-app-fg"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-app-muted" />
          <div className="w-40">
            <EnterpriseSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'open', label: 'Open', description: 'Pending execution' },
                { value: 'in_progress', label: 'In Progress', description: 'Actively being worked on' },
                { value: 'done', label: 'Done', description: 'Completed action item' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-app-border rounded-2xl bg-app-card/50">
            <CheckCircle2 className="w-8 h-8 text-app-muted mb-3" />
            <p className="text-app-muted text-sm font-medium">No action items found.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => hasEditAccess && openEditModal(item.id)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-app-card border border-app-border rounded-xl transition-all ${
                  hasEditAccess ? 'cursor-pointer hover:border-indigo-500/50 hover:shadow-md' : ''
                } group`}
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                    <p className="text-sm font-semibold text-app-fg">{item.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 pl-7 text-xs text-app-muted font-medium">
                    <span className="flex items-center gap-1.5 bg-app-bg px-2 py-1 rounded-md border border-app-border">
                      User: {getStakeholderName(item.owner_stakeholder_id)}
                    </span>
                    {item.due_date && (
                      <span className="flex items-center gap-1.5 bg-app-bg px-2 py-1 rounded-md border border-app-border">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-md border uppercase text-[10px] tracking-wider font-bold ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {hasEditAccess && (
                  <div className="mt-4 sm:mt-0 pl-7 sm:pl-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ActionItemModal
          projectId={projectId}
          itemId={editingItemId || undefined}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchData()
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  )
}
