'use client'

import { useState, useTransition, useEffect } from 'react'
import { FileText, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { DocumentTemplate, GeneratedDocument, saveGeneratedDocument, regenerateDocument } from '@/lib/documents/actions'
import WbsDictionaryResolver from './resolvers/WbsDictionaryResolver'
import RaciMatrixResolver from './resolvers/RaciMatrixResolver'

interface DocumentEngineProps {
  projectId: string
  projectContext: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function DocumentEngine({
  projectId,
  projectContext,
  template,
  generatedDoc,
  hasEditAccess,
  onShowToast,
}: DocumentEngineProps) {
  const [isPending, startTransition] = useTransition()
  
  // Local state for free text content, seeded from DB
  const [freeText, setFreeText] = useState<Record<string, string>>({})
  
  // Track if we have unsaved changes
  const [isDirty, setIsDirty] = useState(false)
  
  // Modal state for regeneration confirmation
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  // Initialize state
  useEffect(() => {
    if (generatedDoc?.free_text_content) {
      setFreeText(generatedDoc.free_text_content)
    } else {
      setFreeText({})
    }
    setIsDirty(false)
  }, [generatedDoc])

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
    // If we have free text content already, show confirmation to assure the user it won't be lost.
    if (Object.keys(freeText).length > 0 && generatedDoc) {
      setShowRegenConfirm(true)
    } else {
      executeRegenerate()
    }
  }

  const executeRegenerate = () => {
    setShowRegenConfirm(false)
    startTransition(async () => {
      // First save any dirty text so it isn't lost during the refresh
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

  // A tiny resolver engine for data sources
  const resolveDataBoundSource = (source?: string) => {
    if (!source) return '—'
    
    // Resolve project setup fields
    if (source.startsWith('project.')) {
      const field = source.split('.')[1]
      
      // CamelCase or snake_case mapping for common project fields
      const projectValue = projectContext[field] || projectContext[field.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())]
      
      if (!projectValue) return 'Not specified'
      
      // Format dates
      if (field.includes('date')) {
        return new Date(projectValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }
      
      return String(projectValue)
    }
    
    return `Unknown source: ${source}`
  }

  return (
    <div className="flex flex-col h-full bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
      {/* Engine Header / Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface-solid">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app-fg capitalize">{template.document_type} Document</h2>
            <p className="text-xs text-app-muted">
              {generatedDoc 
                ? `Last generated: ${new Date(generatedDoc.generated_at).toLocaleString()}`
                : 'Not yet generated (Preview Mode)'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasEditAccess && (
            <button
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isPending ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          
          {(hasEditAccess || generatedDoc) && (
            <button
              onClick={handleRegenerate}
              disabled={isPending}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Document Content Rendering */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-app-bg">
        <div className="max-w-4xl mx-auto space-y-10 bg-app-surface border border-app-border rounded-lg shadow-sm p-8 md:p-12 relative min-h-[800px]">
          
          {/* Watermark for preview */}
          {!generatedDoc && (
            <div className="absolute top-10 right-10 opacity-10 rotate-12 pointer-events-none">
              <span className="text-6xl font-black uppercase tracking-widest text-slate-500">Draft</span>
            </div>
          )}

          {/* Engine: Loop through all sections in the template */}
          {template.section_definitions.map((section, idx) => (
            <div key={section.key || idx} className="space-y-3 group">
              <div className="flex items-center justify-between border-b border-app-border pb-2">
                <h3 className="text-lg font-bold text-app-fg">{section.title}</h3>
                
                {/* Visual indicator of section type */}
                {section.type === 'data_bound' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" title="Auto-populated from live data. Cannot be edited directly.">
                    <RefreshCw className="w-3 h-3" /> Auto-populated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <FileText className="w-3 h-3" /> Free-text
                  </span>
                )}
              </div>

              {/* Data-Bound Section Rendering */}
              {section.type === 'data_bound' && (
                <div className="py-2 pl-4 border-l-2 border-indigo-500/30 text-app-fg text-sm">
                  {section.source === 'wbs.dictionary' ? (
                    <WbsDictionaryResolver projectId={projectId} />
                  ) : section.source === 'raci.matrix' ? (
                    <RaciMatrixResolver projectId={projectId} />
                  ) : section.source === 'wbs.prototype' ? (
                    /* Prototype Tabular Resolver for Sprint 12 Validation */
                    <div className="border border-app-border rounded-lg overflow-hidden my-4">
                      <table className="min-w-full divide-y divide-app-border">
                        <thead className="bg-app-muted-surface">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-app-muted uppercase tracking-wider">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-app-muted uppercase tracking-wider">Deliverable / Work Package</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-app-muted uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-app-surface divide-y divide-app-border">
                          <tr>
                            <td className="px-4 py-3 text-sm text-app-fg">1.1</td>
                            <td className="px-4 py-3 text-sm font-medium text-app-fg">Prototype Tabular Engine Support</td>
                            <td className="px-4 py-3 text-sm text-app-fg"><span className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500">Validation</span></td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-app-fg">1.2</td>
                            <td className="px-4 py-3 text-sm font-medium text-app-fg">WBS Dictionary Connection</td>
                            <td className="px-4 py-3 text-sm text-app-fg"><span className="px-2 py-1 rounded-full text-xs bg-slate-500/10 text-slate-500">Sprint 13</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Standard Flat Key-Value Resolver */
                    <p className="font-medium whitespace-pre-wrap">{resolveDataBoundSource(section.source)}</p>
                  )}
                </div>
              )}

              {/* Free-Text Section Rendering */}
              {section.type === 'free_text' && (
                <div className="py-1">
                  {hasEditAccess ? (
                    <textarea
                      value={freeText[section.key] || ''}
                      onChange={(e) => handleFreeTextChange(section.key, e.target.value)}
                      placeholder={`Enter ${section.title.toLowerCase()}...`}
                      className="w-full min-h-[120px] p-4 bg-app-surface-solid border border-app-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y transition-shadow placeholder:text-app-muted/50"
                    />
                  ) : (
                    <div className="pl-4 py-2 border-l-2 border-emerald-500/30 text-app-fg text-sm whitespace-pre-wrap min-h-[60px]">
                      {freeText[section.key] ? freeText[section.key] : <span className="text-app-muted italic">No content provided.</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regeneration Confirmation Modal */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-app-fg">Regenerate Document?</h3>
            </div>
            <p className="text-sm text-app-muted mb-6 leading-relaxed">
              This will refresh all <strong className="text-indigo-500">Data-bound</strong> sections with the latest live data from your project.
              <br /><br />
              Don't worry, your <strong className="text-emerald-500">Free-text</strong> edits (like Business Case and Objectives) will <strong>never</strong> be overwritten or lost during this process.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowRegenConfirm(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={executeRegenerate}
                className="btn-primary px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
