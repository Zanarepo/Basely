'use client'

/**
 * AdrSkillGapPanel — UI Component (Integration 3)
 * Displays skill gap warnings triggered when an ADR is accepted.
 */

import { AlertTriangle, CheckCircle2, Sparkles, Loader2, Users } from 'lucide-react'
import type { AdrSkillGapResult } from '@/lib/adr/adr-workflow-logic'

interface AdrSkillGapPanelProps {
  result: AdrSkillGapResult | null
  isLoading: boolean
  error: string | null
  onRunCheck: () => void
  tier: string
}

export function AdrSkillGapPanel({
  result,
  isLoading,
  error,
  onRunCheck,
  tier,
}: AdrSkillGapPanelProps) {
  const isPremiumOrAbove = tier === 'premium' || tier === 'enterprise'

  return (
    <div className="mt-4 border-t border-app-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-app-fg uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            Team Skill Gap Check
          </p>
          <p className="text-xs text-app-muted mt-0.5">AI checks if your team has the skills required by this decision.</p>
        </div>
        <button
          type="button"
          onClick={onRunCheck}
          disabled={isLoading || !isPremiumOrAbove}
          title={!isPremiumOrAbove ? 'Premium tier required' : 'Run skill gap check for this ADR'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 border border-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isLoading ? 'Checking...' : 'Check Skills'}
          {!isPremiumOrAbove && <span className="ml-1 text-[9px] uppercase bg-violet-500/20 px-1 py-0.5 rounded">Premium</span>}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500">{error}</div>
      )}

      {result && (
        <div className={`p-4 rounded-xl border ${result.hasGaps ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.hasGaps
              ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            <p className={`text-xs font-bold ${result.hasGaps ? 'text-amber-500' : 'text-emerald-500'}`}>
              {result.hasGaps ? 'Skill Gaps Detected' : 'All Skills Covered'}
            </p>
          </div>

          <p className="text-xs text-app-muted leading-relaxed mb-3">{result.summary}</p>

          {result.missingSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {result.missingSkills.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Missing: {skill}
                </span>
              ))}
            </div>
          )}

          {result.warnings.length > 0 && (
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
