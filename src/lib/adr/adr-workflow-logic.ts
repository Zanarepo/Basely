/**
 * ADR Workflow Logic Layer
 * Responsible ONLY for types, interfaces, and pure business logic transformations.
 * No database calls, no AI calls, no UI.
 */

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type RaidCategory = 'risk' | 'assumption' | 'dependency'
export type RaidPriority = 'low' | 'medium' | 'high' | 'critical'

// ─── Integration 1: RAID Extraction ──────────────────────────────────────────

export interface AdrRaidSuggestion {
  category: RaidCategory
  title: string
  description: string
  priority: RaidPriority
}

export interface AdrRaidExtractionResult {
  suggestions: AdrRaidSuggestion[]
}

/** Maps priority string to a display colour class */
export function getRaidPriorityColor(priority: RaidPriority): string {
  switch (priority) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'high':     return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'medium':   return 'text-violet-500 bg-violet-500/10 border-violet-500/20'
    case 'low':      return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}

export function getRaidCategoryIcon(category: RaidCategory): string {
  switch (category) {
    case 'risk':       return '🛡️'
    case 'assumption': return '💡'
    case 'dependency': return '🧩'
  }
}

// ─── Integration 2: WBS Compliance ───────────────────────────────────────────

export interface WbsComplianceViolation {
  adrTitle: string
  conflict: string
  recommendation: string
}

export interface WbsComplianceResult {
  isCompliant: boolean
  violations: WbsComplianceViolation[]
  summary: string
}

// ─── Integration 3: ADR Skill Gap ────────────────────────────────────────────

export interface AdrSkillGapResult {
  hasGaps: boolean
  missingSkills: string[]
  warnings: string[]
  summary: string
}
