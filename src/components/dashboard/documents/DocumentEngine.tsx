'use client'

import { useState, useTransition, useEffect } from 'react'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { DocumentTemplate, GeneratedDocument, saveGeneratedDocument, regenerateDocument } from '@/lib/documents/actions'
import DocumentHistoryModal from './DocumentHistoryModal'
import { fetchAutoFillText } from './engine/autoFillDataFetcher'
import { useDocumentExports } from './engine/useDocumentExports'
import DocumentHeader from './components/DocumentHeader'
import DocumentSection from './components/DocumentSection'
import InlineSectionInserter from './components/InlineSectionInserter'
import ReferenceDocumentsSection from './components/ReferenceDocumentsSection'
import FloatingReferenceLinksWidget from './components/FloatingReferenceLinksWidget'
import RegenConfirmModal from './components/RegenConfirmModal'
import SnapshotModal from './components/SnapshotModal'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'
import { PrdMetadataRibbon } from '@/components/dashboard/product/prd/PrdMetadataRibbon'
import { useSectionOrdering } from './hooks/useSectionOrdering'
import DocumentStatsRibbon from './components/DocumentStatsRibbon'
import DocumentPropertiesHeader from './components/DocumentPropertiesHeader'
import PrdToRiceAutomationBanner from './components/rice-automation/PrdToRiceAutomationBanner'
import DocumentApprovalBanner from './components/DocumentApprovalBanner'
import DocumentTableOfContents from './components/DocumentTableOfContents'

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

  // New custom section addition state
  const [newSectionTitle, setNewSectionTitle] = useState('')

  // Compute custom sections stored inside freeText
  const customSections: { key: string; title: string; type: string; isCustom?: boolean }[] = (() => {
    try {
      if (freeText['__custom_sections']) {
        const parsed = JSON.parse(freeText['__custom_sections'])
        if (Array.isArray(parsed)) {
          return parsed.map((sec: any) => ({ ...sec, type: 'free_text', isCustom: true }))
        }
      }
    } catch (e) {
      console.error('Failed to parse custom document sections:', e)
    }
    return []
  })()

  // Track deleted section keys
  const deletedSectionKeys: string[] = (() => {
    try {
      if (freeText['__deleted_section_keys']) {
        const parsed = JSON.parse(freeText['__deleted_section_keys'])
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error('Failed to parse deleted section keys:', e)
    }
    return []
  })()

  // Compute section order array from freeText
  const sectionOrder: string[] = (() => {
    try {
      if (freeText['__section_order']) {
        return JSON.parse(freeText['__section_order'])
      }
    } catch (e) {
      console.error('Failed to parse section order:', e)
    }
    return []
  })()

  // Standard & Custom sections soft-removed with 24-hour expiration filter
  const removedSectionsMeta: Record<string, { key: string; title: string; isCustom?: boolean; removedAt: number }> = (() => {
    try {
      if (freeText['__removed_sections_meta']) {
        return JSON.parse(freeText['__removed_sections_meta'])
      }
    } catch {
      // fallback
    }
    return {}
  })()

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
  const now = Date.now()

  // Compute active soft-removed sections (filtering out items removed > 24 hours ago)
  const removedSectionsList = Object.values(removedSectionsMeta).filter(
    (item) => item && typeof item.removedAt === 'number' && now - item.removedAt < TWENTY_FOUR_HOURS_MS
  )

  // Compute all active sections (filtering out deleted and soft-removed ones)
  const activeUnsortedSections = [...template.section_definitions, ...customSections].filter(
    (sec) => !deletedSectionKeys.includes(sec.key) && !removedSectionsMeta[sec.key]
  )

  const sectionOrderMap = new Map<string, number>()
  if (sectionOrder && sectionOrder.length > 0) {
    sectionOrder.forEach((key, idx) => sectionOrderMap.set(key, idx))
  }

  const allSections = [...activeUnsortedSections].sort((a, b) => {
    const orderA = sectionOrderMap.has(a.key) ? sectionOrderMap.get(a.key)! : 9999
    const orderB = sectionOrderMap.has(b.key) ? sectionOrderMap.get(b.key)! : 9999
    if (orderA !== orderB) return orderA - orderB
    return activeUnsortedSections.indexOf(a) - activeUnsortedSections.indexOf(b)
  })

  const legacyRemovedSections = [...template.section_definitions, ...customSections]
    .filter((sec) => deletedSectionKeys.includes(sec.key) && !removedSectionsMeta[sec.key])
    .map((sec) => ({
      key: sec.key,
      title: sec.title,
      isCustom: 'isCustom' in sec ? Boolean(sec.isCustom) : false,
      removedAt: Date.now()
    }))

  const allRemovedSections = [...removedSectionsList, ...legacyRemovedSections]

  // Compute section title overrides stored inside freeText
  const sectionTitleOverrides: Record<string, string> = (() => {
    try {
      if (freeText['__section_title_overrides']) {
        return JSON.parse(freeText['__section_title_overrides'])
      }
    } catch (e) {
      console.error('Failed to parse section title overrides:', e)
    }
    return {}
  })()

  const handleDocumentTitleChange = (newTitle: string) => {
    setFreeText(prev => ({
      ...prev,
      '__document_title_override': newTitle
    }))
    setIsDirty(true)
  }

  // Track if we have unsaved changes
  const [isDirty, setIsDirty] = useState(false)

  // Modal state for regeneration confirmation
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  // Snapshot Generation State
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0])

  // Export & History State
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Initialize state
  useEffect(() => {
    if (generatedDoc?.free_text_content && !isDirty) {
      setFreeText(generatedDoc.free_text_content)
    }
  }, [generatedDoc?.id, generatedDoc?.updated_at, template?.id, template?.document_type])

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
    periodEnd,
    onShowToast
  })

  const handleFreeTextChange = (key: string, value: string) => {
    setFreeText(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  // Real-time debounced auto-save (saves 1s after user stops typing)
  useEffect(() => {
    if (!isDirty || isPending || isSnapshot || isReadOnlyTemplate) return

    const timer = setTimeout(() => {
      handleSave()
    }, 1000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeText, isDirty, isPending, isSnapshot, isReadOnlyTemplate])

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

  const handleSave = () => {
    startTransition(async () => {
      const customTemplateId = template.id
      const result = await saveGeneratedDocument(projectId, template.document_type, freeText, false, undefined, undefined, customTemplateId)
      if (result.ok) {
        setIsDirty(false)
        onShowToast('success', 'Document saved successfully')
        if (onSaveSuccess) onSaveSuccess()
      } else {
        console.error('[DocumentEngine Error] Failed to save document:', result.error)
        onShowToast('error', result.error || 'Failed to save document')
      }
    })
  }

  const handleRegenerate = () => {
    if (Object.keys(freeText).length > 0 && generatedDoc) {
      setShowRegenConfirm(true)
    } else {
      executeRegenerate()
    }
  }

  const executeRegenerate = () => {
    setShowRegenConfirm(false)
    startTransition(async () => {
      const customTemplateId = template.is_custom ? template.id : undefined
      if (isDirty) {
        await saveGeneratedDocument(projectId, template.document_type, freeText, false, undefined, undefined, customTemplateId)
      }

      const result = await regenerateDocument(projectId, template.document_type)
      if (result.ok) {
        setIsDirty(false)
        onShowToast('success', 'Data-bound sections refreshed to latest project data')
      } else {
        onShowToast('error', result.error || 'Failed to regenerate document')
      }
    })
  }

  const handleGenerateSnapshot = () => {
    startTransition(async () => {
      const customTemplateId = template.is_custom ? template.id : undefined
      const result = await saveGeneratedDocument(
        projectId,
        template.document_type,
        freeText,
        true, // isSnapshot
        {}, // frozenData
        periodEnd,
        customTemplateId
      )

      if (result.ok) {
        setShowSnapshotModal(false)
        onShowToast('success', 'Snapshot generated successfully')
        window.dispatchEvent(new Event('snapshot-saved'))
      } else {
        onShowToast('error', result.error || 'Failed to generate snapshot')
      }
    })
  }

  const handleAutoFillSection = async (section: any) => {
    if (!section.source) return
    try {
      const text = await fetchAutoFillText(projectId, section.source)
      
      if (text) {
        startTransition(() => {
          setFreeText((prev) => {
            const nextState = { ...prev }
            nextState[section.key] = text
            if (section.key.startsWith('wbs')) {
              nextState['wbs_prototype'] = text
              nextState['wbs_dictionary'] = text
            }
            return nextState
          })
          setIsDirty(true)
        })
        onShowToast('success', `Auto-filled ${section.title} from project data`)
      }
    } catch (err: any) {
      console.error('Auto-fill error:', err)
      onShowToast('error', err.message || 'An error occurred while fetching data')
    }
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

      {/* Document Content Rendering */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg">
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

          {/* Dynamic Section Builder (For Competitive Matrix, Market Research & all documents) */}
          {hasEditAccess && !isSnapshot && (
            <div className="mt-8 pt-6 border-t border-dashed border-app-border">
              <div className="bg-app-muted-surface/50 dark:bg-slate-800/60 rounded-xl p-5 border border-app-border space-y-3 shadow-sm transition-all hover:border-violet-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      ➕ Add Custom Section & Text Field
                    </span>
                  </div>
                  <span className="text-[11px] text-app-muted font-medium">
                    Add dynamic analytical blocks (e.g. Competitor Pricing Tiers, TAM Expansion, Regional Risks)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddSection()
                      }
                    }}
                    placeholder="Section Title / Header Name (e.g. Enterprise Pricing & SLA Tiers)..."
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddSection()
                    }}
                    disabled={!newSectionTitle.trim() || isPending}
                    style={{ cursor: 'pointer' }}
                    className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 rounded-xl shadow-sm transition-all shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" /> Adding...
                      </>
                    ) : (
                      '+ Add Section Field'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {generatedDoc?.id && (
            <div className="mt-8 border-t border-app-border pt-6">
              <CommentThread
                projectId={projectId}
                entityType="document"
                entityId={generatedDoc.id}
                // Ideally pass currentUserId from a context or prop, omitting if unavailable since server checks it
              />
            </div>
          )}

          {/* Restore & Permanently Delete Removed Sections Panel */}
          {hasEditAccess && !isSnapshot && allRemovedSections.length > 0 && (
            <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Removed Sections ({allRemovedSections.length})
                </div>
                <button
                  type="button"
                  onClick={handleClearAllRemovedSections}
                  style={{ cursor: 'pointer' }}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Permanently clear all removed sections now"
                >
                  <Trash2 className="w-3 h-3" /> Clear Trash
                </button>
              </div>

              <p className="text-xs text-app-muted">
                ⏱️ Removed sections are kept in trash for <strong>24 hours</strong> before being automatically purged. Click to restore or permanently remove:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {allRemovedSections.map((sec) => (
                  <div
                    key={sec.key}
                    className="inline-flex items-center rounded-lg bg-app-surface border border-app-border text-app-fg shadow-2xs overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => handleRestoreSection(sec.key)}
                      style={{ cursor: 'pointer' }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
                      title="Restore section to document"
                    >
                      <span>+ Restore {(sectionTitleOverrides && sectionTitleOverrides[sec.key]) || sec.title}</span>
                    </button>
                    <div className="w-px h-7 bg-app-border" />
                    <button
                      type="button"
                      onClick={() => handlePermanentDeleteSection(sec.key)}
                      style={{ cursor: 'pointer' }}
                      className="px-2.5 py-1.5 text-app-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Permanently delete this section now"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
      />
    </div>
  )
}
