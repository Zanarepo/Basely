'use client'

import { BookOpen, CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw, Edit3, Trash2, ChevronRight } from 'lucide-react'
import type { ArchitectureDecisionRecord, AdrStatus, AdrDomain } from '@/lib/adr/actions'

interface AdrListPaneProps {
  loading: boolean
  filteredAdrs: ArchitectureDecisionRecord[]
  activePreviewId: string | null
  setActivePreviewId: (id: string | null) => void
  deletingId: string | null
  onEditClick: (item: ArchitectureDecisionRecord) => void
  onDeleteClick: (id: string, e: React.MouseEvent) => void
  onWorkflowClick: (item: ArchitectureDecisionRecord) => void
}

export function AdrListPane({
  loading,
  filteredAdrs,
  activePreviewId,
  setActivePreviewId,
  deletingId,
  onEditClick,
  onDeleteClick,
  onWorkflowClick
}: AdrListPaneProps) {
  
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
      ai_data: 'Praz-AI & Data Pipelines'
    }
    return map[domain] || domain
  }

  return (
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
                      ? 'bg-violet-500/10 border-violet-500/40 shadow-md ring-1 ring-violet-500/30'
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
                    <h3 className="text-base font-bold text-app-fg tracking-tight group-hover:text-violet-400">
                      {item.title}
                    </h3>
                    <p className="text-xs text-app-muted line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-app-fg">Decision: </span>{item.decision}
                    </p>

                    {/* Workflow CTA — only for accepted ADRs */}
                    {item.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onWorkflowClick(item)
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/25 transition-all cursor-pointer animate-pulse hover:animate-none"
                      >
                        ⚡ Activate Workflows
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className={`flex items-center gap-1.5 transition-all duration-200 ${deletingId === item.id || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditClick(item)
                        }}
                        className="p-2 rounded-xl border border-app-border hover:bg-app-surface text-app-muted hover:text-app-fg transition-colors cursor-pointer"
                        title="Edit record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => onDeleteClick(item.id, e)}
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
                    <ChevronRight className={`w-5 h-5 text-app-muted transition-transform ${isSelected ? 'rotate-90 md:rotate-0 text-violet-400 font-bold' : ''}`} />
                  </div>
                </div>
              )
            })
          )}
        </div>
  )
}
