'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, CheckSquare, Square, ShieldAlert } from 'lucide-react'
import { extractRisksFromDocument, bulkImportRisks } from '@/lib/risks/actions'

interface ImportRiskFromDocumentModalProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onSuccess: (msg: string) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function ImportRiskFromDocumentModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  onShowToast
}: ImportRiskFromDocumentModalProps) {
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [extractedRisks, setExtractedRisks] = useState<any[]>([])
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function fetchRisks() {
      setLoading(true)
      setError(null)
      try {
        const res = await extractRisksFromDocument(projectId)
        if (isMounted) {
          if (res.ok && res.data) {
            setExtractedRisks(res.data)
            setSelectedRiskIds(new Set(res.data.map((r: any) => r.id))) // Select all by default
          } else {
            setError(res.error || 'Failed to extract risks.')
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'An error occurred.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRisks()
    return () => { isMounted = false }
  }, [isOpen, projectId])

  if (!isOpen) return null

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRiskIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRiskIds(newSelection)
  }

  const handleImport = async () => {
    if (selectedRiskIds.size === 0) return
    setImporting(true)
    try {
      const risksToImport = extractedRisks.filter(r => selectedRiskIds.has(r.id))
      const res = await bulkImportRisks(projectId, risksToImport)
      if (res.ok) {
        onSuccess(`Successfully imported ${risksToImport.length} risks.`)
        onClose()
      } else {
        onShowToast('error', res.error || 'Failed to import risks.')
      }
    } catch (err: any) {
      onShowToast('error', err.message || 'An error occurred during import.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
      <div className="bg-white dark:bg-app-surface w-full max-w-3xl rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden h-[85vh] animate-in zoom-in-95 duration-200 cursor-pointer">
        
        <div className="flex items-center justify-between p-6 border-b border-app-border shrink-0 cursor-pointer">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center cursor-pointer">
              <ShieldAlert className="w-5 h-5 text-violet-600 dark:text-violet-400 cursor-pointer" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg cursor-pointer">Import from Risk Register</h2>
              <p className="text-sm text-app-muted cursor-pointer">Select the AI-generated risks you want to add to your database.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-app-muted cursor-pointer"
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1 bg-gray-50 dark:bg-gray-900/50 cursor-pointer">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full cursor-pointer">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4 cursor-pointer" />
              <p className="text-sm text-app-muted cursor-pointer">Extracting risks from document...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 cursor-pointer">
                <ShieldAlert className="w-6 h-6 text-red-500 cursor-pointer" />
              </div>
              <h3 className="text-lg font-semibold text-app-fg mb-2 cursor-pointer">Extraction Failed</h3>
              <p className="text-sm text-app-muted cursor-pointer">{error}</p>
            </div>
          ) : extractedRisks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4 cursor-pointer">
                <ShieldAlert className="w-6 h-6 text-amber-500 cursor-pointer" />
              </div>
              <h3 className="text-lg font-semibold text-app-fg mb-2 cursor-pointer">No Risks Found</h3>
              <p className="text-sm text-app-muted cursor-pointer">We couldn't find a valid risk table in the Risk Register document. Please ensure it has been generated.</p>
            </div>
          ) : (
            <div className="space-y-3 cursor-pointer">
              {extractedRisks.map((risk) => (
                <div 
                  key={risk.id}
                  onClick={() => toggleSelection(risk.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex gap-4 ${
                    selectedRiskIds.has(risk.id) 
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/5' 
                      : 'border-transparent bg-white dark:bg-app-surface hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="pt-1 cursor-pointer">
                    {selectedRiskIds.has(risk.id) ? (
                      <CheckSquare className="w-5 h-5 text-violet-500 cursor-pointer" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 cursor-pointer" />
                    )}
                  </div>
                  <div className="flex-1 cursor-pointer">
                    <h4 className="font-semibold text-app-fg text-sm mb-1 cursor-pointer">{risk.title}</h4>
                    <p className="text-xs text-app-muted line-clamp-2 mb-3 cursor-pointer">{risk.mitigation_plan || risk.description}</p>
                    <div className="flex gap-4 text-xs font-medium cursor-pointer">
                      <span className="text-rose-600 dark:text-rose-400 cursor-pointer">Impact: {risk.impact}</span>
                      <span className="text-amber-600 dark:text-amber-400 cursor-pointer">Probability: {risk.probability}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer">Strategy: {risk.response_strategy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-app-border shrink-0 bg-white dark:bg-app-surface flex items-center justify-between cursor-pointer">
          <div className="text-sm font-medium text-app-muted cursor-pointer">
            {selectedRiskIds.size} of {extractedRisks.length} selected
          </div>
          <div className="flex gap-3 cursor-pointer">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-sm font-semibold text-app-fg hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedRiskIds.size === 0 || loading || !!error}
              className="flex items-center gap-2 px-5 py-2 bg-violet-500 text-white text-sm font-semibold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin cursor-pointer" /> Importing...</>
              ) : (
                <>Import Selected Risks</>
              )}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}
