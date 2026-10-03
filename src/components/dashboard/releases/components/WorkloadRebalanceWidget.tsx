import React from 'react'
import { Sparkles, Loader2, AlertCircle, Check, X, Users, ArrowRight } from 'lucide-react'
import { useWorkloadRebalance } from '../hooks/useWorkloadRebalance'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface WorkloadRebalanceWidgetProps {
  projectId: string
  organizationId: string
  iterationId: string
}

export function WorkloadRebalanceWidget({ projectId, organizationId, iterationId }: WorkloadRebalanceWidgetProps) {
  const {
    isAnalyzing,
    isApplying,
    suggestions,
    message,
    error,
    analyzeWorkload,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions
  } = useWorkloadRebalance(projectId, organizationId, iterationId)

  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleOptimizeWorkload = async () => {
    const hasLimit = await checkLimit('max_ai_generations')
    if (!hasLimit) return
    await recordUsage('generations', 1)
    await analyzeWorkload()
  }

  return (
    <div className="w-full bg-app-surface/50 border border-violet-500/20 rounded-2xl p-4 overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-2xl rounded-full pointer-events-none" />

      <div className="flex flex-col items-start gap-3 mb-2 relative z-10">
        <div>
          <h3 className="font-bold text-app-fg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Dynamic Workload Rebalancing
          </h3>
          <p className="text-sm text-app-muted mt-1">
            Analyze team capacity against sprint scope. AI will suggest reassigning tasks if any member is overloaded.
          </p>
        </div>
        
        <button
          onClick={handleOptimizeWorkload}
          disabled={isAnalyzing || isChecking}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white text-sm font-semibold rounded-xl hover:bg-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-app-bg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isAnalyzing || isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Optimize Workload
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error analyzing workload
          </div>
          <p>{error}</p>
        </div>
      )}

      {message && !error && suggestions.length === 0 && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={clearSuggestions} className="text-emerald-500/60 hover:text-emerald-500 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-app-fg text-violet-400">
              Suggested Reassignments
            </h4>
            <span className="text-xs text-app-muted bg-app-card px-2 py-1 rounded-md">
              {suggestions.length} items
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {suggestions.map((suggestion) => (
              <div key={suggestion.wbsElementId} className="bg-app-card border border-app-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-app-fg text-sm truncate">{suggestion.wbsElementName}</h5>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">
                        <Users className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{suggestion.currentStakeholderName}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-app-muted" />
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                        <Users className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{suggestion.suggestedStakeholderName}</span>
                      </div>
                    </div>

                    <p className="text-xs text-app-muted mt-3 bg-app-bg/50 p-2 rounded-lg border border-app-border/50">
                      <span className="font-medium text-violet-400 block mb-1">AI Reasoning:</span>
                      {suggestion.justification}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => acceptSuggestion(suggestion)}
                      disabled={isApplying}
                      className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Accept Reassignment"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => dismissSuggestion(suggestion.wbsElementId)}
                      disabled={isApplying}
                      className="p-1.5 bg-app-bg text-app-muted hover:text-app-fg hover:bg-app-surface rounded-lg transition-colors disabled:opacity-50"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {UpgradePromptModalProps.isOpen && (
        <UpgradePromptModal
          {...UpgradePromptModalProps}
          currentTier="free" // fallback
        />
      )}
    </div>
  )
}
