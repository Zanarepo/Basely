'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Filter, ShieldAlert, ArrowUpDown, MoreVertical, Edit2, Trash2, AlertCircle, MessageSquare } from 'lucide-react'
import type { Risk, Issue } from './useRiskData'
import RiskForm from './RiskForm'
import { deleteRisk } from '@/lib/risks/actions'

interface RiskListProps {
  projectId: string
  risks: Risk[]
  issues: Issue[]
  stakeholders: any[]
  hasEditAccess: boolean
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
  onRefresh: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  initialOpenId?: string | null
}

export default function RiskList({
  projectId,
  risks,
  issues,
  stakeholders,
  hasEditAccess,
  workspaceMembers,
  onRefresh,
  onShowToast,
  initialOpenId,
}: RiskListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [strategyFilter, setStrategyFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [scrollToComments, setScrollToComments] = useState(false)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Auto-open a specific risk when navigating from entity references
  useEffect(() => {
    if (initialOpenId && risks.length > 0) {
      const risk = risks.find(r => r.id === initialOpenId)
      if (risk) {
        setEditingRisk(risk)
        setIsFormOpen(true)
      }
    }
  }, [initialOpenId, risks.length])

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesStrategy = strategyFilter === 'all' || r.response_strategy === strategyFilter
      return matchesSearch && matchesStatus && matchesStrategy
    })
  }, [risks, searchTerm, statusFilter, strategyFilter])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the risk "${title}"?`)) return
    setDeletingId(id)
    const result = await deleteRisk(id, projectId)
    setDeletingId(null)
    if (result.ok) {
      onShowToast?.('success', 'Risk deleted successfully')
      onRefresh()
    } else {
      onShowToast?.('error', `Failed to delete risk: ${result.error}`)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'bg-red-500/10 text-red-700 border-red-500/20'
    if (score >= 8) return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="p-4 border-b border-app-border bg-app-surface sticky top-0 z-10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
            <input
              type="text"
              placeholder="Search risks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Identified">Identified</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Mitigating">Mitigating</option>
            <option value="Occurred">Occurred</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-app-bg border border-app-border rounded-lg focus:outline-none"
          >
            <option value="all">All Strategies</option>
            <option value="Avoid">Avoid</option>
            <option value="Mitigate">Mitigate</option>
            <option value="Transfer">Transfer</option>
            <option value="Accept">Accept</option>
          </select>
        </div>

        {hasEditAccess && (
          <button
            onClick={() => {
              setEditingRisk(null)
              setScrollToComments(false)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Log Risk
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-4 flex-1 overflow-auto">
        {filteredRisks.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert className="h-12 w-12 text-app-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-app-fg mb-1">No risks found</h3>
            <p className="text-app-muted text-sm">
              {risks.length === 0
                ? "You haven't logged any risks yet. Get started by logging your first risk."
                : "No risks match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRisks.map((risk) => {
              const owner = stakeholders.find((s) => s.id === risk.owner_stakeholder_id)
              const linkedIssuesCount = issues.filter(i => i.linked_risk_id === risk.id).length
              return (
                <div
                  key={risk.id}
                  className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getScoreColor(
                          risk.risk_score
                        )}`}
                        title={`Probability: ${risk.probability} x Impact: ${risk.impact}`}
                      >
                        Score: {risk.risk_score}
                      </span>
                      <h3 className="text-base font-semibold text-app-fg line-clamp-1">{risk.title}</h3>
                    </div>
                    {risk.description && (
                      <p className="text-sm text-app-muted line-clamp-2 mb-3">{risk.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-app-muted font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Status: <span className="text-app-fg">{risk.status}</span>
                      </span>
                      {risk.response_strategy && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Strategy: <span className="text-app-fg">{risk.response_strategy}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        Owner: <span className="text-app-fg">{owner?.name || 'Unassigned'}</span>
                      </span>
                      {linkedIssuesCount > 0 && (
                        <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          {linkedIssuesCount} Issue{linkedIssuesCount !== 1 && 's'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRisk(risk)
                        setScrollToComments(true)
                        setIsFormOpen(true)
                      }}
                      className="p-2 text-app-muted hover:text-indigo-400 hover:bg-app-surface border border-transparent hover:border-app-border rounded-lg transition-all"
                      title="View Comments"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    {hasEditAccess && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRisk(risk)
                            setScrollToComments(false)
                            setIsFormOpen(true)
                          }}
                          className="p-2 text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Risk"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(risk.id, risk.title)}
                          disabled={deletingId === risk.id}
                          className="p-2 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Risk"
                        >
                          <Trash2 className={`h-4 w-4 ${deletingId === risk.id ? 'animate-pulse' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      {isFormOpen && (
        <RiskForm
          projectId={projectId}
          workspaceMembers={workspaceMembers}
          stakeholders={stakeholders}
          existingRisk={editingRisk}
          scrollToComments={scrollToComments}
          onClose={() => {
            setIsFormOpen(false)
            setEditingRisk(null)
            setScrollToComments(false)
          }}
          onSuccess={() => {
            setIsFormOpen(false)
            setEditingRisk(null)
            setScrollToComments(false)
            onShowToast?.('success', editingRisk ? 'Risk updated successfully' : 'Risk created successfully')
            onRefresh()
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  )
}
