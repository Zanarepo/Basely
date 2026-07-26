'use client'

import { useState, useEffect } from 'react'
import DocumentEngine from '../documents/DocumentEngine'
import { getDocumentTemplate, DocumentTemplate } from '@/lib/documents/actions'
import { X } from 'lucide-react'

interface InitiationDocumentViewerProps {
  entityId: string
  documentType: 'business_case' | 'feasibility_study'
  onClose: () => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function InitiationDocumentViewer({ entityId, documentType, onClose, onShowToast }: InitiationDocumentViewerProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const tpl = await getDocumentTemplate(documentType)
      if (tpl) {
        setTemplate(tpl)
      } else {
        onShowToast('error', `Could not load ${documentType} template`)
      }
      setLoading(false)
    }
    load()
  }, [documentType, onShowToast])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-5xl bg-app-bg border border-app-border rounded-2xl shadow-2xl animate-fade-in flex flex-col h-[90vh]">
          <div className="shrink-0 px-6 py-4 border-b border-app-border bg-app-surface flex items-center justify-between rounded-t-2xl">
            <h2 className="text-lg font-bold text-app-fg capitalize">
              {documentType.replace('_', ' ')} Viewer
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-app-hover text-app-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-app-bg">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : template ? (
              <DocumentEngine
                projectId={entityId} // We pass entityId as projectId to let Resolvers fetch the entity
                projectContext={{}} // Empty context
                template={template}
                generatedDoc={null} // No draft stored in generated_documents
                hasEditAccess={false} // Prevent auto-fill buttons
                isReadOnlyTemplate={true} // Disables save and snapshot buttons
                onShowToast={onShowToast}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-app-muted">Template not found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
