'use client'

import { useState, useEffect } from 'react'
import DocumentEngine from './DocumentEngine'
import { getDocumentTemplate, getGeneratedDocument, updateDocumentTemplateId, DocumentTemplate, GeneratedDocument } from '@/lib/documents/actions'
import { getCustomTemplates, CustomDocumentTemplate } from '@/lib/documents/template-actions'
import { FileText, LayoutTemplate, ArrowRight } from 'lucide-react'

interface ProjectDocumentProps {
  documentType: string
  projectId: string
  projectContext: any
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
  snapshotId?: string
}

export default function ProjectDocument({
  documentType,
  projectId,
  projectContext,
  hasEditAccess,
  onShowToast,
  isSnapshot = false,
  snapshotId
}: ProjectDocumentProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Selection state
  const [availableCustomTemplates, setAvailableCustomTemplates] = useState<CustomDocumentTemplate[]>([])
  const [needsTemplateSelection, setNeedsTemplateSelection] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      
      // 1. Check for existing generated document
      const doc = await getGeneratedDocument(projectId, documentType, isSnapshot, snapshotId)
      setGeneratedDoc(doc)

      if (doc) {
        // Document exists: load the specific template it was generated with
        const tpl = await getDocumentTemplate(documentType, doc.custom_template_id)
        if (tpl) {
          setTemplate(tpl)
        } else {
          onShowToast('error', `Could not load template for this document`)
        }
      } else {
        // No existing document: Check for custom templates
        const customTemplates = await getCustomTemplates(projectContext.organization_id, documentType)
        
        if (customTemplates.length > 0 && hasEditAccess && !isSnapshot) {
          setAvailableCustomTemplates(customTemplates)
          setNeedsTemplateSelection(true)
        } else {
          // No custom templates or no edit access: use default
          const tpl = await getDocumentTemplate(documentType)
          if (tpl) {
            setTemplate(tpl)
          } else {
            onShowToast('error', `Could not load default template`)
          }
        }
      }
      
      setLoading(false)
    }
    load()
  }, [documentType, projectId, onShowToast, isSnapshot, snapshotId, projectContext.organization_id, hasEditAccess])

  const handleShowSelector = async () => {
    setLoading(true)
    if (availableCustomTemplates.length === 0) {
      const customTemplates = await getCustomTemplates(projectContext.organization_id, documentType)
      setAvailableCustomTemplates(customTemplates)
    }
    setNeedsTemplateSelection(true)
    setLoading(false)
  }

  const handleSelectTemplate = async (templateId?: string) => {
    setLoading(true)
    const tpl = await getDocumentTemplate(documentType, templateId)
    if (tpl) {
      setTemplate(tpl)
      setNeedsTemplateSelection(false)
      
      // If a document is already generated, update its template immediately in DB
      if (generatedDoc) {
        await updateDocumentTemplateId(projectId, documentType, tpl.is_custom ? tpl.id : null)
      }
    } else {
      onShowToast('error', 'Failed to load selected template')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[600px] items-center justify-center bg-app-surface border border-app-border rounded-xl shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-sm text-app-muted font-medium">Loading Document Engine...</p>
        </div>
      </div>
    )
  }

  if (needsTemplateSelection) {
    return (
      <div className="flex flex-col h-full min-h-[600px] items-center justify-center bg-app-surface border border-app-border rounded-xl shadow-sm p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
          <LayoutTemplate className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-app-fg mb-2">Select a Template</h2>
        <p className="text-app-muted max-w-md mb-8">
          Your organization has custom templates available for {documentType.replace('_', ' ')}. Which one would you like to use for this project?
        </p>

        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Default Template Option */}
          <button
            onClick={() => handleSelectTemplate()}
            className={`flex flex-col p-5 bg-white dark:bg-app-surface border ${template && !template.is_custom ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-app-border hover:border-indigo-500 hover:shadow-md'} rounded-2xl transition-all group text-left relative overflow-hidden`}
          >
            {template && !template.is_custom && (
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                In Use
              </div>
            )}
            <div className="flex justify-between items-start w-full mb-3">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <ArrowRight className="w-4 h-4 text-app-muted group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
            </div>
            <h3 className="font-semibold text-app-fg mb-1">System Default Template</h3>
            <p className="text-xs text-app-muted">The standard platform structure.</p>
          </button>

          {/* Custom Template Options */}
          {availableCustomTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`flex flex-col p-5 bg-white dark:bg-app-surface border ${template && template.id === t.id ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-app-border hover:border-indigo-500 hover:shadow-md'} rounded-2xl transition-all group text-left relative overflow-hidden`}
            >
              {template && template.id === t.id && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  In Use
                </div>
              )}
              <div className="flex justify-between items-start w-full mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                  <LayoutTemplate className="w-5 h-5 text-indigo-500" />
                </div>
                <ArrowRight className="w-4 h-4 text-app-muted group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
              </div>
              <h3 className="font-semibold text-app-fg mb-1">{t.name}</h3>
              <p className="text-xs text-app-muted line-clamp-1">{t.description || "Organization custom template"}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-full min-h-[600px] items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <p className="text-sm text-app-muted">Template "{documentType}" not found in database.</p>
      </div>
    )
  }

  return (
    <DocumentEngine
      projectId={projectId}
      projectContext={projectContext}
      template={template}
      generatedDoc={generatedDoc}
      hasEditAccess={hasEditAccess}
      onShowToast={onShowToast}
      isSnapshot={isSnapshot}
      onShowTemplateSelector={!isSnapshot && hasEditAccess ? handleShowSelector : undefined}
    />
  )
}
