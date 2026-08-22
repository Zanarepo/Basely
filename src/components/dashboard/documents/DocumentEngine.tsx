'use client'

import { useState, useTransition, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import { useDocumentExports } from './engine/useDocumentExports'
import DocumentHeader from './components/DocumentHeader'
import DocumentSection from './components/DocumentSection'
import InlineSectionInserter from './components/InlineSectionInserter'
import { useSectionOrdering } from './hooks/useSectionOrdering'
import { useDocumentSections } from './hooks/useDocumentSections'
import { useDocumentPersistence } from './hooks/useDocumentPersistence'
import DocumentStatsRibbon from './components/DocumentStatsRibbon'
import DocumentPropertiesHeader from './components/DocumentPropertiesHeader'
import { Compass, Kanban, FileText, Globe, Table } from 'lucide-react'

// Lazy-load heavy components that aren't needed for initial render
const DocumentHistoryModal = dynamic(() => import('./DocumentHistoryModal'), { ssr: false })
const ReferenceDocumentsSection = dynamic(() => import('./components/ReferenceDocumentsSection'), { ssr: false })
const FloatingReferenceLinksWidget = dynamic(() => import('./components/FloatingReferenceLinksWidget'), { ssr: false })
const RegenConfirmModal = dynamic(() => import('./components/RegenConfirmModal'), { ssr: false })
const SnapshotModal = dynamic(() => import('./components/SnapshotModal'), { ssr: false })
const CommentThread = dynamic(() => import('@/components/dashboard/collaboration/CommentThread').then(m => m.CommentThread), { ssr: false })
const PrdToRiceAutomationBanner = dynamic(() => import('./components/rice-automation/PrdToRiceAutomationBanner'), { ssr: false })
const DocumentApprovalBanner = dynamic(() => import('./components/DocumentApprovalBanner'), { ssr: false })
const DocumentTableOfContents = dynamic(() => import('./components/DocumentTableOfContents'), { ssr: false })
const CustomSectionBuilder = dynamic(() => import('./components/CustomSectionBuilder'), { ssr: false })
const RemovedSectionsTrashPanel = dynamic(() => import('./components/RemovedSectionsTrashPanel'), { ssr: false })
const MarketResearchChainBanner = dynamic(() => import('./components/chain/MarketResearchChainBanner'), { ssr: false })
const StrategyChainBanner = dynamic(() => import('./components/chain/StrategyChainBanner'), { ssr: false })
const RoadmapChainBanner = dynamic(() => import('./components/chain/RoadmapChainBanner'), { ssr: false })
const RiskRegisterChainBanner = dynamic(() => import('./components/chain/RiskRegisterChainBanner'), { ssr: false })
const CharterInitiationBanner = dynamic(() => import('./components/CharterInitiationBanner'), { ssr: false })
const ScopeInitiationBanner = dynamic(() => import('./components/ScopeInitiationBanner'), { ssr: false })
const ScopeToRiceAutomationBanner = dynamic(() => import('./components/rice-automation/ScopeToRiceAutomationBanner'), { ssr: false })
const WbsToBaselinesChainBanner = dynamic(() => import('./components/chain/WbsToBaselinesChainBanner'), { ssr: false })
const PmPlanSynthesisChainBanner = dynamic(() => import('./components/chain/PmPlanSynthesisChainBanner'), { ssr: false })
const RoadmapDashboard = dynamic(() => import('@/components/dashboard/product/roadmap/RoadmapDashboard').then(m => m.RoadmapDashboard), { ssr: false })
const CompetitiveIntelligenceDashboard = dynamic(() => import('@/components/dashboard/product/strategy/CompetitiveIntelligenceDashboard').then(m => m.CompetitiveIntelligenceDashboard), { ssr: false })
const AiStatusReportBanner = dynamic(() => import('./components/execution/AiStatusReportBanner').then(m => m.AiStatusReportBanner), { ssr: false })
const AiClosureSynthesisBanner = dynamic(() => import('./components/closure/AiClosureSynthesisBanner').then(m => m.AiClosureSynthesisBanner), { ssr: false })
const AiStakeholderRegisterBanner = dynamic(() => import('./components/chain/AiStakeholderRegisterBanner'), { ssr: false })
interface DocumentEngineProps {
  projectId: string
  projectContext: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
  onShowTemplateSelector?: () => void
  isReadOnlyTemplate?: boolean // For pre-project entities that don't save to generated_documents
  onSaveSuccess?: () => void
}

export default function DocumentEngine({
  projectId,
  projectContext,
  template,
  generatedDoc,
  hasEditAccess,
  onShowToast,
  isSnapshot = false,
  onShowTemplateSelector,
  isReadOnlyTemplate = false,
  onSaveSuccess,
}: DocumentEngineProps) {
  const [isPending, startTransition] = useTransition()

  // Local state for free text content, seeded from DB
  const [freeText, setFreeText] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [roadmapViewMode, setRoadmapViewMode] = useState<'document' | 'kanban'>('document')
  const [competitiveViewMode, setCompetitiveViewMode] = useState<'document' | 'matrix'>('document')

  const isRoadmapDocument = ['roadmap_workspace', 'product_roadmap_document', 'product_roadmap'].includes(template.document_type)
  const isCompetitiveDocument = [
    'competitive_analysis_workspace',
    'competitive_benchmarking_matrix',
    'market_research_report',
    'market_research_workspace',
  ].includes(template.document_type)

  // Compute all sections & soft-removed items via hook
  const {
    allSections,
    allRemovedSections,
    sectionTitleOverrides
  } = useDocumentSections({ template, freeText })

  // Initialize state & sync freeText when template or generatedDoc updates
  useEffect(() => {
    if (generatedDoc?.free_text_content) {
      setFreeText(generatedDoc.free_text_content)
      setIsDirty(false)
    }
  }, [generatedDoc?.id, generatedDoc?.updated_at, template?.id, template?.document_type])

  // Document exports hook
  const {
    showExportMenu,
    setShowExportMenu,
    exportingFormat,
    handleExportPdf,
    handleExportDocx,
    handleExportXlsx
  } = useDocumentExports({
    projectId,
    projectContext,
    template,
    generatedDoc,
    freeText,
    periodEnd: new Date().toISOString().split('T')[0],
    onShowToast
  })

  // Section ordering & layout management hook
  const {
    handleMoveSectionUp,
    handleMoveSectionDown,
    handleAddSection,
    handleDuplicateSection,
    handleRemoveSection,
    handleSectionTitleChange,
    handleRestoreSection,
    handlePermanentDeleteSection,
    handleClearAllRemovedSections,
    handleResetToDefaultLayout
  } = useSectionOrdering({
    freeText,
    setFreeText,
    allSections,
    setIsDirty,
    onShowToast,
    startTransition,
    newSectionTitle,
    setNewSectionTitle
  })

  // Document persistence hook (saving, auto-save, snapshots, regeneration, auto-fill)
  const {
    showRegenConfirm,
    setShowRegenConfirm,
    showSnapshotModal,
    setShowSnapshotModal,
    periodEnd,
    setPeriodEnd,
    handleSave,
    handleRegenerate,
    executeRegenerate,
    handleGenerateSnapshot,
    handleAutoFillSection
  } = useDocumentPersistence({
    projectId,
    template,
    generatedDoc,
    freeText,
    setFreeText,
    isDirty,
    setIsDirty,
    isPending,
    startTransition,
    isSnapshot,
    isReadOnlyTemplate,
    onShowToast,
    onSaveSuccess
  })

  const handleFreeTextChange = (key: string, value: string) => {
    setFreeText((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleDocumentTitleChange = (newTitle: string) => {
    setFreeText((prev) => ({
      ...prev,
      '__document_title_override': newTitle
    }))
    setIsDirty(true)
  }

  return (
    <div className="h-full flex flex-col bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
      <DocumentHeader
        template={template}
        generatedDoc={generatedDoc}
        isSnapshot={isSnapshot}
        hasEditAccess={hasEditAccess}
        isPending={isPending}
        isDirty={isDirty}
        exportingFormat={exportingFormat}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        setShowHistoryModal={setShowHistoryModal}
        setShowSnapshotModal={setShowSnapshotModal}
        handleSave={handleSave}
        handleRegenerate={handleRegenerate}
        handleExportPdf={handleExportPdf}
        handleExportDocx={handleExportDocx}
        handleExportXlsx={handleExportXlsx}
        onShowTemplateSelector={onShowTemplateSelector}
        isReadOnlyTemplate={isReadOnlyTemplate}
        customDocumentTitle={freeText['__document_title_override']}
        onDocumentTitleChange={handleDocumentTitleChange}
      />

      {/* Roadmap View Mode Switcher Toggle Bar */}
      {isRoadmapDocument && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-violet-500/5 dark:bg-violet-500/10 border-b border-app-border">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
              Roadmap Visualization Mode:
            </span>
          </div>
          <div className="flex items-center p-0.5 bg-app-surface border border-app-border rounded-xl shadow-xs">
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setRoadmapViewMode('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roadmapViewMode === 'document'
                  ? 'bg-violet-500 text-white shadow-xs font-bold'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Spec View</span>
            </button>

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setRoadmapViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roadmapViewMode === 'kanban'
                  ? 'bg-violet-500 text-white shadow-xs font-bold'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      )}

      {/* Competitive / Market Research View Mode Switcher Toggle Bar */}
      {isCompetitiveDocument && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-violet-500/5 dark:bg-violet-500/10 border-b border-app-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
              Market Intelligence Visualization Mode:
            </span>
          </div>
          <div className="flex items-center p-0.5 bg-app-surface border border-app-border rounded-xl shadow-xs">
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setCompetitiveViewMode('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                competitiveViewMode === 'document'
                  ? 'bg-violet-500 text-white shadow-xs font-bold'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Spec</span>
            </button>

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setCompetitiveViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                competitiveViewMode === 'matrix'
                  ? 'bg-violet-500 text-white shadow-xs font-bold'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Feature Matrix & Moats</span>
            </button>
          </div>
        </div>
      )}

      {/* Document vs Kanban Board Body Rendering (Preserved in DOM for 0ms Instant Toggle) */}
      {isRoadmapDocument && (
        <div className={`flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg ${roadmapViewMode === 'kanban' ? 'block' : 'hidden'}`}>
          <div className="max-w-7xl mx-auto bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 md:p-8">
            <RoadmapDashboard projectId={projectId} />
          </div>
        </div>
      )}

      {/* Competitive Matrix Dashboard (Preserved in DOM for 0ms Instant Toggle) */}
      {isCompetitiveDocument && (
        <div className={`flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg ${competitiveViewMode === 'matrix' ? 'block' : 'hidden'}`}>
          <div className="max-w-7xl mx-auto bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 md:p-8">
            <CompetitiveIntelligenceDashboard
              projectId={projectId}
              organizationId={projectContext?.organization_id || ''}
              hasEditAccess={hasEditAccess}
            />
          </div>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg ${
          (isRoadmapDocument && roadmapViewMode === 'kanban') || (isCompetitiveDocument && competitiveViewMode === 'matrix')
            ? 'hidden'
            : 'block'
        }`}
      >
        <div id="document-printable-area" className="max-w-4xl mx-auto space-y-10 bg-app-surface border border-app-border rounded-lg shadow-sm p-8 md:p-12 relative min-h-[800px]">

            {/* Watermark for preview */}
            {!generatedDoc && (
              <div className="absolute top-10 right-10 opacity-10 rotate-12 pointer-events-none">
                <span className="text-6xl font-black uppercase tracking-widest text-slate-500">Draft</span>
              </div>
            )}

            {/* Live Document Reading Stats & Save Telemetry Ribbon */}
            <DocumentStatsRibbon
              freeText={freeText}
              allSectionsCount={allSections.length}
              isDirty={isDirty}
              isPending={isPending}
              isSnapshot={isSnapshot}
              onResetLayout={() => handleResetToDefaultLayout(template.section_definitions)}
            />

            {/* AI Workflow Chain Banners */}
            {isCompetitiveDocument && (
              <MarketResearchChainBanner
                projectId={projectId}
                freeText={freeText}
                onShowToast={onShowToast}
              />
            )}

            {template.document_type === 'product_strategy_document' && (
              <StrategyChainBanner
                projectId={projectId}
                freeText={freeText}
                onShowToast={onShowToast}
              />
            )}

            {isRoadmapDocument && (
              <RoadmapChainBanner
                projectId={projectId}
                freeText={freeText}
                onShowToast={onShowToast}
              />
            )}

            {/* Dedicated PRD -> RICE Backlog Automation Banner */}
            {template.document_type === 'product_requirements_document' && (
              <PrdToRiceAutomationBanner
                projectId={projectId}
                organizationId={projectContext?.organization_id || ''}
                freeText={freeText}
                onShowToast={onShowToast}
                isSnapshot={isSnapshot}
              />
            )}

            {/* Dedicated Charter Initiation AI Banner */}
            {template.id === 'standard_risk_register' && !isSnapshot && hasEditAccess && (
              <RiskRegisterChainBanner
                projectId={projectId}
                onShowToast={onShowToast}
                onSuccess={onSaveSuccess}
              />
            )}
            
            {template.document_type === 'stakeholder_register' && !isSnapshot && hasEditAccess && (
              <AiStakeholderRegisterBanner
                projectId={projectId}
                organizationId={projectContext?.organization_id || ''}
                template={template}
                onGenerated={(data) => {
                  setFreeText(prev => ({...prev, ...data}))
                  setIsDirty(true)
                }}
                onShowToast={onShowToast}
              />
            )}

            {template.document_type === 'charter' && !isSnapshot && hasEditAccess && (
              <CharterInitiationBanner
                projectId={projectId}
                organizationId={projectContext?.organization_id || ''}
                template={template}
                onGenerated={(data) => setFreeText(prev => ({...prev, ...data}))}
                onShowToast={onShowToast}
              />
            )}

            {/* Dedicated Scope Initiation AI Banner */}
            {template.document_type === 'scope_statement' && !isSnapshot && hasEditAccess && (
              <div className="flex flex-wrap items-center gap-3">
                <ScopeInitiationBanner
                  projectId={projectId}
                  organizationId={projectContext?.organization_id || ''}
                  template={template}
                  onGenerated={(data) => setFreeText(prev => ({...prev, ...data}))}
                  onShowToast={onShowToast}
                />
                <ScopeToRiceAutomationBanner
                  projectId={projectId}
                  organizationId={projectContext?.organization_id || ''}
                  freeText={freeText}
                  onShowToast={onShowToast}
                  isSnapshot={isSnapshot}
                />
              </div>
            )}

            {/* Baselines Generator Banner */}
            {(template.document_type === 'budget_baseline' || template.document_type === 'schedule_document') && !isSnapshot && hasEditAccess && (
              <WbsToBaselinesChainBanner
                projectId={projectId}
                onShowToast={onShowToast}
              />
            )}

            {/* PM Plan Synthesizer Banner */}
            {template.document_type === 'project_management_plan' && !isSnapshot && hasEditAccess && (
              <PmPlanSynthesisChainBanner
                projectId={projectId}
                onShowToast={onShowToast}
              />
            )}

            {/* Status Report Generator Banner */}
            {template.document_type === 'status_report' && !isSnapshot && hasEditAccess && (
              <AiStatusReportBanner
                projectId={projectId}
                onGenerated={(data) => setFreeText(prev => ({ ...prev, ...data }))}
                onShowToast={onShowToast}
              />
            )}

            {/* Closure Document Generator Banner */}
            {(template.document_type === 'lessons_learned' || template.document_type === 'post_implementation_review') && !isSnapshot && hasEditAccess && (
              <AiClosureSynthesisBanner
                projectId={projectId}
                docType={template.document_type}
                onGenerated={(data) => setFreeText(prev => ({ ...prev, ...data }))}
                onShowToast={onShowToast}
              />
            )}

            {/* Notion-Style Document Properties Header Grid */}
            <DocumentPropertiesHeader
              projectId={projectId}
              documentType={template.document_type}
              freeText={freeText}
              setFreeText={setFreeText}
              setIsDirty={setIsDirty}
              onShowToast={onShowToast}
              hasEditAccess={hasEditAccess}
              isSnapshot={isSnapshot}
            />

            {/* Universal Enterprise Document Approval & Governance Sign-Off Banner */}
            <DocumentApprovalBanner
              projectId={projectId}
              documentType={template.document_type}
              freeText={freeText}
              setFreeText={setFreeText}
              setIsDirty={setIsDirty}
              onShowToast={onShowToast}
              hasEditAccess={hasEditAccess}
              isSnapshot={isSnapshot}
            />

            {/* Floating Table of Contents (TOC) / Outline Side Navigator */}
            <DocumentTableOfContents
              sections={allSections}
              sectionTitleOverrides={sectionTitleOverrides}
            />

            {/* Engine: Loop through all standard and dynamic custom sections */}
            {allSections.map((section, index) => (
              <div key={section.key} className="space-y-4">
                {/* Hover Section Inserter Line above each section */}
                {hasEditAccess && !isSnapshot && (
                  <InlineSectionInserter
                    onAddSection={(title, content) => handleAddSection(title, index, content)}
                    isPending={isPending}
                  />
                )}

                <DocumentSection
                  section={section}
                  template={template}
                  generatedDoc={generatedDoc}
                  projectId={projectId}
                  projectContext={projectContext}
                  isSnapshot={isSnapshot}
                  hasEditAccess={hasEditAccess}
                  freeText={freeText}
                  handleAutoFillSection={handleAutoFillSection}
                  handleFreeTextChange={handleFreeTextChange}
                  onRemoveSection={handleRemoveSection}
                  sectionTitleOverride={sectionTitleOverrides[section.key]}
                  onSectionTitleChange={handleSectionTitleChange}
                  onMoveSectionUp={handleMoveSectionUp}
                  onMoveSectionDown={handleMoveSectionDown}
                  onDuplicateSection={handleDuplicateSection}
                  isFirstSection={index === 0}
                  isLastSection={index === allSections.length - 1}
                />
              </div>
            ))}

            {/* Hover Section Inserter Line after the last section */}
            {hasEditAccess && !isSnapshot && allSections.length > 0 && (
              <InlineSectionInserter
                onAddSection={(title, content) => handleAddSection(title, allSections.length, content)}
                isPending={isPending}
              />
            )}

            {/* Custom Section Builder Component */}
            <CustomSectionBuilder
              newSectionTitle={newSectionTitle}
              setNewSectionTitle={setNewSectionTitle}
              handleAddSection={handleAddSection}
              isPending={isPending}
              hasEditAccess={hasEditAccess}
              isSnapshot={isSnapshot}
            />

            {/* Bottom Auto-Indexed Reference Documents Table */}
            <ReferenceDocumentsSection
              freeText={freeText}
              allSections={allSections}
              documentType={template.document_type}
              documentTitle={freeText['__document_title_override'] || template.name || ''}
            />

            {generatedDoc?.id && (
              <div className="mt-8 border-t border-app-border pt-6">
                <CommentThread
                  projectId={projectId}
                  entityType="document"
                  entityId={generatedDoc.id}
                />
              </div>
            )}

            {/* Soft-Removed Sections Trash Panel */}
            <RemovedSectionsTrashPanel
              allRemovedSections={allRemovedSections}
              sectionTitleOverrides={sectionTitleOverrides}
              handleRestoreSection={handleRestoreSection}
              handlePermanentDeleteSection={handlePermanentDeleteSection}
              handleClearAllRemovedSections={handleClearAllRemovedSections}
              hasEditAccess={hasEditAccess}
              isSnapshot={isSnapshot}
            />
          </div>
        </div>

      <RegenConfirmModal
        show={showRegenConfirm}
        setShow={setShowRegenConfirm}
        onConfirm={executeRegenerate}
      />

      <SnapshotModal
        show={showSnapshotModal}
        setShow={setShowSnapshotModal}
        periodEnd={periodEnd}
        setPeriodEnd={setPeriodEnd}
        onConfirm={handleGenerateSnapshot}
      />

      <DocumentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        projectId={projectId}
        documentType={template.document_type}
        onShowToast={onShowToast}
      />

      {/* Floating VoC & Document Evidence Reference Links Widget */}
      <FloatingReferenceLinksWidget
        freeText={freeText}
        allSections={allSections}
        documentType={template.document_type}
        documentTitle={freeText['__document_title_override'] || template.name || ''}
      />
    </div>
  )
}
