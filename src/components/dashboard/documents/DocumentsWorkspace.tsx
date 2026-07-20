'use client'

import { useState } from 'react'
import { FileText, FileSearch, Layers, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import ProjectDocument from './ProjectDocument'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 relative animate-fade-in h-[calc(100vh-16rem)] min-h-[600px]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Left Sidebar Menu for Documents */}
      <div 
        className={`shrink-0 flex flex-col transition-all duration-300 ease-in-out border-app-border h-full overflow-y-auto no-scrollbar ${
          isSidebarOpen ? 'w-full md:w-64 border-r pr-6 bg-transparent' : 'w-12 border-transparent bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pl-2">
          {isSidebarOpen && (
            <div className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Project Documents
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-surface border border-transparent hover:border-app-border rounded-md transition-colors"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>
        
        {isSidebarOpen && (
          <div className="flex flex-col gap-2">
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

            <button 
              onClick={() => setActiveTab('wbs_dictionary')}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'wbs_dictionary'
                  ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              WBS Dictionary
            </button>

            <button 
              onClick={() => setActiveTab('raci')}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'raci'
                  ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              RACI Matrix
            </button>

            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mt-6 mb-2 pl-2">
              Coming Soon (Sprint 14)
            </div>

            <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-app-muted/50 cursor-not-allowed">
              <FileText className="w-4 h-4" />
              Status Report
            </button>
          </div>
        )}
      </div>

      {/* Main Document Engine Area */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {['charter', 'wbs_dictionary', 'raci'].includes(activeTab) && (
          <ProjectDocument
            documentType={activeTab}
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
