'use client'

import React from 'react'
import { Sparkles, X, Check, Copy, AlertCircle, Loader2, FileText, ClipboardList } from 'lucide-react'
import { getDualLabels } from '@/lib/releases/epic-link-constants'
import { useReleaseNotesAiGenerator } from '../hooks/useReleaseNotesAiGenerator'

export interface ReleaseNotesAiGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  releaseId: string
  releaseName: string
  projectId: string
  methodology?: string | null
  onGenerated?: () => void
}

export function ReleaseNotesAiGeneratorModal({
  isOpen,
  onClose,
  releaseId,
  releaseName,
  projectId,
  methodology = 'Agile',
  onGenerated,
}: ReleaseNotesAiGeneratorModalProps) {
  const {
    loading,
    error,
    releaseNotes,
    checklistCount,
    copied,
    handleGenerate,
    handleCopy
  } = useReleaseNotesAiGenerator({
    releaseId,
    projectId,
    methodology: methodology || 'Agile',
    onGenerated
  })

  const labels = getDualLabels(methodology)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-app-fg">
                Praz-AI {labels.releaseNotesTerm} Generator
              </h3>
              <p className="text-xs text-app-muted">
                Target Release: <span className="text-purple-600 dark:text-purple-300 font-medium">{releaseName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!releaseNotes && !loading && (
            <div className="text-center py-8 px-4 border border-dashed border-app-border rounded-xl bg-app-surface/30">
              <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto mb-3 opacity-80" />
              <h4 className="text-sm font-semibold text-app-fg mb-1">
                Auto-Synthesize {labels.releaseNotesTerm} & Checklists
              </h4>
              <p className="text-xs text-app-muted max-w-md mx-auto mb-6">
                Praz-AI will scan all completed {labels.storiesTerm.toLowerCase()} in this release, group them under their parent {labels.epicsTerm.toLowerCase()}, and generate formatted release notes + a technical readiness checklist.
              </p>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate {labels.releaseNotesTerm} Now
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
              <p className="text-xs font-medium text-app-fg">
                Praz-AI is analyzing {labels.storiesTerm.toLowerCase()} & {labels.epicsTerm.toLowerCase()}...
              </p>
            </div>
          )}

          {releaseNotes && (
            <div className="space-y-4">
              {checklistCount > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Successfully added <strong>{checklistCount}</strong> technical readiness items to your {labels.checklistTerm}.
                  </span>
                </div>
              )}

              <div className="relative border border-app-border rounded-xl bg-app-surface/40 p-4">
                <div className="flex items-center justify-between mb-3 border-b border-app-border pb-2">
                  <span className="text-xs font-semibold text-app-fg flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Generated Markdown Output
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-app-card hover:bg-app-surface text-app-fg border border-app-border transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-app-muted" />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                  </button>
                </div>
                <pre className="text-xs text-app-fg font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                  {releaseNotes}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-app-border bg-app-surface/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
