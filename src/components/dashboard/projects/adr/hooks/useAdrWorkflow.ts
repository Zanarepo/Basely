'use client'

/**
 * useAdrWorkflow — State management hook
 * Handles state and orchestration for all 3 ADR workflow integrations inside AdrStudioModal.
 * Keeps UI components stateless and this hook as the single source of truth.
 */

import { useState } from 'react'
import { checkAdrSkillGaps } from '@/lib/adr/ai-adr-workflow-actions'
import type { AdrSkillGapResult } from '@/lib/adr/adr-workflow-logic'

interface UseAdrWorkflowParams {
  projectId: string
  organizationId: string
  tier: string
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useAdrWorkflow({
  projectId,
  organizationId,
  tier,
  onShowToast,
}: UseAdrWorkflowParams) {
  // ── RAID Extractor state ──
  const [showRaidExtractor, setShowRaidExtractor] = useState(false)

  // ── Skill Gap state ──
  const [skillGapResult, setSkillGapResult] = useState<AdrSkillGapResult | null>(null)
  const [isCheckingSkillGap, setIsCheckingSkillGap] = useState(false)
  const [skillGapError, setSkillGapError] = useState<string | null>(null)

  const runSkillGapCheck = async (adrId: string) => {
    if (!adrId || isCheckingSkillGap) return
    const isPremiumOrAbove = tier === 'premium' || tier === 'enterprise'
    if (!isPremiumOrAbove) {
      onShowToast?.('info', 'Team Skill Gap Check requires a Premium or Enterprise plan.')
      return
    }

    setIsCheckingSkillGap(true)
    setSkillGapError(null)
    setSkillGapResult(null)

    const res = await checkAdrSkillGaps(adrId, projectId, organizationId)
    setIsCheckingSkillGap(false)

    if (!res.ok || !res.data) {
      setSkillGapError(res.error || 'Skill gap check failed.')
      onShowToast?.('error', res.error || 'Skill gap check failed.')
      return
    }

    setSkillGapResult(res.data)
    if (res.data.hasGaps) {
      onShowToast?.('info', `⚠️ Skill gaps detected: ${res.data.missingSkills.join(', ')}`)
    } else {
      onShowToast?.('success', 'No skill gaps found. Your team is ready for this decision.')
    }
  }

  return {
    // RAID Extractor
    showRaidExtractor,
    setShowRaidExtractor,

    // Skill Gap
    skillGapResult,
    isCheckingSkillGap,
    skillGapError,
    runSkillGapCheck,
  }
}
