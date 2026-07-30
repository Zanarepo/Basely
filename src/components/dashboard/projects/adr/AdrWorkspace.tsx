'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Cpu, Layers, CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw, FileText, ChevronRight, Trash2, Edit3, ShieldAlert, BookOpen } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import AdrStudioModal from './AdrStudioModal'
import { getAdrs, deleteAdr, type ArchitectureDecisionRecord, type AdrStatus, type AdrDomain } from '@/lib/adr/actions'
import { ToastContainer } from '@/components/dashboard/Toast'
import { useWbsToasts } from '@/components/dashboard/wbs/workspace/hooks/useWbsToasts'

interface AdrWorkspaceProps {
  projectId?: string
  organizationId: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
}

export default function AdrWorkspace({
  projectId,
  organizationId,
  methodology = 'hybrid'
}: AdrWorkspaceProps) {
  const [adrs, setAdrs] = useState<ArchitectureDecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAdr, setSelectedAdr] = useState<ArchitectureDecisionRecord | null>(null)
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toasts, showToast, dismissToast } = useWbsToasts()

  const fetchRecords = async () => {
    setLoading(true)
    const res = await getAdrs(projectId, organizationId)
    if (res.ok && res.data) {
      setAdrs(res.data)
    } else {
      // Fallback sample data for demonstration if empty or error
      setAdrs([
        {
          id: 'adr-1',
          organization_id: organizationId,
          project_id: projectId,
          title: 'ADR-001: Migration from Monolith to Event-Driven Microservices',
          status: 'accepted',
          technical_domain: 'backend',
          context: 'Our monolithic server was encountering concurrent transaction connection exhaustion under heavy load during quarterly reporting intervals.',
          decision: 'We adopt decoupled Domain-Driven Design services communicating over Redis Pub/Sub and Kafka for asynchronous background compute.',
          consequences: 'Requires DevOps implementation of distributed open-telemetry tracing. Increased initial development complexity for distributed transactions.',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
          id: 'adr-2',
          organization_id: organizationId,
          project_id: projectId,
          title: 'ADR-002: React Portals for All Executive Dropdowns & Overlays',
          status: 'accepted',
          technical_domain: 'frontend',
          context: 'Standard CSS select dropdowns consistently suffered from overflow clipping inside tables and modal slide-over containers.',
          decision: 'Implement EnterpriseSelect component powered by React Portals rendering directly to document root with rich option descriptions.',
          consequences: 'Requires manual click-outside event propagation handlers and z-index indexing management.',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'adr-3',
          organization_id: organizationId,
          project_id: projectId,
          title: 'ADR-003: Row-Level Security (RLS) via Supabase for Multi-Tenancy',
          status: 'proposed',
          technical_domain: 'security',
          context: 'We require military-grade tenant isolation between enterprise customer workspaces without bloating application layer router code.',
          decision: 'Enforce database-level PostgreSQL RLS policies tied directly to JWT authorization session claims (organization_id).',
          consequences: 'All custom server functions and analytics migrations must pass active security invoker credentials.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [projectId, organizationId])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this architectural decision record from the historical ledger?')) return
    setDeletingId(id)
    await deleteAdr(id, projectId)
    setDeletingId(null)
    setAdrs((prev) => prev.filter((item) => item.id !== id))
    if (activePreviewId === id) setActivePreviewId(null)
    showToast('success', 'Architectural decision record removed successfully.')
  }

  const filteredAdrs = adrs.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.context.toLowerCase().includes(search.toLowerCase()) ||
                          item.decision.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesDomain = domainFilter === 'all' || item.technical_domain === domainFilter
    return matchesSearch && matchesStatus && matchesDomain
  })

  const getStatusBadge = (status: AdrStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        )
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Proposed
          </span>
        )
      case 'superseded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw className="w-3.5 h-3.5" /> Superseded
          </span>
        )
      case 'deprecated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Deprecated
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        )
    }
  }

  const getDomainLabel = (domain: AdrDomain) => {
    const map: Record<AdrDomain, string> = {
      backend: 'Backend & Services',
      frontend: 'Frontend & UI/UX',
      database: 'Database & Storage',
      infrastructure: 'DevOps & Infra',
      security: 'Security & Auth',
      ai_data: 'AI & Data Pipelines'
    }
    return map[domain] || domain
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Architecture Decision Records (ADRs)
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {methodology} ready
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Immutable technical ledger for capturing design trade-offs, system rationale, and preventing architectural drift across Sprints and Phase Gates.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAdr(null)
            setIsModalOpen(true)
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Author New ADR
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-app-surface/60 border border-app-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search records by title, context, or decision..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-app-input border border-app-border text-app-fg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <EnterpriseSelect
              value={domainFilter}
              onChange={(val) => setDomainFilter(val)}
              options={[
                { value: 'all', label: 'All Domains', description: 'Show decisions across all technical sectors' },
                { value: 'backend', label: 'Backend & Services', description: 'Server architecture & microservices' },
                { value: 'frontend', label: 'Frontend & UI/UX', description: 'React & user interfaces' },
                { value: 'database', label: 'Database & Storage', description: 'PostgreSQL & data models' },
                { value: 'infrastructure', label: 'DevOps & Infra', description: 'Cloud deployment pipelines' },
                { value: 'security', label: 'Security & Auth', description: 'SSO, RLS & encryption' },
                { value: 'ai_data', label: 'AI & Data Pipelines', description: 'LLMs & analytics telemetry' }
              ]}
            />
          </div>

          <div className="w-40">
            <EnterpriseSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Statuses', description: 'Show all lifecycle states' },
                { value: 'accepted', label: 'Accepted Only', description: 'Active governing engineering standards' },
                { value: 'proposed', label: 'Proposed Only', description: 'Under active architectural review' },
                { value: 'superseded', label: 'Superseded Only', description: 'Replaced legacy records' },
                { value: 'deprecated', label: 'Deprecated Only', description: 'Retired patterns' },
                { value: 'rejected', label: 'Rejected Only', description: 'Declined approaches' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main ADR List & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List Pane */}
        <div className={`space-y-3 transition-all duration-300 ${activePreviewId ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="p-12 text-center text-app-muted font-medium animate-pulse bg-app-surface border border-app-border rounded-2xl">
              Loading architectural records ledger...
            </div>
          ) : filteredAdrs.length === 0 ? (
            <div className="p-16 text-center bg-app-surface border border-app-border rounded-2xl space-y-3">
              <BookOpen className="w-12 h-12 text-app-subtle mx-auto stroke-1" />
              <h3 className="text-lg font-bold text-app-fg">No architectural records found</h3>
              <p className="text-sm text-app-muted max-w-md mx-auto">
                No decisions match your active filtering criteria. Click the button above to author a new Technical Decision Record.
              </p>
            </div>
          ) : (
            filteredAdrs.map((item) => {
              const isSelected = activePreviewId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setActivePreviewId(isSelected ? null : item.id)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-app-surface hover:bg-app-input border-app-border shadow-sm hover:border-app-border/80'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      {getStatusBadge(item.status)}
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-app-input border border-app-border text-app-subtle font-semibold">
                        {getDomainLabel(item.technical_domain)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-app-fg tracking-tight group-hover:text-indigo-400">
                      {item.title}
                    </h3>
                    <p className="text-xs text-app-muted line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-app-fg">Decision: </span>{item.decision}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className={`flex items-center gap-1.5 transition-all duration-200 ${deletingId === item.id || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAdr(item)
                          setIsModalOpen(true)
                        }}
                        className="p-2 rounded-xl border border-app-border hover:bg-app-surface text-app-muted hover:text-app-fg transition-colors cursor-pointer"
                        title="Edit record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-xl border border-app-border hover:bg-red-500/10 text-app-muted hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        {deletingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-app-muted transition-transform ${isSelected ? 'rotate-90 md:rotate-0 text-indigo-400 font-bold' : ''}`} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Detail Preview Panel */}
        {activePreviewId && (
          <div className="lg:col-span-6 animate-fade-in">
            {(() => {
              const item = adrs.find((a) => a.id === activePreviewId)
              if (!item) return null
              return (
                <div className="sticky top-6 p-6 rounded-2xl bg-app-surface border border-app-border shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-app-border pb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Architectural Specification View
                      </span>
                      <h3 className="text-lg font-black text-app-fg leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActivePreviewId(null)}
                      className="text-app-muted hover:text-app-fg text-sm font-semibold px-2 py-1 rounded-lg hover:bg-app-input"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-1.5">
                      <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                        1. Problem Context & Architectural Need
                      </h4>
                      <p className="text-app-fg text-xs leading-relaxed font-normal">
                        {item.context}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
                      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                        2. Agreed Technical Decision & Rationale
                      </h4>
                      <p className="text-app-fg text-xs leading-relaxed font-medium">
                        {item.decision}
                      </p>
                    </div>

                    {item.consequences && (
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1.5">
                        <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                          3. Accepted Trade-offs & Consequences
                        </h4>
                        <p className="text-app-fg text-xs leading-relaxed font-normal">
                          {item.consequences}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-app-subtle">
                    <div className="flex items-center gap-4">
                      <span>Logged: {new Date(item.created_at).toLocaleDateString()}</span>
                      <span>Status: <strong className="text-app-fg uppercase font-bold">{item.status}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAdr(item)
                          setIsModalOpen(true)
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-app-input border border-app-border hover:border-indigo-500/50 text-app-fg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:text-indigo-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Edit Record
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deletingId === item.id}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:text-red-300"
                      >
                        {deletingId === item.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <AdrStudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId || ''}
        organizationId={organizationId}
        initialData={selectedAdr}
        onSuccess={(updatedRecord) => {
          setAdrs((prev) => {
            const exists = prev.some((i) => i.id === updatedRecord.id)
            if (exists) {
              return prev.map((i) => (i.id === updatedRecord.id ? updatedRecord : i))
            }
            return [updatedRecord, ...prev]
          })
        }}
        onShowToast={showToast}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
