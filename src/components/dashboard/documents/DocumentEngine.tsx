'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import { useDocumentExports } from './engine/useDocumentExports'
import DocumentHeader from './components/DocumentHeader'
import DocumentSection from './components/DocumentSection'
import InlineSectionInserter from './components/InlineSectionInserter'
import { useSectionOrdering } from './hooks/useSectionOrdering'
import { useDocumentSections } from './hooks/useDocumentSections'
import { useDocumentPersistence } from './hooks/useDocumentPersistence'
import { useStrategyAiAutomation } from './hooks/useStrategyAiAutomation'
import DocumentStatsRibbon from './components/DocumentStatsRibbon'

import { DocumentReconcileAlert } from './components/DocumentReconcileAlert'
import { RoadmapViewSwitcher, CompetitiveViewSwitcher } from './components/DocumentViewSwitchers'
import { DocumentAiBanners } from './components/DocumentAiBanners'

import DocumentPropertiesHeader from './components/DocumentPropertiesHeader'
import { reconcileDocument } from '@/lib/documents/reconcile-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import { generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'

// Lazy-load heavy components that aren't needed for initial render
const DocumentHistoryModal = dynamic(() => import('./DocumentHistoryModal'), { ssr: false })
const ReferenceDocumentsSection = dynamic(() => import('./components/ReferenceDocumentsSection'), { ssr: false })
const FloatingReferenceLinksWidget = dynamic(() => import('./components/FloatingReferenceLinksWidget'), { ssr: false })
const RegenConfirmModal = dynamic(() => import('./components/RegenConfirmModal'), { ssr: false })
const SnapshotModal = dynamic(() => import('./components/SnapshotModal'), { ssr: false })
const CommentThread = dynamic(() => import('@/components/dashboard/collaboration/CommentThread').then(m => m.CommentThread), { ssr: false })
const DocumentApprovalBanner = dynamic(() => import('./components/DocumentApprovalBanner'), { ssr: false })
const DocumentTableOfContents = dynamic(() => import('./components/DocumentTableOfContents'), { ssr: false })
const CustomSectionBuilder = dynamic(() => import('./components/CustomSectionBuilder'), { ssr: false })
const RemovedSectionsTrashPanel = dynamic(() => import('./components/RemovedSectionsTrashPanel'), { ssr: false })
const RoadmapDashboard = dynamic(() => import('@/components/dashboard/product/roadmap/RoadmapDashboard').then(m => m.RoadmapDashboard), { ssr: false })
const CompetitiveIntelligenceDashboard = dynamic(() => import('@/components/dashboard/product/strategy/CompetitiveIntelligenceDashboard').then(m => m.CompetitiveIntelligenceDashboard), { ssr: false })
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
  const [isReconciling, setIsReconciling] = useState(false)
  const [roadmapViewMode, setRoadmapViewMode] = useState<'document' | 'kanban'>('document')
  const [competitiveViewMode, setCompetitiveViewMode] = useState<'document' | 'matrix'>('document')
  const [isGeneratingBacklog, setIsGeneratingBacklog] = useState(false)
  const [isBacklogGenerated, setIsBacklogGenerated] = useState(false)
  const router = useRouter()

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

  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(projectContext?.organization_id || '')

  const {
    isSynthesizingRoadmap,
    isDraftingStrategy,
    isDone: isStrategyDone,
    handleSynthesizeRoadmap,
    handleDraftStrategy
  } = useStrategyAiAutomation({
    projectId,
    organizationId: projectContext?.organization_id || '',
    templateId: template.id,
    freeText,
    onShowToast,
    onGenerated: (data) => {
      setFreeText(prev => ({ ...prev, ...data }))
      setIsDirty(true)
    }
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

  const handleGenerateBacklog = async () => {
    if (isGeneratingBacklog) return
    setIsGeneratingBacklog(true)
    try {
      const orgId = projectContext?.organization_id || ''
      const res = await generateBacklogFromPrdAndRoadmap(projectId, orgId)

      if (res.success) {
        setIsBacklogGenerated(true)
        onShowToast?.('success', 'Execution Backlog (Epics & Stories) successfully generated in Product Backlog!')
        router.refresh()
      } else {
        onShowToast?.('error', res.error || 'Failed to extract PRD to Product Backlog.')
      }
    } catch (err: any) {
      console.error('[PRD to WBS Hook Error]:', err)
      onShowToast?.('error', err.message || 'An error occurred during backlog generation.')
    } finally {
      setIsGeneratingBacklog(false)
    }
  }

  const handleDocumentTitleChange = (newTitle: string) => {
    setFreeText((prev) => ({
      ...prev,
      '__document_title_override': newTitle
    }))
    setIsDirty(true)
  }

  const handleReconcile = async () => {
    if (!generatedDoc || isReconciling || isChecking) return

    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsReconciling(true)
    startTransition(async () => {
      try {
        const res = await reconcileDocument(generatedDoc.id, projectId)
        if (!res.success) {
          onShowToast?.('error', res.error || 'Failed to reconcile document')
          return
        }
        await recordUsage('generations')
        onShowToast?.('success', 'Document successfully reconciled with latest data!')
        onSaveSuccess?.() // Trigger a re-fetch of the document to get the latest data
      } catch (err: any) {
        onShowToast?.('error', err.message || 'Error')
      } finally {
        setIsReconciling(false)
      }
    })
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

      <DocumentReconcileAlert
        generatedDoc={generatedDoc}
        isSnapshot={isSnapshot}
        hasEditAccess={hasEditAccess}
        isReconciling={isReconciling}
        handleReconcile={handleReconcile}
      />

      {/* Roadmap View Mode Switcher Toggle Bar */}
      {isRoadmapDocument && (
        <RoadmapViewSwitcher roadmapViewMode={roadmapViewMode} setRoadmapViewMode={setRoadmapViewMode} />
      )}

      {/* Competitive / Market Research View Mode Switcher Toggle Bar */}
      {isCompetitiveDocument && (
        <CompetitiveViewSwitcher competitiveViewMode={competitiveViewMode} setCompetitiveViewMode={setCompetitiveViewMode} />
      )}

      {/* Document vs Kanban Board Body Rendering (Preserved in DOM for 0ms Instant Toggle) */}
      {isRoadmapDocument && (
        <div className={`flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg ${roadmapViewMode === 'kanban' ? 'block' : 'hidden'}`}>
          <div className="max-w-7xl mx-auto bg-app-surface border border-app-border rounded-2xl shadow-sm p-6 md:p-8">
            <RoadmapDashboard projectId={projectId} organizationId={projectContext?.organization_id || ''} />
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
        className={`flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg ${(isRoadmapDocument && roadmapViewMode === 'kanban') || (isCompetitiveDocument && competitiveViewMode === 'matrix')
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
          <DocumentAiBanners
            projectId={projectId}
            organizationId={projectContext?.organization_id || ''}
            template={template}
            freeText={freeText}
            setFreeText={setFreeText}
            setIsDirty={setIsDirty}
            onShowToast={onShowToast}
            onSaveSuccess={onSaveSuccess}
            isSnapshot={isSnapshot}
            hasEditAccess={hasEditAccess}
            handleGenerateBacklog={handleGenerateBacklog}
            isGeneratingBacklog={isGeneratingBacklog}
            isBacklogGenerated={isBacklogGenerated}
            handleDraftStrategy={handleDraftStrategy}
            isDraftingStrategy={isDraftingStrategy}
            handleSynthesizeRoadmap={handleSynthesizeRoadmap}
            isSynthesizingRoadmap={isSynthesizingRoadmap}
            isStrategyDone={isStrategyDone}
          />

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
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
