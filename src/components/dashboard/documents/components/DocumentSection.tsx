import React, { useState, useEffect } from 'react'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import StructuredEditableField from './StructuredEditableField'
import { SectionHeaderToolbar } from './section/components/SectionHeaderToolbar'
import { SectionResolverSwitch } from './section/components/SectionResolverSwitch'
import { SectionDeleteConfirmModal } from './section/components/SectionDeleteConfirmModal'

interface DocumentSectionProps {
  section: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  projectId: string
  projectContext: any
  isSnapshot: boolean
  hasEditAccess: boolean
  freeText: Record<string, string>
  handleAutoFillSection: (section: any) => void
  handleFreeTextChange: (key: string, value: string) => void
  onRemoveSection?: (key: string) => void
  onSectionTitleChange?: (key: string, newTitle: string) => void
  sectionTitleOverride?: string
  onMoveSectionUp?: (key: string) => void
  onMoveSectionDown?: (key: string) => void
  onDuplicateSection?: (key: string) => void
  isFirstSection?: boolean
  isLastSection?: boolean
}

export default function DocumentSection({
  section,
  template,
  generatedDoc,
  projectId,
  projectContext,
  isSnapshot,
  hasEditAccess,
  freeText,
  handleAutoFillSection,
  handleFreeTextChange,
  onRemoveSection,
  onSectionTitleChange,
  sectionTitleOverride,
  onMoveSectionUp,
  onMoveSectionDown,
  onDuplicateSection,
  isFirstSection = false,
  isLastSection = false,
}: DocumentSectionProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const sectionTitleOverrides = (() => {
    try {
      return JSON.parse(freeText['__section_title_overrides'] || '{}')
    } catch {
      return {}
    }
  })()

  const currentTitle = sectionTitleOverrides[section.key] || sectionTitleOverride || section.title

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(currentTitle)

  useEffect(() => {
    setEditedTitle(currentTitle)
  }, [currentTitle])

  const handleTitleSubmit = () => {
    setIsEditingTitle(false)
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== currentTitle && onSectionTitleChange) {
      onSectionTitleChange(section.key, trimmed)
    } else {
      setEditedTitle(currentTitle)
    }
  }

  const handleAutoFillClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAutoFilling) return
    setIsAutoFilling(true)
    try {
      await handleAutoFillSection(section)
    } finally {
      setIsAutoFilling(false)
    }
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isRemoving || !onRemoveSection) return
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    if (isRemoving || !onRemoveSection) return
    setIsRemoving(true)
    try {
      onRemoveSection(section.key)
      setShowConfirmDelete(false)
    } finally {
      setIsRemoving(false)
    }
  }

  const resolveDataBoundSource = (source?: string) => {
    if (!source) return '—'

    if (source.startsWith('project.')) {
      const field = source.split('.')[1]
      const projectValue = projectContext[field] || projectContext[field.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())]

      if (!projectValue) return 'Not specified'

      if (field.includes('date')) {
        return new Date(projectValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }

      return String(projectValue)
    }

    if (source.startsWith('release.')) {
      return `Pending generation: Click "Auto-fill from Project Data" to pull data from the most recent release.`
    }

    if (source.startsWith('initiation.') || source.startsWith('cost.') || source.startsWith('accountability.') || source.startsWith('planning.') || source.startsWith('register.')) {
      return `Pending generation: Click "Auto-fill from Project Data" to pull the latest ${source.split('.')[0]} records.`
    }

    return `Unknown source: ${source}`
  }

  const handleCopySection = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const contentText = freeText[section.key] || resolveDataBoundSource(section.source) || ''
    const formattedMarkdown = `## ${currentTitle}\n\n${contentText}`

    navigator.clipboard.writeText(formattedMarkdown)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div id={`doc-section-${section.key}`} className="space-y-3 group relative transition-all duration-200 scroll-mt-24">
      {/* Header Toolbar */}
      <SectionHeaderToolbar
        sectionKey={section.key}
        currentTitle={currentTitle}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        editedTitle={editedTitle}
        setEditedTitle={setEditedTitle}
        handleTitleSubmit={handleTitleSubmit}
        hasEditAccess={hasEditAccess}
        isSnapshot={isSnapshot}
        isCopied={isCopied}
        handleCopySection={handleCopySection}
        onDuplicateSection={onDuplicateSection}
        onMoveSectionUp={onMoveSectionUp}
        onMoveSectionDown={onMoveSectionDown}
        isFirstSection={isFirstSection}
        isLastSection={isLastSection}
        onRemoveSection={onRemoveSection}
        isRemoving={isRemoving}
        handleRemoveClick={handleRemoveClick}
        hasSource={!!section.source}
        isAutoFilling={isAutoFilling}
        handleAutoFillClick={handleAutoFillClick}
      />

      {/* Render Section Body Content when Expanded */}
      {!isCollapsed && (
        <>
          {/* Data-Bound Section Rendering (non-charter documents) */}
          {section.type === 'data_bound' && template.document_type !== 'charter' && (
            <div className="py-2 pl-4 border-l-2 border-violet-500/30 text-app-fg text-sm">
              <SectionResolverSwitch
                section={section}
                template={template}
                generatedDoc={generatedDoc}
                projectId={projectId}
                projectContext={projectContext}
                isSnapshot={isSnapshot}
                hasEditAccess={hasEditAccess}
                freeText={freeText}
                handleFreeTextChange={handleFreeTextChange}
                resolveDataBoundSource={resolveDataBoundSource}
              />
            </div>
          )}

          {/* Free-Text & Hybrid Charter Section Rendering */}
          {(section.type === 'free_text' || template.document_type === 'charter') && (
            <div className="mt-2">
              <StructuredEditableField
                value={freeText[section.key] || ''}
                onChange={(val) => handleFreeTextChange(section.key, val)}
                title={section.title}
                hasEditAccess={hasEditAccess && !isSnapshot}
                isDataBound={section.type === 'data_bound'}
                placeholder={section.placeholder}
                documentType={template.document_type}
                organizationId={projectContext?.organization_id}
              />
            </div>
          )}
        </>
      )}

      {/* Confirmation Delete Warning Modal */}
      <SectionDeleteConfirmModal
        isOpen={showConfirmDelete}
        currentTitle={currentTitle}
        isRemoving={isRemoving}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
