'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, CheckSquare, Square, Sparkles } from 'lucide-react'
import { scanExecutionRisks, type AiGeneratedRisk } from '@/lib/risks/ai-risk-actions'
import { bulkImportRisks } from '@/lib/risks/actions'

interface AiExecutionRiskScannerModalProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onSuccess: (msg: string) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function AiExecutionRiskScannerModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  onShowToast
}: AiExecutionRiskScannerModalProps) {
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [extractedRisks, setExtractedRisks] = useState<(AiGeneratedRisk & { id: string })[]>([])
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function fetchRisks() {
      setLoading(true)
      setError(null)
      try {
        const res = await scanExecutionRisks(projectId)
        if (isMounted) {
          if (res.ok && res.data) {
            // Assign a temporary ID for selection purposes
            const risksWithIds = res.data.map((r, i) => ({ ...r, id: `ai-risk-${i}` }))
            setExtractedRisks(risksWithIds)
            setSelectedRiskIds(new Set(risksWithIds.map(r => r.id))) // Select all by default
          } else {
            setError(res.error || 'Failed to scan execution risks.')
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
      const severityToNumber = (val: string) => val === 'High' ? 3 : val === 'Medium' ? 2 : 1;
      
      const risksToImport = extractedRisks
        .filter(r => selectedRiskIds.has(r.id))
        .map(r => ({
          title: r.title,
          description: r.description,
          probability: severityToNumber(r.probability),
          impact: severityToNumber(r.impact),
          response_strategy: 'Mitigate',
          mitigation_plan: r.response_strategy,
          status: 'Identified'
        }))

      const res = await bulkImportRisks(projectId, risksToImport)
      if (res.ok) {
        onSuccess(`Successfully imported ${risksToImport.length} execution risks.`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-app-surface w-full max-w-3xl rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden h-[85vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-app-border shrink-0 bg-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg">Scan Execution Data</h2>
              <p className="text-sm text-app-muted">Praz-AI is scanning your PRD, Backlog, and WBS for bottlenecks.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-app-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-app-bg">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <div>
                <h3 className="font-semibold text-app-fg text-lg">Praz-AI is analyzing your execution data...</h3>
                <p className="text-app-muted text-sm mt-1">Cross-referencing PRD features with WBS tasks to find scope creep and technical risks.</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-app-fg text-lg">Scan Failed</h3>
                <p className="text-app-muted text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-app-surface border border-app-border rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : extractedRisks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-fg text-lg">No execution risks found</h3>
                <p className="text-app-muted text-sm mt-1">Your execution data looks solid for now.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-app-fg">
                Select the risks you want to import into your database:
              </p>
              <div className="space-y-3">
                {extractedRisks.map((risk) => {
                  const isSelected = selectedRiskIds.has(risk.id)
                  return (
                    <div 
                      key={risk.id}
                      onClick={() => toggleSelection(risk.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 ${
                        isSelected 
                          ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-500 shadow-sm' 
                          : 'bg-white dark:bg-app-surface border-app-border hover:border-violet-500/50'
                      }`}
                    >
                      <div className="pt-1">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-app-fg text-sm">{risk.title}</h4>
                          <div className="flex gap-2 text-[10px] font-bold tracking-wider uppercase">
                            <span className={`px-2 py-0.5 rounded border ${
                              risk.probability === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
                              risk.probability === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              Prob: {risk.probability}
                            </span>
                            <span className={`px-2 py-0.5 rounded border ${
                              risk.impact === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
                              risk.impact === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              Impact: {risk.impact}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-app-muted mb-3">{risk.description}</p>
                        
                        <div className="bg-white/50 dark:bg-app-bg p-3 rounded-lg border border-app-border text-sm">
                          <span className="font-semibold text-app-fg block mb-1">Mitigation Strategy:</span>
                          <span className="text-app-muted">{risk.response_strategy}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app-border bg-app-surface shrink-0 flex items-center justify-between">
          <div className="text-sm text-app-muted">
            {!loading && !error && extractedRisks.length > 0 && (
              <span>{selectedRiskIds.size} of {extractedRisks.length} selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-sm font-semibold text-app-fg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedRiskIds.size === 0 || loading || !!error}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import Selected
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
