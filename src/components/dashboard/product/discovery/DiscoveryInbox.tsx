'use client'

import React, { useState, useEffect } from 'react'
import type { DiscoveryInsight, Persona } from '@/lib/product-strategy/types'
import { getPersonas } from '@/lib/product-strategy/actions'
import { useDiscoveryInsights } from './hooks/useDiscoveryInsights'
import { DiscoveryInsightCard } from './DiscoveryInsightCard'
import { DiscoveryInsightModal } from './DiscoveryInsightModal'
import {
  Lightbulb,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Inbox,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Archive
} from 'lucide-react'

interface DiscoveryInboxProps {
  organizationId: string
  projectId: string
  hasEditAccess?: boolean
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All', icon: <Inbox className="w-3 h-3" /> },
  { value: 'new', label: 'New', icon: <MessageSquare className="w-3 h-3" /> },
  { value: 'triaged', label: 'Triaged', icon: <Filter className="w-3 h-3" /> },
  { value: 'in_review', label: 'In Review', icon: <AlertTriangle className="w-3 h-3" /> },
  { value: 'converted', label: 'Converted', icon: <CheckCircle2 className="w-3 h-3" /> },
  { value: 'archived', label: 'Archived', icon: <Archive className="w-3 h-3" /> }
]

export function DiscoveryInbox({ organizationId, projectId, hasEditAccess = true }: DiscoveryInboxProps) {
  const {
    insights,
    loading,
    saving,
    fetchInsights,
    addInsight,
    editInsight,
    removeInsight,
    convertToChangeRequest
  } = useDiscoveryInsights(organizationId, projectId)

  const [personas, setPersonas] = useState<Persona[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInsight, setEditingInsight] = useState<DiscoveryInsight | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (organizationId) {
      getPersonas(organizationId, projectId).then(setPersonas)
    }
  }, [organizationId, projectId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInsights()
    setRefreshing(false)
  }

  const handleSave = async (payload: Partial<DiscoveryInsight>) => {
    if (editingInsight) {
      return editInsight(editingInsight.id, payload)
    }
    return addInsight(payload)
  }

  const handleEdit = (insight: DiscoveryInsight) => {
    setEditingInsight(insight)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingInsight(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInsight(null)
  }

  // Filtering
  const filtered = insights.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        i.title.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group counts for status tabs
  const statusCounts: Record<string, number> = { all: insights.length }
  insights.forEach(i => {
    statusCounts[i.status] = (statusCounts[i.status] || 0) + 1
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>VOICE-OF-CUSTOMER DISCOVERY ENGINE</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Discovery Inbox & Triage Panel
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              Log customer interview notes, support friction points, and product feedback. Tag insights by severity and persona, then convert actionable items into formal Change Requests.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{ cursor: 'pointer' }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>

            {hasEditAccess && (
              <button
                type="button"
                onClick={handleCreate}
                style={{ cursor: 'pointer' }}
                className="px-5 py-2.5 rounded-xl bg-[#6b4eff] hover:bg-[#5839ec] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Log Insight
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search + Status Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search insights..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(sf => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                style={{ cursor: 'pointer' }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  statusFilter === sf.value
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                {sf.icon}
                {sf.label}
                <span className="ml-0.5 text-[9px] font-mono opacity-70">
                  {statusCounts[sf.value] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Discovery Insights...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {searchQuery || statusFilter !== 'all' ? 'No insights match your filters' : 'No discovery insights logged yet'}
          </span>
          {hasEditAccess && !searchQuery && statusFilter === 'all' && (
            <button
              type="button"
              onClick={handleCreate}
              style={{ cursor: 'pointer' }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#6b4eff] hover:bg-[#5839ec] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Log Your First Insight
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(insight => (
            <DiscoveryInsightCard
              key={insight.id}
              insight={insight}
              onEdit={handleEdit}
              onDelete={removeInsight}
              onConvertToCR={convertToChangeRequest}
              saving={saving}
              hasEditAccess={hasEditAccess}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <DiscoveryInsightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        existingInsight={editingInsight}
        personas={personas}
        organizationId={organizationId}
        projectId={projectId}
      />
    </div>
  )
}
