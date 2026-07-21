'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { useRiskData } from './useRiskData'
import RiskList from './RiskList'
import IssueList from './IssueList'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import { useSearchParams } from 'next/navigation'

interface RiskRegisterWorkspaceProps {
  projectId: string
  hasEditAccess: boolean
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
}

export default function RiskRegisterWorkspace({
  projectId,
  hasEditAccess,
  workspaceMembers,
}: RiskRegisterWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'risks' | 'issues'>('risks')
  const { risks, issues, stakeholders, loading, error, refresh } = useRiskData(projectId)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const searchParams = useSearchParams()
  const [initialRiskId, setInitialRiskId] = useState<string | null>(null)
  const [initialIssueId, setInitialIssueId] = useState<string | null>(null)

  // Auto-open a specific risk or issue when navigating from entity references
  useEffect(() => {
    const riskId = searchParams.get('riskId')
    const issueId = searchParams.get('issueId')
    if (riskId) {
      setActiveTab('risks')
      setInitialRiskId(riskId)
    } else if (issueId) {
      setActiveTab('issues')
      setInitialIssueId(issueId)
    }
  }, [searchParams])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[800px] animate-fade-in">
      {/* Header and Tabs */}
      <div className="p-5 border-b border-app-border bg-app-surface-solid flex items-center justify-between z-10 sticky top-0">
        <div className="flex space-x-2 bg-app-bg p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('risks')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'risks'
                ? 'bg-app-surface shadow-sm text-indigo-500'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Risk Register
            <span className="ml-1.5 bg-app-bg px-2 py-0.5 rounded-full text-xs text-app-fg border border-app-border">
              {risks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'issues'
                ? 'bg-app-surface shadow-sm text-red-500'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
          >
            <AlertCircle className="h-4 w-4" />
            Issue Log
            <span className="ml-1.5 bg-app-bg px-2 py-0.5 rounded-full text-xs text-app-fg border border-app-border">
              {issues.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-app-bg relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-app-bg/50 backdrop-blur-sm z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Failed to load data: {error}
          </div>
        ) : activeTab === 'risks' ? (
          <RiskList
            projectId={projectId}
            risks={risks}
            issues={issues}
            stakeholders={stakeholders}
            hasEditAccess={hasEditAccess}
            workspaceMembers={workspaceMembers}
            onRefresh={refresh}
            onShowToast={showToast}
            initialOpenId={initialRiskId}
          />
        ) : (
          <IssueList
            projectId={projectId}
            issues={issues}
            risks={risks}
            stakeholders={stakeholders}
            hasEditAccess={hasEditAccess}
            workspaceMembers={workspaceMembers}
            onRefresh={refresh}
            onShowToast={showToast}
            initialOpenId={initialIssueId}
          />
        )}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
