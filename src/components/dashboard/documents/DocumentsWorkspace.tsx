'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, ChevronLeft, ChevronRight, Layers, FileSearch, History, Calendar, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import ProjectDocument from './ProjectDocument'
import { getReportSnapshots } from '@/lib/documents/actions'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import { useSearchParams } from 'next/navigation'
import { ClosureDocumentsRouter, ClosureDocType } from './closure/ClosureDocumentsRouter'
import { ClosureSidebarSection } from './closure/ClosureSidebarSection'
import { PlanningSidebarSection } from './planning/PlanningSidebarSection'
import { PlanningDocumentsRouter, PlanningDocType } from './planning/PlanningDocumentsRouter'

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
  const searchParams = useSearchParams()
  const initialDoc = searchParams.get('doc') as string | null
  
  const [activeTab, setActiveTab] = useState<string>(initialDoc || 'charter')
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [toasts, setToasts] = useState<ToastMessage[]>([])


  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const loadSnapshots = async () => {
    if (activeTab === 'status_report') {
      const snaps = await getReportSnapshots(projectId, 'status_report')
      setSnapshots(snaps)
    }
  }

  useEffect(() => {
    loadSnapshots()
    // Whenever tab changes, reset snapshot id unless we specifically set it
    if (activeTab !== 'status_report') {
      setActiveSnapshotId(null)
    }
  }, [activeTab, projectId])

  // Custom event listener to reload snapshots when a new one is saved
  useEffect(() => {
    const handleSnapshotSaved = () => {
      loadSnapshots()
    }
    window.addEventListener('snapshot-saved', handleSnapshotSaved)
    return () => window.removeEventListener('snapshot-saved', handleSnapshotSaved)
  }, [projectId, activeTab])

  return (
    <div className="flex flex-col md:flex-row gap-6 relative animate-fade-in h-[calc(100vh-16rem)] min-h-[600px]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Expand Button (Visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="absolute left-0 top-0 z-10 h-full flex items-start pt-2 -ml-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-surface border border-transparent hover:border-app-border rounded-md transition-colors bg-app-bg shadow-sm"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Left Sidebar Menu for Documents */}
      <div 
        className={`shrink-0 flex flex-col transition-all duration-300 ease-in-out h-full overflow-y-auto no-scrollbar ${
          isSidebarOpen ? 'w-full md:w-64 border-r border-app-border pr-6 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pl-2 min-w-[200px]">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider">
            Project Documents
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-surface border border-transparent hover:border-app-border rounded-md transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
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
              Registers
            </div>

            <button 
              onClick={() => setActiveTab('stakeholder_register')}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'stakeholder_register'
                  ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              Stakeholder Register
            </button>

            <button 
              onClick={() => setActiveTab('risk_register')}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'risk_register'
                  ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              Risk Register
            </button>

            <div className="text-xs font-bold text-app-muted uppercase tracking-wider mt-6 mb-2 pl-2">
              Reports
            </div>

            <button 
              onClick={() => { setActiveTab('status_report'); setActiveSnapshotId(null) }}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'status_report' && !activeSnapshotId
                  ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              New Status Report
            </button>

            {activeTab === 'status_report' && snapshots.length > 0 && (
              <div className="mt-4 flex flex-col gap-1 pl-4 border-l-2 border-app-border ml-2">
                <div className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                  <History className="w-3 h-3" /> Report History
                </div>
                {snapshots.map((snap) => (
                  <button
                    key={snap.id}
                    onClick={() => { setActiveTab('status_report'); setActiveSnapshotId(snap.id) }}
                    className={`text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center gap-2 ${
                      activeSnapshotId === snap.id
                        ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                        : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(snap.period_end || snap.generated_at).toLocaleDateString()}
                  </button>
                ))}
              </div>
            )}

            <PlanningSidebarSection
              activeTab={activeTab}
              onSelect={(doc) => {
                setActiveTab(doc)
                setActiveSnapshotId(null)
              }}
            />

            <ClosureSidebarSection
              activeTab={activeTab}
              onSelect={(doc) => {
                setActiveTab(doc)
                setActiveSnapshotId(null)
              }}
            />
          </div>
        )}
      </div>

      {/* Main Document Engine Area */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        {['charter', 'wbs_dictionary', 'raci', 'status_report', 'stakeholder_register', 'risk_register'].includes(activeTab) && (
          <ProjectDocument
            key={activeTab + (activeSnapshotId || 'draft')}
            documentType={activeTab}
            projectId={projectId}
            projectContext={projectContext}
            hasEditAccess={hasEditAccess}
            onShowToast={showToast}
            isSnapshot={!!activeSnapshotId}
            snapshotId={activeSnapshotId || undefined}
          />
        )}

        {['closure_report', 'lessons_learned', 'handover_document', 'post_implementation_review', 'signoff_board'].includes(activeTab) && (
          <ClosureDocumentsRouter
            documentType={activeTab as ClosureDocType}
            projectId={projectId}
            hasEditAccess={hasEditAccess}
            currentLifecycle={projectContext?.lifecycle_status || 'Execution'}
            onShowToast={showToast}
          />
        )}

        {['scope_statement', 'communication_plan', 'quality_management_plan', 'procurement_plan'].includes(activeTab) && (
          <PlanningDocumentsRouter
            documentType={activeTab as PlanningDocType}
            projectId={projectId}
            hasEditAccess={hasEditAccess}
            onShowToast={showToast}
          />
        )}
      </div>
    </div>
  )
}
