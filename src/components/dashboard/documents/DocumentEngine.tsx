'use client'

import { useState, useTransition, useEffect } from 'react'
import { DocumentTemplate, GeneratedDocument, saveGeneratedDocument, regenerateDocument } from '@/lib/documents/actions'
import DocumentHistoryModal from './DocumentHistoryModal'
import { fetchAutoFillText } from './engine/autoFillDataFetcher'
import { useDocumentExports } from './engine/useDocumentExports'
import DocumentHeader from './components/DocumentHeader'
import DocumentSection from './components/DocumentSection'
import RegenConfirmModal from './components/RegenConfirmModal'
import SnapshotModal from './components/SnapshotModal'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'

interface DocumentEngineProps {
  projectId: string
  projectContext: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
}

export default function DocumentEngine({
  projectId,
  projectContext,
  template,
  generatedDoc,
  hasEditAccess,
  onShowToast,
  isSnapshot = false,
}: DocumentEngineProps) {
  const [isPending, startTransition] = useTransition()

  // Local state for free text content, seeded from DB
  const [freeText, setFreeText] = useState<Record<string, string>>({})

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

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveGeneratedDocument(projectId, template.document_type, freeText)
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
      if (isDirty) {
        await saveGeneratedDocument(projectId, template.document_type, freeText)
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
      const result = await saveGeneratedDocument(
        projectId,
        template.document_type,
        freeText,
        true, // isSnapshot
        {}, // frozenData
        periodEnd
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
      onShowToast('error', 'Failed to auto-fill section: ' + (err.message || 'Unknown error'))
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

          {/* Engine: Loop through all sections in the template */}
          {template.section_definitions.map((section) => (
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
            />
          ))}

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
