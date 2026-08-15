'use client'

import React from 'react'
import ToastContainer from './components/ToastContainer'
import ProjectDocument from './ProjectDocument'
import { ProductDocumentsRouter } from './product/ProductDocumentsRouter'
import { PlanningDocumentsRouter, PlanningDocType } from './planning/PlanningDocumentsRouter'
import { ExecutionDocumentsRouter, ExecutionDocType } from './execution/ExecutionDocumentsRouter'
import { ClosureDocumentsRouter, ClosureDocType } from './closure/ClosureDocumentsRouter'

import { useDocumentWorkspaceState } from './hooks/useDocumentWorkspaceState'
import DocumentCenterHeader from './components/DocumentCenterHeader'
import ActiveDocumentHeader from './components/ActiveDocumentHeader'
import DocumentCardGrid from './components/DocumentCardGrid'
import PmGuideDrawer from './components/PmGuideDrawer'
import WorkflowsDrawer from './components/WorkflowsDrawer'

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
  const {
    activeSuite,
    selectedDocId,
    searchQuery,
    selectedCategory,
    showGuideDrawer,
    showWorkflowsDrawer,
    isDropdownOpen,
    activeSnapshotId,
    toasts,
    currentSuiteDocs,
    filteredDocs,
    selectedDocItem,
    setActiveSuite,
    setSelectedDocId,
    setSearchQuery,
    setSelectedCategory,
    setShowGuideDrawer,
    setShowWorkflowsDrawer,
    setIsDropdownOpen,
    addToast,
    dismissToast,
  } = useDocumentWorkspaceState()

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-fg overflow-hidden">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />

      {/* HEADER NAVIGATION BAR */}
      <div className="bg-app-surface border-b border-app-border p-4 sm:p-6 space-y-4">
        {selectedDocId ? (
          <ActiveDocumentHeader
            activeSuite={activeSuite}
            selectedDocId={selectedDocId}
            selectedDocItem={selectedDocItem}
            currentSuiteDocs={currentSuiteDocs}
            isDropdownOpen={isDropdownOpen}
            showGuideDrawer={showGuideDrawer}
            showWorkflowsDrawer={showWorkflowsDrawer}
            onBackToHub={() => setSelectedDocId(null)}
            onSuiteChange={setActiveSuite}
            onSelectDoc={setSelectedDocId}
            onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
            onCloseDropdown={() => setIsDropdownOpen(false)}
            onToggleGuideDrawer={() => setShowGuideDrawer(!showGuideDrawer)}
            onToggleWorkflowsDrawer={() => setShowWorkflowsDrawer(!showWorkflowsDrawer)}
          />
        ) : (
          <DocumentCenterHeader
            activeSuite={activeSuite}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSuiteChange={setActiveSuite}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            showWorkflowsDrawer={showWorkflowsDrawer}
            onToggleWorkflowsDrawer={() => setShowWorkflowsDrawer(!showWorkflowsDrawer)}
          />
        )}
      </div>

      {/* BODY CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Global Workflows Drawer */}
        {showWorkflowsDrawer && (
          <WorkflowsDrawer onClose={() => setShowWorkflowsDrawer(false)} />
        )}

        {selectedDocId ? (
          /* ACTIVE DOCUMENT WORKSPACE VIEW */
          <div className="space-y-6">
            {/* Interactive PM Guide Drawer */}
            {showGuideDrawer && selectedDocItem?.guide && (
              <PmGuideDrawer guide={selectedDocItem.guide} />
            )}

            {/* Document Module Canvas */}
            <div className="bg-app-surface border border-app-border rounded-3xl p-6 min-h-[500px] shadow-xs">
              {[
                'charter',
                'wbs_dictionary',
                'raci',
                'status_report',
                'stakeholder_register',
                'risk_register',
                'project_management_plan',
                'issue_log',
                'schedule_document',
                'budget_baseline',
                'change_management_plan',
                'release_notes',
                'deployment_report',
                'test_summary_report',
                'product_strategy_document',
                'market_research_report',
                'market_research_workspace',
                'competitive_benchmarking_matrix',
                'competitive_analysis_workspace',
                'okr_kpi_performance_report',
                'product_requirements_document',
                'roadmap_workspace',
                'product_roadmap_document',
                'product_roadmap',
              ].includes(selectedDocId) && (
                <ProjectDocument
                  key={selectedDocId + (activeSnapshotId || 'draft')}
                  documentType={selectedDocId}
                  projectId={projectId}
                  projectContext={projectContext}
                  hasEditAccess={hasEditAccess}
                  onShowToast={addToast}
                  isSnapshot={!!activeSnapshotId}
                  snapshotId={activeSnapshotId || undefined}
                />
              )}

              {[
                'strategy_canvas_workspace',
                'personas_workspace',
                'north_star_kpis_workspace',
                'okrs_workspace',
                'voc_discovery_workspace',
                'discovery_insights_document',
                'prioritization_workspace',
                'release_checklist_workspace',
              ].includes(selectedDocId) && (
                <ProductDocumentsRouter
                  documentType={selectedDocId}
                  projectId={projectId}
                  projectContext={projectContext}
                  hasEditAccess={hasEditAccess}
                />
              )}

              {[
                'closure_report',
                'lessons_learned',
                'handover_document',
                'post_implementation_review',
                'signoff_board',
              ].includes(selectedDocId) && (
                <ClosureDocumentsRouter
                  documentType={selectedDocId as ClosureDocType}
                  projectId={projectId}
                  hasEditAccess={hasEditAccess}
                  currentLifecycle={projectContext?.lifecycle_status || 'Execution'}
                  onShowToast={addToast}
                />
              )}

              {['meeting_minutes', 'change_requests', 'deliverables'].includes(selectedDocId) && (
                <ExecutionDocumentsRouter
                  documentType={selectedDocId as ExecutionDocType}
                  projectId={projectId}
                  hasEditAccess={hasEditAccess}
                  isManager={isManager}
                  onShowToast={addToast}
                />
              )}

              {[
                'scope_statement',
                'communication_plan',
                'quality_management_plan',
                'procurement_plan',
              ].includes(selectedDocId) && (
                <PlanningDocumentsRouter
                  documentType={selectedDocId as PlanningDocType}
                  projectId={projectId}
                  hasEditAccess={hasEditAccess}
                  onShowToast={addToast}
                />
              )}
            </div>
          </div>
        ) : (
          /* HUB OVERVIEW CATEGORY GRID */
          <DocumentCardGrid
            activeSuite={activeSuite}
            filteredDocs={filteredDocs}
            onSelectDoc={setSelectedDocId}
          />
        )}
      </div>
    </div>
  )
}
