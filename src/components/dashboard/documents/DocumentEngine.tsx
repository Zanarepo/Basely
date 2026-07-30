'use client'

import { useState, useTransition, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { DocumentTemplate, GeneratedDocument, saveGeneratedDocument, regenerateDocument } from '@/lib/documents/actions'
import DocumentHistoryModal from './DocumentHistoryModal'
import { fetchAutoFillText } from './engine/autoFillDataFetcher'
import { useDocumentExports } from './engine/useDocumentExports'
import DocumentHeader from './components/DocumentHeader'
import DocumentSection from './components/DocumentSection'
import RegenConfirmModal from './components/RegenConfirmModal'
import SnapshotModal from './components/SnapshotModal'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'
import { PrdMetadataRibbon } from '@/components/dashboard/product/prd/PrdMetadataRibbon'

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

  const allSections = [...template.section_definitions, ...customSections]

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
    if (generatedDoc?.free_text_content) {
      setFreeText(generatedDoc.free_text_content)
    } else {
      setFreeText({})
    }
    setIsDirty(false)
  }, [generatedDoc?.id, template?.document_type])

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

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return
    const sectionTitle = newSectionTitle.trim()
    const sectionKey = 'custom_sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)

    startTransition(() => {
      setFreeText((prev) => {
        const next = { ...prev }
        const currentCustom = (() => {
          try {
            return prev['__custom_sections'] ? JSON.parse(prev['__custom_sections']) : []
          } catch {
            return []
          }
        })()
        const updatedCustom = [...currentCustom, { key: sectionKey, title: sectionTitle }]
        next['__custom_sections'] = JSON.stringify(updatedCustom)
        next[sectionKey] = '' // Initialize as empty string to trigger interactive edit field
        return next
      })
      setNewSectionTitle('')
      setIsDirty(true)
    })
    onShowToast('success', `Added new custom section "${sectionTitle}"`)
  }

  const handleRemoveSection = (sectionKey: string) => {
    startTransition(() => {
      setFreeText((prev) => {
        const next = { ...prev }
        delete next[sectionKey]
        try {
          if (next['__custom_sections']) {
            const current = JSON.parse(next['__custom_sections']) as { key: string; title: string }[]
            const updated = current.filter((s) => s.key !== sectionKey)
            if (updated.length > 0) {
              next['__custom_sections'] = JSON.stringify(updated)
            } else {
              delete next['__custom_sections']
            }
          }
        } catch {
          // ignore parsing errors
        }
        return next
      })
      setIsDirty(true)
    })
    onShowToast('success', 'Custom section removed')
  }

  const handleSave = () => {
    startTransition(async () => {
      const customTemplateId = template.is_custom ? template.id : undefined
      const result = await saveGeneratedDocument(projectId, template.document_type, freeText, false, undefined, undefined, customTemplateId)
      if (result.ok) {
        setIsDirty(false)
        onShowToast('success', 'Document saved successfully')
      } else {
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

          {/* PRD Studio Metadata Ribbon — only visible for Product Requirements Documents */}
          {template.document_type === 'product_requirements_document' && !isSnapshot && (
            <div className="mb-8">
              <PrdMetadataRibbon
                projectId={projectId}
                organizationId={projectContext?.organization_id || ''}
              />
            </div>
          )}

          {/* Engine: Loop through all standard and dynamic custom sections */}
          {allSections.map((section) => (
            <DocumentSection
              key={section.key}
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
            />
          ))}

          {/* Dynamic Section Builder (For Competitive Matrix, Market Research & all documents) */}
          {hasEditAccess && !isSnapshot && (
            <div className="mt-8 pt-6 border-t border-dashed border-app-border">
              <div className="bg-app-muted-surface/50 dark:bg-slate-800/60 rounded-xl p-5 border border-app-border space-y-3 shadow-sm transition-all hover:border-indigo-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
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
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-app-border bg-app-surface text-app-fg placeholder:text-app-muted focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddSection()
                    }}
                    disabled={!newSectionTitle.trim() || isPending}
                    style={{ cursor: 'pointer' }}
                    className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-sm transition-all shrink-0 disabled:opacity-50 disabled:pointer-events-none"
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
    </div>
  )
}
