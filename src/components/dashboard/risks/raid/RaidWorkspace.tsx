'use client'

import Link from 'next/link'
import { Plus, Search, ShieldAlert, CheckCircle2, Calendar, Trash2, Edit3, Layers, Sparkles, Loader2, ShieldCheck } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import RaidItemModal from './RaidItemModal'
import { type RaidCategory, type RaidPriority } from '@/lib/raid/actions'
import { ToastContainer } from '@/components/dashboard/Toast'
import { getTerminology } from '@/utils/terminology'
import { AiRaidCopilotModal } from './ai-copilot/AiRaidCopilotModal'
import { useAiRaidCopilot } from './ai-copilot/useAiRaidCopilot'
import { useRaidWorkspace } from './hooks/useRaidWorkspace'

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
  const {
    activeTab, setActiveTab,
    items, setItems,
    wbsElements,
    loading,
    search, setSearch,
    priorityFilter, setPriorityFilter,
    isModalOpen, setIsModalOpen,
    modalCategory, setModalCategory,
    selectedItem, setSelectedItem,
    deletingId,
    toasts, showToast, dismissToast,
    fetchRaidItems,
    handleDelete,
    filteredItems
  } = useRaidWorkspace(projectId, organizationId)

  const terms = getTerminology(methodology)
  
  const aiCopilot = useAiRaidCopilot({
    projectId,
    organizationId,
    onComplete: () => fetchRaidItems(),
    onShowToast: showToast
  })

  const getCategoryBadge = (category: RaidCategory) => {
    switch (category) {
      case 'risk': return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">🛡️ Risk</span>
      case 'assumption': return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">💡 Assumption</span>
      case 'issue': return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">🔥 Issue</span>
      case 'dependency': return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">🧩 Dependency</span>
    }
  }

  const getPriorityColor = (priority: RaidPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-400 font-extrabold'
      case 'high': return 'text-amber-400 font-bold'
      case 'medium': return 'text-violet-400 font-semibold'
      case 'low': return 'text-slate-400 font-normal'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-5 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Enterprise RAID Command Center
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {methodology} ready
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Unified project governance across Risks, Assumptions, Issues, and External Dependencies. Bridges upstream discovery into downstream WBS task alerts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-app-border/50">
          <div>
            <button
              onClick={aiCopilot.handleOpen}
              disabled={aiCopilot.isPredicting}
              className="px-4 py-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/30 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiCopilot.isPredicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiCopilot.isPredicting ? 'Analyzing...' : 'Predictive Praz-AI'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedItem(null)
                setModalCategory('assumption')
                setIsModalOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Log Assumption
            </button>
            <button
              onClick={() => {
                setSelectedItem(null)
                setModalCategory('dependency')
                setIsModalOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Log Dependency
            </button>
            <button
              onClick={() => {
                setSelectedItem(null)
                setModalCategory('risk')
                setIsModalOpen(true)
              }}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-lg shadow-violet-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New RAID Entry
            </button>
          </div>
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
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-app-input border border-app-border text-app-fg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
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

                <h3 className="text-base font-bold text-app-fg tracking-tight group-hover:text-violet-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-app-muted leading-relaxed max-w-3xl mt-1">
                  {item.description}
                </p>

                {item.mitigation_plan && (
                  <div className="mt-4 p-4 bg-app-input/50 rounded-xl border border-app-border max-w-4xl shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-app-fg uppercase tracking-wider">Mitigation & Action Plan</span>
                    </div>
                    <p className="text-sm text-app-subtle whitespace-pre-wrap leading-relaxed">{item.mitigation_plan}</p>
                  </div>
                )}

                {(item.external_owner_name || item.linked_wbs_element_id) && (
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 flex flex-wrap items-center justify-between gap-3 text-xs max-w-3xl">
                    {item.external_owner_name ? (
                      <span className="font-semibold text-app-fg">
                        External Owner / Vendor: <strong className="text-emerald-300">{item.external_owner_name}</strong>
                      </span>
                    ) : <span className="font-semibold text-app-muted">Governance Scope:</span>}
                    {item.linked_wbs_element_id && (
                      <div className="flex items-center flex-wrap gap-1.5 ml-auto">
                        <span className="text-[11px] font-bold text-violet-400 dark:text-violet-300">🔗 Linked WBS:</span>
                        {item.linked_wbs_element_id.split(',').map(id => id.trim()).filter(Boolean).map(id => {
                          const el = wbsElements.find(w => w.id === id)
                          return (
                            <Link 
                              key={id} 
                              href={`/dashboard/projects/${projectId}?tab=wbs&elementId=${id}`}
                              className="bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 dark:text-violet-300 border border-violet-500/25 hover:border-violet-400/50 px-2 py-0.5 rounded-lg font-extrabold text-[10px] uppercase shadow-xs transition-colors cursor-pointer"
                            >
                              {el ? `${el.code} (${!el.isWorkPackage ? terms.planTier : terms.workPackage})` : id.startsWith('wbs') || id.startsWith('epic') ? id : 'Deliv.'}
                            </Link>
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

      <AiRaidCopilotModal
        isOpen={aiCopilot.isOpen}
        isPredicting={aiCopilot.isPredicting}
        isSaving={aiCopilot.isSaving}
        predictions={aiCopilot.predictions}
        selectedIndices={aiCopilot.selectedIndices}
        onClose={aiCopilot.handleClose}
        onToggleSelection={aiCopilot.toggleSelection}
        onCommit={aiCopilot.handleCommit}
      />
    </div>
  )
}
