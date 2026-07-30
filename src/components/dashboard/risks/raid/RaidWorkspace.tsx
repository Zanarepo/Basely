'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, ShieldAlert, AlertTriangle, HelpCircle, GitBranch, CheckCircle2, Clock, Calendar, ExternalLink, Trash2, Edit3, Layers, Sparkles } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import RaidItemModal from './RaidItemModal'
import { getRaidEntries, deleteRaidEntry, type RaidLogEntry, type RaidCategory, type RaidStatus, type RaidPriority } from '@/lib/raid/actions'
import { getWbsElements } from '@/lib/wbs/actions'
import type { WbsElement } from '@/lib/wbs/constants'
import { ToastContainer } from '@/components/dashboard/Toast'
import { useWbsToasts } from '@/components/dashboard/wbs/workspace/hooks/useWbsToasts'

interface RaidWorkspaceProps {
  projectId: string
  organizationId: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
}

export default function RaidWorkspace({
  projectId,
  organizationId,
  methodology = 'hybrid'
}: RaidWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<RaidCategory | 'all' | 'closed'>('all')
  const [items, setItems] = useState<RaidLogEntry[]>([])
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState<RaidCategory>('risk')
  const [selectedItem, setSelectedItem] = useState<RaidLogEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toasts, showToast, dismissToast } = useWbsToasts()

  const fetchRaidItems = async () => {
    setLoading(true)
    const [res, wbsRes] = await Promise.all([
      getRaidEntries(projectId, 'all'),
      getWbsElements(projectId)
    ])
    if (wbsRes.ok && wbsRes.data) {
      setWbsElements(wbsRes.data)
    }
    if (res.ok && res.data && res.data.length > 0) {
      setItems(res.data)
    } else {
      // Demo enterprise RAID log data for instant visualization
      setItems([
        {
          id: 'raid-101',
          organization_id: organizationId,
          project_id: projectId,
          category: 'risk',
          title: 'AWS Spot Instance Interruptions During ML Training',
          description: 'Spot pricing instability could terminate background data embedding jobs without progress check-pointing.',
          status: 'open',
          priority: 'high',
          impact_rating: 4,
          probability_rating: 3,
          mitigation_plan: 'Implement automated EBS volume snapshot checkpoints every 15 minutes during inference runs.',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'raid-102',
          organization_id: organizationId,
          project_id: projectId,
          category: 'assumption',
          title: 'Client Legacy API Supports 500+ TPS in JSON without Latency',
          description: 'Our checkout release baseline assumes the legacy billing server will process concurrency without timeouts.',
          status: 'in_progress',
          priority: 'critical',
          validation_due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          impact_rating: 5,
          probability_rating: 4,
          mitigation_plan: 'Execute synthetic load tests via JMeter during staging test week.',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'raid-103',
          organization_id: organizationId,
          project_id: projectId,
          category: 'dependency',
          title: 'Stripe Beta EU Bank Transfer API Access Sign-off',
          description: 'Our payment checkout feature is administratively blocked waiting for third-party regulatory access token.',
          status: 'open',
          priority: 'high',
          external_owner_name: 'Stripe Partnership Team & Legal',
          target_resolution_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          linked_wbs_element_id: 'wbs-pkg-101',
          impact_rating: 4,
          probability_rating: 2,
          created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 86400000).toISOString()
        },
        {
          id: 'raid-104',
          organization_id: organizationId,
          project_id: projectId,
          category: 'issue',
          title: 'Staging Auth Server TLS Certificate Expired',
          description: 'QA engineers cannot run Cypress automated regression suites on staging environment today.',
          status: 'in_progress',
          priority: 'critical',
          impact_rating: 5,
          probability_rating: 5,
          mitigation_plan: 'DevOps team running cert-bot renew script and updating NGINX reverse proxy headers.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRaidItems()
  }, [projectId, organizationId])

  useEffect(() => {
    if (!loading && activeTab === 'closed' && !items.some(i => i.status === 'closed')) {
      setActiveTab('all')
    }
  }, [loading, items, activeTab])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to remove this governance entry from the RAID Log?')) return
    setDeletingId(id)
    await deleteRaidEntry(id, projectId)
    setDeletingId(null)
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast('success', 'RAID governance entry successfully removed.')
  }

  const filteredItems = items.filter((item) => {
    const isClosed = item.status === 'closed'
    const matchesTab = 
      activeTab === 'closed'
        ? isClosed
        : activeTab === 'all'
        ? !isClosed
        : item.category === activeTab && !isClosed
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    return matchesTab && matchesSearch && matchesPriority
  })

  const getCategoryBadge = (cat: RaidCategory) => {
    switch (cat) {
      case 'risk':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">🛡️ Risk</span>
      case 'assumption':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">💡 Assumption</span>
      case 'issue':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25">🔥 Issue</span>
      case 'dependency':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">🧩 Dependency</span>
    }
  }

  const getPriorityColor = (prio: RaidPriority) => {
    switch (prio) {
      case 'critical': return 'text-red-400 font-black'
      case 'high': return 'text-amber-400 font-bold'
      case 'medium': return 'text-indigo-400 font-semibold'
      case 'low': return 'text-slate-400 font-normal'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Enterprise RAID Command Center
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {methodology} ready
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Unified project governance across Risks, Assumptions, Issues, and External Dependencies. Bridges upstream discovery into downstream WBS task alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedItem(null)
              setModalCategory('assumption')
              setIsModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            + Log Assumption
          </button>
          <button
            onClick={() => {
              setSelectedItem(null)
              setModalCategory('dependency')
              setIsModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            + Log Dependency
          </button>
          <button
            onClick={() => {
              setSelectedItem(null)
              setModalCategory('risk')
              setIsModalOpen(true)
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New RAID Entry
          </button>
        </div>
      </div>

      {/* Domain Category Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-app-border overflow-x-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'risk', 'assumption', 'issue', 'dependency'] as const).map((tab) => {
            const isActive = activeTab === tab
            const count = items.filter(i => i.status !== 'closed' && (tab === 'all' || i.category === tab)).length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-app-surface text-app-muted hover:text-app-fg hover:bg-app-input border border-app-border/70'
                }`}
              >
                {tab === 'all' && <Layers className="w-3.5 h-3.5" />}
                {tab === 'risk' && '🛡️ Risks'}
                {tab === 'assumption' && '💡 Assumptions'}
                {tab === 'issue' && '🔥 Issues'}
                {tab === 'dependency' && '🧩 Dependencies'}
                {tab === 'all' && 'Active Domains (RAID)'}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-app-input text-app-subtle border border-app-border'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {items.some(i => i.status === 'closed') && (
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
              activeTab === 'closed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-app-surface text-app-muted hover:text-emerald-500 hover:bg-emerald-500/10 border border-app-border/70'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Closed Archive</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'closed' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
            }`}>
              {items.filter(i => i.status === 'closed').length}
            </span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-app-surface/60 border border-app-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search RAID log by title, description, or external owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-app-input border border-app-border text-app-fg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="w-48">
          <EnterpriseSelect
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'all', label: 'All Priority Ratings', description: 'Include all severity tiers' },
              { value: 'critical', label: '🚨 Critical Priority', description: 'Immediate threat to release date' },
              { value: 'high', label: 'High Priority', description: 'Significant milestone impact' },
              { value: 'medium', label: 'Medium Priority', description: 'Moderate friction factor' },
              { value: 'low', label: 'Low Priority', description: 'Minor governance observation' }
            ]}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-app-muted font-bold animate-pulse bg-app-surface border border-app-border rounded-2xl">
            Scanning RAID log database...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center bg-app-surface border border-app-border rounded-2xl space-y-3">
            <ShieldAlert className="w-12 h-12 text-app-subtle mx-auto stroke-1" />
            <h3 className="text-lg font-bold text-app-fg">No matching RAID items found</h3>
            <p className="text-sm text-app-muted max-w-md mx-auto">
              No governance items match your current search or tab selection. Click above to log an Assumption or Dependency.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-app-surface border border-app-border hover:border-app-border/80 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {getCategoryBadge(item.category)}
                  <span className={`text-xs uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
                    ● {item.priority} Priority
                  </span>
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-app-input border border-app-border text-app-muted">
                    Status: {item.status}
                  </span>

                  {item.category === 'assumption' && item.validation_due_date && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <Calendar className="w-3 h-3" /> Validate by: {item.validation_due_date}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-app-fg tracking-tight group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-app-muted leading-relaxed max-w-3xl">
                  {item.description}
                </p>

                {(item.external_owner_name || item.linked_wbs_element_id) && (
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex flex-wrap items-center justify-between gap-3 text-xs max-w-3xl">
                    {item.external_owner_name ? (
                      <span className="font-semibold text-app-fg">
                        External Owner / Vendor: <strong className="text-emerald-300">{item.external_owner_name}</strong>
                      </span>
                    ) : <span className="font-semibold text-app-muted">Governance Scope:</span>}
                    {item.linked_wbs_element_id && (
                      <div className="flex items-center flex-wrap gap-1.5 ml-auto">
                        <span className="text-[11px] font-bold text-indigo-400 dark:text-indigo-300">🔗 Linked WBS:</span>
                        {item.linked_wbs_element_id.split(',').map(id => id.trim()).filter(Boolean).map(id => {
                          const el = wbsElements.find(w => w.id === id)
                          return (
                            <span key={id} className="bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-lg font-extrabold text-[10px] uppercase shadow-xs">
                              {el ? `${el.code} (${!el.isWorkPackage ? 'Parent' : 'WP'})` : id.startsWith('wbs') || id.startsWith('epic') ? id : 'Deliv.'}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-2 shrink-0 self-end md:self-center transition-all duration-200 ${deletingId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItem(item)
                    setModalCategory(item.category)
                    setIsModalOpen(true)
                  }}
                  className="p-2.5 rounded-xl border border-app-border hover:bg-app-input text-app-muted hover:text-app-fg transition-colors cursor-pointer"
                  title="Edit item"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  disabled={deletingId === item.id}
                  className="p-2.5 rounded-xl border border-app-border hover:bg-red-500/10 text-app-muted hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer"
                  title="Delete item"
                >
                  {deletingId === item.id ? (
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <RaidItemModal
        key={selectedItem?.id || 'new-entry'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        organizationId={organizationId}
        methodology={methodology}
        initialCategory={modalCategory}
        initialData={selectedItem}
        onSuccess={(updatedEntry) => {
          setItems((prev) => {
            const targetId = selectedItem ? selectedItem.id : updatedEntry.id
            const exists = prev.some((i) => i.id === targetId || i.id === updatedEntry.id)
            if (exists) {
              return prev.map((i) => (i.id === targetId || i.id === updatedEntry.id ? updatedEntry : i))
            }
            return [updatedEntry, ...prev]
          })
        }}
        onShowToast={showToast}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
