'use client'

import { useState } from 'react'
import { useChangeRequests } from './useChangeRequests'
import { ChangeRequestItem } from './ChangeRequestItem'
import { NewChangeRequestModal } from './NewChangeRequestModal'
import { DocumentLoader } from '../DocumentLoader'
import { FileEdit, Plus, RefreshCw, AlertCircle } from 'lucide-react'

interface ChangeRequestLogProps {
  projectId: string
  hasEditAccess?: boolean
  isManager?: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ChangeRequestLog({ projectId, hasEditAccess, isManager, onShowToast }: ChangeRequestLogProps) {
  const { logs, loading, error, createLog, updateLogStatus, deleteLog, refresh } = useChangeRequests(projectId)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isApprovalWorkflow = logs.length > 0 && logs[0].source === 'approval_workflow'

  return (
    <div className="flex flex-col h-full bg-app-bg rounded-2xl overflow-hidden border border-app-border animate-in fade-in duration-300">
      <div className="flex-none p-4 sm:p-6 bg-app-surface border-b border-app-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <FileEdit className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">Change Request Log</h2>
              <p className="text-xs sm:text-sm text-app-muted truncate">
                Track project change requests and their outcomes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={refresh}
              className="p-2.5 rounded-xl bg-app-bg border border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
            {hasEditAccess !== false && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Change</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading && logs.length === 0 ? (
          <DocumentLoader message="Fetching change request logs..." />
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-app-surface rounded-xl border border-dashed border-app-border">
            <FileEdit className="w-12 h-12 text-app-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-app-fg mb-2">No change requests logged</h3>
            <p className="text-app-muted max-w-sm mx-auto text-sm">
              Changes requested to scope, schedule, or budget will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <ChangeRequestItem 
                key={log.id} 
                entry={log} 
                onUpdateStatus={async (id, outcome) => {
                  try {
                    await updateLogStatus(id, outcome)
                    onShowToast?.('success', `Change request marked as ${outcome}`)
                  } catch (err: any) {
                    onShowToast?.('error', err.message || 'Failed to update status')
                  }
                }}
                isManager={isManager}
                onDelete={async (id) => {
                  try {
                    await deleteLog(id)
                    onShowToast?.('success', 'Change request deleted')
                  } catch (err: any) {
                    onShowToast?.('error', err.message || 'Failed to delete')
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <NewChangeRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createLog}
      />
    </div>
  )
}
