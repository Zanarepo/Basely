'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Cpu, Layers, CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw, FileText, ChevronRight, Trash2, Edit3, ShieldAlert, BookOpen } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import AdrStudioModal from './AdrStudioModal'
import { getAdrs, deleteAdr, type ArchitectureDecisionRecord, type AdrStatus, type AdrDomain } from '@/lib/adr/actions'
import { ToastContainer } from '@/components/dashboard/Toast'
import { useWbsToasts } from '@/components/dashboard/wbs/workspace/hooks/useWbsToasts'
import { AdrWorkflowPanel } from './AdrWorkflowPanel'

import { AdrHeader } from './components/AdrHeader'
import { AdrFilterToolbar } from './components/AdrFilterToolbar'
import { AdrListPane } from './components/AdrListPane'
import { AdrPreviewPane } from './components/AdrPreviewPane'

interface AdrWorkspaceProps {
  projectId?: string
  organizationId: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
  tier?: string
  aiEnabled?: boolean
}

export default function AdrWorkspace({
  projectId,
  organizationId,
  methodology = 'hybrid',
  tier = 'free',
  aiEnabled = false
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
  const [workflowAdr, setWorkflowAdr] = useState<ArchitectureDecisionRecord | null>(null)
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


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <AdrHeader 
        methodology={methodology} 
        onNewClick={() => {
          setSelectedAdr(null)
          setIsModalOpen(true)
        }} 
      />

      {/* Filter Toolbar */}
      <AdrFilterToolbar 
        search={search}
        setSearch={setSearch}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Main ADR List & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List Pane */}
        <AdrListPane 
          loading={loading}
          filteredAdrs={filteredAdrs}
          activePreviewId={activePreviewId}
          setActivePreviewId={setActivePreviewId}
          deletingId={deletingId}
          onEditClick={(item) => {
            setSelectedAdr(item)
            setIsModalOpen(true)
          }}
          onDeleteClick={handleDelete}
          onWorkflowClick={(item) => {
            setWorkflowAdr(item)
          }}
        />

        {/* Detail Preview Panel */}
        {activePreviewId && (
          <div className="lg:col-span-6 animate-fade-in">
            {(() => {
              const item = adrs.find((a) => a.id === activePreviewId)
              if (!item) return null
              return (
                <AdrPreviewPane
                  item={item}
                  deletingId={deletingId}
                  onClose={() => setActivePreviewId(null)}
                  onEditClick={(item) => {
                    setSelectedAdr(item)
                    setIsModalOpen(true)
                  }}
                  onDeleteClick={handleDelete}
                />
              )
            })()}
          </div>
        )}
      </div>

      <AdrStudioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAdr(null)
        }}
        projectId={projectId!}
        organizationId={organizationId}
        initialData={selectedAdr}
        tier={tier}
        aiEnabled={aiEnabled}
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

      {/* Workflow Panel — slides in when "Activate Workflows" is clicked on an accepted ADR */}
      {workflowAdr && (
        <AdrWorkflowPanel
          adr={workflowAdr}
          projectId={projectId!}
          organizationId={organizationId}
          tier={tier}
          methodology={methodology}
          onClose={() => setWorkflowAdr(null)}
          onShowToast={showToast}
          onRaidSuccess={() => showToast('success', 'RAID entry added from ADR.')}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

