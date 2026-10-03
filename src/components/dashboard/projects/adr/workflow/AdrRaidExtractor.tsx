'use client'

/**
 * AdrRaidExtractor — UI Component (Integration 1)
 * Shows AI-extracted RAID suggestions from an ADR and lets the PM approve individual entries.
 */

import { useState } from 'react'
import { Sparkles, Loader2, ShieldAlert, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { extractRaidSuggestionsFromAdr } from '@/lib/adr/ai-adr-workflow-actions'
import { createRaidEntryFromAdrSuggestion } from '@/lib/adr/adr-workflow-data'
import { getRaidPriorityColor, getRaidCategoryIcon } from '@/lib/adr/adr-workflow-logic'
import type { AdrRaidSuggestion } from '@/lib/adr/adr-workflow-logic'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface AdrRaidExtractorProps {
  adrId: string
  projectId: string
  organizationId: string
  tier: string
  onSuccess?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function AdrRaidExtractor({
  adrId,
  projectId,
  organizationId,
  tier,
  onSuccess,
  onShowToast,
}: AdrRaidExtractorProps) {
  const [suggestions, setSuggestions] = useState<AdrRaidSuggestion[]>([])
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set())
  const [savingId, setSavingId] = useState<number | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { UpgradePromptModalProps } = useAiEntitlements(organizationId)

  // Enterprise-only feature
  const isEnterprise = tier === 'enterprise'

  const handleExtract = async () => {
    if (!isEnterprise) return
    setIsExtracting(true)
    setError(null)
    setSuggestions([])

    const res = await extractRaidSuggestionsFromAdr(adrId, organizationId)
    setIsExtracting(false)

    if (!res.ok || !res.data) {
      setError(res.error || 'Failed to extract RAID suggestions.')
      return
    }
    setSuggestions(res.data)
  }

  const handleApprove = async (suggestion: AdrRaidSuggestion, index: number) => {
    setSavingId(index)
    const res = await createRaidEntryFromAdrSuggestion({
      projectId,
      organizationId,
      sourceAdrId: adrId,
      category: suggestion.category,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
    })
    setSavingId(null)

    if (res.ok) {
      setApprovedIds(prev => new Set(prev).add(index))
      onShowToast?.('success', `"${suggestion.title}" added to RAID log.`)
      onSuccess?.()
    } else {
      onShowToast?.('error', res.error || 'Failed to save RAID entry.')
    }
  }

  return (
    <div className="mt-4 border-t border-app-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-app-fg uppercase tracking-wider">Extract RAID Entries</p>
          <p className="text-xs text-app-muted mt-0.5">AI scans Consequences & Context to stage RAID entries for approval.</p>
        </div>
        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting || !isEnterprise}
          title={!isEnterprise ? 'Enterprise tier required' : 'Extract RAID suggestions from this ADR'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isExtracting ? 'Extracting...' : 'Extract to RAID'}
          {!isEnterprise && <span className="ml-1 text-[9px] uppercase bg-rose-500/20 px-1 py-0.5 rounded">Enterprise</span>}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => {
            const approved = approvedIds.has(i)
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border transition-all ${approved ? 'opacity-50 bg-emerald-500/5 border-emerald-500/20' : 'bg-app-input border-app-border'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm">{getRaidCategoryIcon(s.category)}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRaidPriorityColor(s.priority)}`}>
                        {s.priority}
                      </span>
                      <span className="text-[10px] text-app-muted uppercase font-semibold">{s.category}</span>
                    </div>
                    <p className="text-xs font-bold text-app-fg">{s.title}</p>
                    <p className="text-xs text-app-muted mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                  {approved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                  ) : (
                    <button
                      type="button"
                      disabled={savingId === i}
                      onClick={() => handleApprove(s, i)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {savingId === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Add to RAID
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}
