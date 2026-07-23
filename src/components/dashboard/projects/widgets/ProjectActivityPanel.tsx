'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Activity, ShieldAlert, FileText, Briefcase, ListTodo, CheckSquare, 
  DollarSign, Users, MessageSquare, PlusCircle, Edit3, Trash2, 
  UploadCloud, CheckCircle, XCircle, Send, X, Search, Filter, 
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'
import { useProjectActivity, ProjectActivityLog } from '../hooks/useProjectActivity'
import { ActivityEntityType, ActivityActionType, deleteProjectActivityLogs } from '@/lib/projects/activity-actions'

export default function ProjectActivityPanel({ 
  projectId, 
  isOpen, 
  onClose 
}: { 
  projectId: string
  isOpen: boolean
  onClose: () => void 
}) {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState<ActivityEntityType | 'all'>('all')
  const [actionFilter, setActionFilter] = useState<ActivityActionType | 'all'>('all')

  const { logs, totalCount, totalPages, loading, error } = useProjectActivity(projectId, {
    page,
    pageSize: 20,
    searchQuery,
    entityFilter,
    actionFilter
  })

  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelection = (id: string) => {
    const next = new Set(selectedLogIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedLogIds(next)
  }

  const handleDeleteSelected = async () => {
    if (selectedLogIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedLogIds.size} log(s)?`)) return
    
    setIsDeleting(true)
    try {
      const { ok, error } = await deleteProjectActivityLogs(Array.from(selectedLogIds))
      if (!ok) throw new Error(error || 'Failed to delete logs')
      setSelectedLogIds(new Set())
      // Refetch page 1 on delete
      setPage(1)
      window.location.reload() // Or just rely on real-time / refetch if exposed by hook
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'project': return <Briefcase className="w-4 h-4 text-indigo-500" />
      case 'wbs_element': return <ListTodo className="w-4 h-4 text-emerald-500" />
      case 'activity': return <CheckSquare className="w-4 h-4 text-blue-500" />
      case 'cost_account': 
      case 'baseline':
      case 'budget_baseline': return <DollarSign className="w-4 h-4 text-amber-500" />
      case 'stakeholder': 
      case 'raci': return <Users className="w-4 h-4 text-purple-500" />
      case 'risk': 
      case 'issue': return <ShieldAlert className="w-4 h-4 text-rose-500" />
      case 'document': 
      case 'status_report': return <FileText className="w-4 h-4 text-cyan-500" />
      case 'approval_request': return <CheckCircle className="w-4 h-4 text-teal-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-gray-500" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><PlusCircle className="w-3 h-3" /> CREATED</span>
      case 'updated': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"><Edit3 className="w-3 h-3" /> UPDATED</span>
      case 'deleted': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"><Trash2 className="w-3 h-3" /> DELETED</span>
      case 'uploaded': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"><UploadCloud className="w-3 h-3" /> UPLOADED</span>
      case 'approved': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"><CheckCircle className="w-3 h-3" /> APPROVED</span>
      case 'rejected': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"><XCircle className="w-3 h-3" /> REJECTED</span>
      case 'published': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"><Send className="w-3 h-3" /> PUBLISHED</span>
      default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400">{action.toUpperCase()}</span>
    }
  }

  const getEntityDisplayLabel = (log: ProjectActivityLog) => {
    if (log.entity_type === 'comment') {
      return `Comment: "${log.detail?.body_snippet || log.entity_id}"`
    }
    const title = log.detail?.name || log.detail?.title || log.detail?.document_type || log.entity_id
    
    if (log.entity_type === 'activity' && log.detail?.field) {
      let actionStr = ''
      switch (log.detail.field) {
        case 'dependency_added': actionStr = ' (Added dependency)'; break;
        case 'dependency_removed': actionStr = ' (Removed dependency)'; break;
        case 'constraint': actionStr = ' (Updated timeline)'; break;
        case 'duration': actionStr = ' (Updated duration)'; break;
        case 'scheduling': actionStr = ' (Updated schedule)'; break;
      }
      return `Activity: ${title}${actionStr}`
    }

    const typeLabel = log.entity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${typeLabel}: ${title}`
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-app-surface border-l border-app-border shadow-2xl flex flex-col z-50 animate-fade-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-app-border flex items-center justify-between bg-gray-50/50 dark:bg-app-surface-alt/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-app-fg tracking-tight">Project Activity</h3>
              <p className="text-xs text-app-muted mt-0.5">Live stream of all project events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedLogIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete ({selectedLogIds.size})
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="p-4 border-b border-app-border space-y-3 shrink-0 bg-white dark:bg-app-surface">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-app-muted" />
            </div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="block w-full pl-9 pr-3 py-2 border border-app-border rounded-lg bg-app-surface text-sm text-app-fg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value as any)
                  setPage(1)
                }}
                className="w-full bg-app-surface border border-app-border rounded-lg pl-3 pr-8 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="all">All Modules</option>
                <option value="wbs_element">WBS Element</option>
                <option value="activity">Activity</option>
                <option value="risk">Risk</option>
                <option value="issue">Issue</option>
                <option value="document">Document</option>
                <option value="stakeholder">Stakeholder</option>
                <option value="budget_baseline">Budget Baseline</option>
                <option value="schedule_baseline">Schedule Baseline</option>
                <option value="approval_request">Approval Request</option>
              </select>
            </div>

            <div className="relative flex-1">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value as any)
                  setPage(1)
                }}
                className="w-full bg-app-surface border border-app-border rounded-lg pl-3 pr-8 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="all">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-app-surface">
          {error ? (
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/10 rounded-xl text-center">
              <p className="text-sm text-red-600 font-medium">Failed to load project activity.</p>
            </div>
          ) : loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 bg-white dark:bg-gray-800 border border-app-border rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Filter className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-app-subtle">No activity found</p>
              <p className="text-xs text-app-muted mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-6 relative">
              <div className="absolute top-2 bottom-2 left-4 w-px bg-gray-200 dark:bg-gray-800 z-0"></div>
              {logs.map((log) => {
                const actorName = log.profiles?.full_name || log.profiles?.email?.split('@')[0] || 'Unknown User'
                const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
                
                const isSelected = selectedLogIds.has(log.id)

                return (
                  <div key={log.id} className="relative z-10 flex gap-4 items-start group">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-app-surface border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-sm relative">
                      <div className={`absolute inset-0 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/20 transition-opacity cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={() => toggleSelection(log.id)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-app-surface'}`}>
                          {isSelected && <CheckCircle className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className={`transition-opacity ${isSelected || 'group-hover:opacity-0'}`}>
                        {getEntityIcon(log.entity_type)}
                      </div>
                    </div>
                    <div 
                      className={`flex-1 bg-white dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/40 border rounded-2xl p-3 shadow-sm transition-colors cursor-pointer ${isSelected ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-gray-100 dark:border-gray-800/50'}`}
                      onClick={() => toggleSelection(log.id)}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <p className="text-sm text-app-fg">
                          <span className="font-semibold">{actorName}</span>
                        </p>
                        <span className="text-xs text-app-muted shrink-0">{timeAgo}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-sm font-medium text-app-subtle">{getEntityDisplayLabel(log)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-app-border bg-gray-50/50 dark:bg-app-surface-alt/30 shrink-0 flex items-center justify-between">
          <p className="text-xs font-medium text-app-muted">
            {totalCount > 0 ? (
              <>Showing <span className="text-app-fg">{(page - 1) * 20 + 1}</span> to <span className="text-app-fg">{Math.min(page * 20, totalCount)}</span> of <span className="text-app-fg">{totalCount}</span></>
            ) : (
              '0 results'
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-app-border bg-white dark:bg-app-surface text-app-fg hover:bg-gray-50 dark:hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-app-fg">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-app-border bg-white dark:bg-app-surface text-app-fg hover:bg-gray-50 dark:hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
