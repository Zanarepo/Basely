'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, ChevronLeft, ChevronRight, Layers, FileSearch, History, Calendar, PanelLeftClose, PanelLeftOpen, FolderKanban, Box, ChevronDown } from 'lucide-react'
import ProjectDocument from './ProjectDocument'
import { getReportSnapshots } from '@/lib/documents/actions'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import { useSearchParams } from 'next/navigation'
import { ClosureDocumentsRouter, ClosureDocType } from './closure/ClosureDocumentsRouter'
import { ClosureSidebarSection } from './closure/ClosureSidebarSection'
import { PlanningSidebarSection } from './planning/PlanningSidebarSection'
import { PlanningDocumentsRouter, PlanningDocType } from './planning/PlanningDocumentsRouter'
import { ExecutionSidebarSection, ExecutionDocType } from './execution/ExecutionSidebarSection'
import { ExecutionDocumentsRouter } from './execution/ExecutionDocumentsRouter'
import { SidebarAccordion } from './SidebarAccordion'
import { ProductSidebarSection } from './product/ProductSidebarSection'
import { ProductDocumentsRouter } from './product/ProductDocumentsRouter'

interface DocumentsWorkspaceProps {
  projectId: string
  projectContext: any
  hasEditAccess: boolean
  isManager?: boolean
}

export default function DocumentsWorkspace({
  projectId,
  projectContext,
  hasEditAccess,
  isManager = false,
}: DocumentsWorkspaceProps) {
  const searchParams = useSearchParams()
  const initialDoc = searchParams.get('doc') as string | null
  
  const [activeTab, setActiveTab] = useState<string>(initialDoc || 'charter')
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const productTabs = ['strategy_canvas_workspace', 'personas_workspace', 'north_star_kpis_workspace', 'okrs_workspace', 'voc_discovery_workspace', 'prioritization_workspace', 'roadmap_workspace', 'product_strategy_document', 'market_research_report', 'competitive_benchmarking_matrix', 'product_requirements_document']
  const [documentDomain, setDocumentDomain] = useState<'project' | 'product'>(
    productTabs.includes(initialDoc || 'charter') ? 'product' : 'project'
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)


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
    
    // Auto-sync domain if tab changes externally (e.g. hash link)
    if (productTabs.includes(activeTab)) {
      setDocumentDomain('product')
    } else {
      setDocumentDomain('project')
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

  // Listener for sub-plan direct navigation events and hash deep linking
  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab)
        setActiveSnapshotId(null)
      }
    }
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveTab(hash)
        setActiveSnapshotId(null)
      }
    }
    window.addEventListener('document-tab-change', handleTabChange as EventListener)
    window.addEventListener('hashchange', handleHashChange)
    if (window.location.hash) {
      handleHashChange()
    }
    return () => {
      window.removeEventListener('document-tab-change', handleTabChange as EventListener)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <div className="flex flex-col md:flex-row gap-6 relative animate-fade-in h-[calc(100vh-16rem)] min-h-[600px]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Expand Button & Hover Area (Visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <div 
          className="absolute left-0 top-0 z-20 h-full w-16 flex items-start pt-6 pl-0 cursor-pointer"
          onMouseEnter={() => {
            if (window.innerWidth >= 768) setIsSidebarOpen(true)
          }}
          onClick={() => setIsSidebarOpen(true)}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-l-0 border-indigo-500/20 rounded-r-2xl shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all hover:pl-4 cursor-pointer group"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}

      {/* Left Sidebar Menu for Documents */}
      <div 
        onMouseLeave={() => {
          if (window.innerWidth >= 768) setIsSidebarOpen(false)
        }}
        className={`shrink-0 flex flex-col transition-all duration-400 ease-out overflow-y-auto no-scrollbar ${
          isSidebarOpen 
            ? 'absolute z-40 w-full md:w-72 h-full md:h-[calc(100%-2rem)] md:mt-4 md:ml-4 bg-app-surface/95 backdrop-blur-2xl md:border md:border-app-border md:rounded-2xl border-r border-app-border shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] opacity-100 pr-2 pl-4 py-4 translate-x-0' 
            : 'absolute z-40 w-0 md:w-0 h-full md:h-[calc(100%-2rem)] md:mt-4 md:ml-4 bg-app-surface/95 backdrop-blur-2xl opacity-0 overflow-hidden -translate-x-8'
        }`}
      >
        <div className="flex items-center justify-between mb-6 pl-2 pr-2 min-w-[200px]">
          <div className="relative flex-1 mr-3">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                 {documentDomain === 'project' ? <FolderKanban className="w-4 h-4 text-indigo-500"/> : <Box className="w-4 h-4 text-emerald-500"/>}
                 <span>{documentDomain === 'project' ? 'Project Documents' : 'Product Suite'}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-50 top-full mt-1.5 left-0 w-[240px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl py-1 overflow-hidden animate-fade-in-up">
                 <button 
                   onClick={() => { setDocumentDomain('project'); setIsDropdownOpen(false) }}
                   className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-colors ${documentDomain === 'project' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                 >
                   <FolderKanban className="w-4 h-4" />
                   Project Documents
                 </button>
                 <button 
                   onClick={() => { setDocumentDomain('product'); setIsDropdownOpen(false) }}
                   className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-colors ${documentDomain === 'product' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                 >
                   <Box className="w-4 h-4" />
                   Product Suite
                 </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 rounded-lg transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
        
        {isSidebarOpen && (
          <nav className="flex-1 overflow-y-auto pr-2 pb-8 flex flex-col gap-1.5 custom-scrollbar">
            {documentDomain === 'project' && (
              <>
            <SidebarAccordion title="Core Documents">
              <button 
                onClick={() => { setActiveTab('charter'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'charter'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Project Charter
              </button>

              <button 
                onClick={() => { setActiveTab('wbs_dictionary'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'wbs_dictionary'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                WBS Dictionary
              </button>

              <button 
                onClick={() => { setActiveTab('raci'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'raci'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileSearch className="w-4 h-4 text-emerald-500" />
                RACI Matrix
              </button>

              <button 
                onClick={() => { setActiveTab('project_management_plan'); setActiveSnapshotId(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                style={{ cursor: 'pointer' }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'project_management_plan'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-500" />
                Project Management Plan
              </button>
            </SidebarAccordion>

            <SidebarAccordion title="Registers">
              <button 
                onClick={() => { setActiveTab('stakeholder_register'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'stakeholder_register'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-500" />
                Stakeholder Register
              </button>

              <button 
                onClick={() => { setActiveTab('risk_register'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'risk_register'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-500" />
                Risk Register
              </button>

              <button 
                onClick={() => { setActiveTab('issue_log'); setActiveSnapshotId(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                style={{ cursor: 'pointer' }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'issue_log'
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileSearch className="w-4 h-4 text-orange-500" />
                Issue Log
              </button>
            </SidebarAccordion>

            <SidebarAccordion title="Reports">
              <button 
                onClick={() => { setActiveTab('status_report'); setActiveSnapshotId(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === 'status_report' && !activeSnapshotId
                    ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
                    : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-500" />
                New Status Report
              </button>

              {activeTab === 'status_report' && snapshots.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 pl-4 border-l-2 border-app-border ml-2">
                  <div className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                    <History className="w-3 h-3" /> Report History
                  </div>
                  {snapshots.map((snap) => (
                    <button
                      key={snap.id}
                      onClick={() => { setActiveTab('status_report'); setActiveSnapshotId(snap.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                      className={`text-left text-xs py-2 px-3 rounded-lg transition-colors flex items-center gap-2 ${
                        activeSnapshotId === snap.id
                          ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                          : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                      }`}
                    >
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {snap.generated_at ? new Date(snap.generated_at).toLocaleDateString() : 'Unknown Date'} - {snap.period_end || 'Snapshot'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </SidebarAccordion>

            <PlanningSidebarSection
              activeTab={activeTab}
              onSelect={(doc) => {
                setActiveTab(doc)
                setActiveSnapshotId(null)
                if (window.innerWidth < 768) setIsSidebarOpen(false)
              }}
            />

            <ExecutionSidebarSection
              activeTab={activeTab}
              onSelect={(doc) => {
                setActiveTab(doc)
                setActiveSnapshotId(null)
                if (window.innerWidth < 768) setIsSidebarOpen(false)
              }}
              hasEditAccess={hasEditAccess}
              isManager={isManager}
              methodology={projectContext?.methodology}
            />

            <ClosureSidebarSection
              activeTab={activeTab}
              onSelect={(doc) => {
                setActiveTab(doc)
                setActiveSnapshotId(null)
                if (window.innerWidth < 768) setIsSidebarOpen(false)
              }}
              methodology={projectContext?.methodology}
            />
            </>
            )}

            {documentDomain === 'product' && (
              <ProductSidebarSection
                activeTab={activeTab}
                onSelect={(doc) => {
                  setActiveTab(doc)
                  setActiveSnapshotId(null)
                  if (window.innerWidth < 768) setIsSidebarOpen(false)
                }}
              />
            )}

          </nav>
        )}
      </div>

      {/* Main Document Engine Area */}
      <div className="flex-1 min-w-0 h-full overflow-hidden md:pl-8">
        {['charter', 'wbs_dictionary', 'raci', 'status_report', 'stakeholder_register', 'risk_register', 'project_management_plan', 'issue_log', 'schedule_document', 'budget_baseline', 'change_management_plan', 'release_notes', 'deployment_report', 'test_summary_report', 'product_strategy_document', 'market_research_report', 'competitive_benchmarking_matrix', 'okr_kpi_performance_report', 'product_requirements_document'].includes(activeTab) && (
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

        {['strategy_canvas_workspace', 'personas_workspace', 'north_star_kpis_workspace', 'okrs_workspace', 'voc_discovery_workspace', 'prioritization_workspace', 'roadmap_workspace'].includes(activeTab) && (
          <ProductDocumentsRouter
            documentType={activeTab}
            projectId={projectId}
            projectContext={projectContext}
            hasEditAccess={hasEditAccess}
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

        {['meeting_minutes', 'change_requests', 'deliverables'].includes(activeTab) && (
          <ExecutionDocumentsRouter
            documentType={activeTab as ExecutionDocType}
            projectId={projectId}
            hasEditAccess={hasEditAccess}
            isManager={isManager}
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
