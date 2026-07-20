'use client'

import { useState } from 'react'
import { FileText, FileSearch, Layers } from 'lucide-react'
import ProjectCharter from './ProjectCharter'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

interface DocumentsWorkspaceProps {
  projectId: string
  projectContext: any
  hasEditAccess: boolean
}

export default function DocumentsWorkspace({
  projectId,
  projectContext,
  hasEditAccess,
}: DocumentsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'charter' | 'wbs_dictionary' | 'raci' | 'status'>('charter')
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 relative animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Left Sidebar Menu for Documents */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 pl-2">
          Project Documents
        </div>
        
        <button
          onClick={() => setActiveTab('charter')}
          className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
            activeTab === 'charter'
              ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
          }`}
        >
          <FileText className="w-4 h-4" />
          Project Charter
        </button>

        <div className="text-xs font-bold text-app-muted uppercase tracking-wider mt-6 mb-2 pl-2">
          Coming Soon (Sprint 13-14)
        </div>

        <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-app-muted/50 cursor-not-allowed">
          <Layers className="w-4 h-4" />
          WBS Dictionary
        </button>

        <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-app-muted/50 cursor-not-allowed">
          <FileSearch className="w-4 h-4" />
          RACI Matrix
        </button>

        <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-app-muted/50 cursor-not-allowed">
          <FileText className="w-4 h-4" />
          Status Report
        </button>
      </div>

      {/* Main Document Engine Area */}
      <div className="flex-1 min-w-0 h-[800px]">
        {activeTab === 'charter' && (
          <ProjectCharter
            projectId={projectId}
            projectContext={projectContext}
            hasEditAccess={hasEditAccess}
            onShowToast={showToast}
          />
        )}
      </div>
    </div>
  )
}
