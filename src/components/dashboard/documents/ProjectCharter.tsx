'use client'

import { useState, useEffect } from 'react'
import DocumentEngine from './DocumentEngine'
import { getDocumentTemplate, getGeneratedDocument, DocumentTemplate, GeneratedDocument } from '@/lib/documents/actions'

interface ProjectCharterProps {
  projectId: string
  projectContext: any
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function ProjectCharter({
  projectId,
  projectContext,
  hasEditAccess,
  onShowToast
}: ProjectCharterProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const tpl = await getDocumentTemplate('charter')
      if (tpl) {
        setTemplate(tpl)
        const doc = await getGeneratedDocument(projectId, 'charter')
        setGeneratedDoc(doc)
      } else {
        onShowToast('error', 'Could not load Project Charter template')
      }
      setLoading(false)
    }
    load()
  }, [projectId, onShowToast])

  if (loading) {
    return (
      <div className="flex h-[800px] items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-sm text-app-muted font-medium">Loading Templating Engine...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-[800px] items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <p className="text-sm text-app-muted">Template "charter" not found in database.</p>
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
    />
  )
}
