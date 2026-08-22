import { useState, useEffect, TransitionStartFunction } from 'react'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import { saveGeneratedDocument, regenerateDocument } from '@/lib/documents/core-mutations'
import { fetchAutoFillText } from '../engine/autoFillDataFetcher'

interface UseDocumentPersistenceParams {
  projectId: string
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  isPending: boolean
  startTransition: TransitionStartFunction
  isSnapshot?: boolean
  isReadOnlyTemplate?: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSaveSuccess?: () => void
}

export function useDocumentPersistence({
  projectId,
  template,
  generatedDoc,
  freeText,
  setFreeText,
  isDirty,
  setIsDirty,
  isPending,
  startTransition,
  isSnapshot = false,
  isReadOnlyTemplate = false,
  onShowToast,
  onSaveSuccess
}: UseDocumentPersistenceParams) {
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0])

  // Real-time debounced auto-save (saves 1s after user stops typing)
  useEffect(() => {
    if (!isDirty || isSnapshot || isReadOnlyTemplate) return

    const timer = setTimeout(() => {
      handleSave()
    }, 1000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeText, isDirty, isSnapshot, isReadOnlyTemplate])

  const handleSave = async () => {
    const customTemplateId = template.id
    const result = await saveGeneratedDocument(projectId, template.document_type, freeText, false, undefined, undefined, customTemplateId)
    if (result.ok) {
      setIsDirty(false)
    } else {
      console.error('[DocumentEngine Error] Failed to save document:', result.error)
      onShowToast('error', result.error || 'Failed to auto-save document')
    }
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
        if (onSaveSuccess) onSaveSuccess()
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

  return {
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
  }
}
