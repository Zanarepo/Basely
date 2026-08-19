import React from 'react'
import {
  AlertCircle,
  Sparkles,
  Loader2,
  FileText,
  Copy,
  Check,
  Rocket
} from 'lucide-react'

interface StepShipReleaseNotesProps {
  isPublishEligible: boolean
  scopeCompletionPercent: number
  completedScopeCount: number
  activeScopeItemsLength: number
  labels: { releaseNotesTerm: string; epicsTerm: string }
  generatingNotes: boolean
  handleGenerateNotes: () => Promise<void>
  error: string | null
  releaseNotes: string | null
  handleCopyNotes: () => void
  copied: boolean
  releaseName: string
  readinessPercent: number
  hasEditAccess: boolean
  releaseStatus?: string | null
  onPromoteRelease: () => void
}

export function StepShipReleaseNotes({
  isPublishEligible,
  scopeCompletionPercent,
  completedScopeCount,
  activeScopeItemsLength,
  labels,
  generatingNotes,
  handleGenerateNotes,
  error,
  releaseNotes,
  handleCopyNotes,
  copied,
  releaseName,
  readinessPercent,
  hasEditAccess,
  releaseStatus,
  onPromoteRelease
}: StepShipReleaseNotesProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {!isPublishEligible && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
              Release Governance Gate Locked 🔒
            </div>
            <p className="font-medium leading-relaxed">
              Deliverables completion is currently at <strong>{scopeCompletionPercent}%</strong> ({completedScopeCount}/{activeScopeItemsLength} stories completed). Praz-AI Release Notes and Release Promotion can only be activated when deliverables reach at least <strong>90% completion</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="p-5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Auto-Synthesize {labels.releaseNotesTerm} with Praz-AI
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Praz-AI will group completed deliverables by parent {labels.epicsTerm.toLowerCase()} and format release notes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateNotes}
          disabled={generatingNotes || !isPublishEligible}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
            !isPublishEligible
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer'
          }`}
          title={!isPublishEligible ? `Requires ≥90% deliverables completion (Currently ${scopeCompletionPercent}%)` : ''}
        >
          {generatingNotes ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Praz-AI Thinking...</span>
            </>
          ) : !isPublishEligible ? (
            <span>🔒 Requires ≥90% Completion</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate {labels.releaseNotesTerm}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {releaseNotes ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Formatted Markdown Preview
            </span>
            <button
              type="button"
              onClick={handleCopyNotes}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
          </div>
          <pre className="text-xs text-slate-800 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
            {releaseNotes}
          </pre>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/20">
          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {!isPublishEligible
              ? 'Release notes generation is locked until deliverables reach at least 90% completion.'
              : 'Click the Praz-AI button above to generate formatted release notes.'}
          </p>
        </div>
      )}

      {/* Launch Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-50 via-white to-emerald-50 dark:from-purple-950/60 dark:via-slate-900 dark:to-emerald-950/60 border border-purple-200 dark:border-purple-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Ready to Launch {releaseName}?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {!isPublishEligible
              ? `Deliverables completion is ${scopeCompletionPercent}%. Reach 90% to unlock release deployment.`
              : readinessPercent === 100
              ? 'All quality gates cleared 100%. Click below to authorize release deployment.'
              : `Quality score is ${readinessPercent}%. You can authorize launch now or complete remaining checklist items.`}
          </p>
        </div>

        {hasEditAccess && releaseStatus !== 'released' && (
          <button
            type="button"
            onClick={onPromoteRelease}
            disabled={!isPublishEligible}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all shrink-0 ${
              !isPublishEligible
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer'
            }`}
          >
            {!isPublishEligible ? (
              <span>🔒 Locked (&lt;90% Done)</span>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Ship & Authorize Release 🚀</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
