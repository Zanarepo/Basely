'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, AlertCircle, Edit2, Trash2, MessageSquare } from 'lucide-react'
import type { Risk, Issue } from './useRiskData'
import IssueForm from './IssueForm'
import { deleteIssue } from '@/lib/risks/actions'

interface IssueListProps {
  projectId: string
  issues: Issue[]
  risks: Risk[]
  stakeholders: any[]
  hasEditAccess: boolean
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
  onRefresh: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  initialOpenId?: string | null
}

export default function IssueList({
  projectId,
  issues,
  risks,
  stakeholders,
  hasEditAccess,
  workspaceMembers,
  onRefresh,
  onShowToast,
  initialOpenId,
}: IssueListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [scrollToComments, setScrollToComments] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Auto-open a specific issue when navigating from entity references
  useEffect(() => {
    if (initialOpenId && issues.length > 0) {
      const issue = issues.find(i => i.id === initialOpenId)
      if (issue) {
        setEditingIssue(issue)
        setIsFormOpen(true)
      }
    }
  }, [initialOpenId, issues.length])

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const matchesSearch =
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [issues, searchTerm, statusFilter])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the issue "${title}"?`)) return
    setDeletingId(id)
    const result = await deleteIssue(id, projectId)
    setDeletingId(null)
    if (result.ok) {
      onShowToast?.('success', 'Issue deleted successfully')
      onRefresh()
    } else {
      onShowToast?.('error', `Failed to delete issue: ${result.error}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-500/10 text-red-700 border-red-500/20'
      case 'In Progress': return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      case 'Closed': return 'bg-slate-500/10 text-slate-700 border-slate-500/20'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    }
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
              placeholder="Search issues..."
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {hasEditAccess && (
          <button
            onClick={() => {
              setEditingIssue(null)
              setScrollToComments(false)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Log Issue
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-4 flex-1 overflow-auto">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-app-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-app-fg mb-1">No issues found</h3>
            <p className="text-app-muted text-sm">
              {issues.length === 0
                ? "You haven't logged any issues yet. That's a good thing! But if something comes up, log it here."
                : "No issues match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.map((issue) => {
              const owner = stakeholders.find((s) => s.id === issue.owner_stakeholder_id)
              const risk = risks.find((r) => r.id === issue.linked_risk_id)

              return (
                <div
                  key={issue.id}
                  className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                      <h3 className="text-base font-semibold text-app-fg line-clamp-1">{issue.title}</h3>
                    </div>
                    {issue.description && (
                      <p className="text-sm text-app-muted line-clamp-2 mb-3">{issue.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-app-muted font-medium">
                      <span className="flex items-center gap-1.5">
                        Raised: <span className="text-app-fg">{new Date(issue.raised_date).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        Owner: <span className="text-app-fg">{owner?.name || 'Unassigned'}</span>
                      </span>
                      {risk && (
                        <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          Risk: {risk.title}
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
                        setEditingIssue(issue)
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
                            setEditingIssue(issue)
                            setScrollToComments(false)
                            setIsFormOpen(true)
                          }}
                          className="p-2 text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Issue"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(issue.id, issue.title)}
                          disabled={deletingId === issue.id}
                          className="p-2 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Issue"
                        >
                          <Trash2 className={`h-4 w-4 ${deletingId === issue.id ? 'animate-pulse' : ''}`} />
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
        <IssueForm
          projectId={projectId}
          workspaceMembers={workspaceMembers}
          stakeholders={stakeholders}
          risks={risks}
          existingIssue={editingIssue}
          scrollToComments={scrollToComments}
          onClose={() => {
            setIsFormOpen(false)
            setEditingIssue(null)
            setScrollToComments(false)
          }}
          onSuccess={() => {
            setIsFormOpen(false)
            setEditingIssue(null)
            setScrollToComments(false)
            onShowToast?.('success', editingIssue ? 'Issue updated successfully' : 'Issue logged successfully')
            onRefresh()
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  )
}
