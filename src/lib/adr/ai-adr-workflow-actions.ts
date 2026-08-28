'use server'

/**
 * ADR Workflow AI Actions (Server Actions)
 * Responsible ONLY for AI calls. All data fetching is delegated to adr-workflow-data.ts.
 * All types are imported from adr-workflow-logic.ts.
 */

import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { checkAiUsageLimit, incrementAiUsage } from '@/lib/organizations/ai-usage-actions'
import { getAdrById, getWbsWithLinkedAdrs, getAdrsByIds } from './adr-workflow-data'
import { getTeamCapacityMatrix } from '@/lib/wbs/skill-gap-data'
import type {
  AdrRaidExtractionResult,
  WbsComplianceResult,
  AdrSkillGapResult,
} from './adr-workflow-logic'

// ─── Integration 1: Extract RAID Suggestions (Enterprise) ────────────────────

export async function extractRaidSuggestionsFromAdr(
  adrId: string,
  organizationId: string
): Promise<{ ok: boolean; data?: AdrRaidExtractionResult['suggestions']; error?: string }> {
  try {
    const usageCheck = await checkAiUsageLimit(organizationId, 'max_ai_basic_actions')
    if (!usageCheck.allowed) {
      return { ok: false, error: `Monthly AI limit reached (${usageCheck.maxLimit}). Upgrade to Enterprise for unlimited RAID extraction.` }
    }

    const adr = await getAdrById(adrId)
    if (!adr) return { ok: false, error: 'ADR not found.' }

    const systemPrompt = `You are an expert Project Risk Analyst. Analyze an Architecture Decision Record and extract risks, assumptions, and dependencies that should be logged in a RAID register.

Output a JSON object matching exactly:
{
  "suggestions": [
    {
      "category": "risk" | "assumption" | "dependency",
      "title": "string (concise, max 10 words)",
      "description": "string (1-2 sentences)",
      "priority": "low" | "medium" | "high" | "critical"
    }
  ]
}

Return 3-8 specific, actionable suggestions. Do NOT be generic.`

    const userPrompt = `ADR: ${adr.title}
Domain: ${adr.technical_domain}
Context: ${adr.context}
Decision: ${adr.decision}
Consequences: ${adr.consequences || 'None documented.'}`

    const result = await generateStructuredJson<AdrRaidExtractionResult>({ systemPrompt, userPrompt })

    if (!result?.suggestions?.length) {
      return { ok: false, error: 'AI could not extract RAID items from this ADR.' }
    }

    await incrementAiUsage(organizationId, 'basic_actions', 1)
    return { ok: true, data: result.suggestions }
  } catch (err: any) {
    console.error('extractRaidSuggestionsFromAdr error:', err)
    return { ok: false, error: err.message || 'Failed to extract RAID suggestions.' }
  }
}

// ─── Integration 2: WBS Compliance Check (Premium) ───────────────────────────

export async function checkWbsAdrCompliance(
  wbsElementId: string,
  organizationId: string
): Promise<{ ok: boolean; data?: WbsComplianceResult; error?: string }> {
  try {
    const usageCheck = await checkAiUsageLimit(organizationId, 'max_ai_generations')
    if (!usageCheck.allowed) {
      return { ok: false, error: 'Monthly AI generation limit reached. Upgrade for unlimited compliance checks.' }
    }

    const wbs = await getWbsWithLinkedAdrs(wbsElementId)
    if (!wbs) return { ok: false, error: 'WBS element not found.' }
    if (!wbs.linkedAdrIds.length) {
      return { ok: false, error: 'No ADRs linked to this WBS element. Link at least one ADR first.' }
    }

    const adrs = await getAdrsByIds(wbs.linkedAdrIds)
    if (!adrs.length) return { ok: false, error: 'Could not load linked ADRs.' }

    const adrContext = adrs.map((a, i) =>
      `ADR ${i + 1} — ${a.title}:\nDecision: ${a.decision}\nConsequences: ${a.consequences}`
    ).join('\n\n')

    const systemPrompt = `You are a Senior Software Architect enforcing Architecture Decision Records (ADRs).

Check the WBS task against each linked ADR and detect any conflicts between the proposed approach and the architectural mandates.

Output a JSON object matching exactly:
{
  "isCompliant": boolean,
  "violations": [
    {
      "adrTitle": "string",
      "conflict": "string (What exactly conflicts?)",
      "recommendation": "string (What should be done instead?)"
    }
  ],
  "summary": "string (1 sentence overall verdict)"
}

If isCompliant is true, violations must be [].`

    const userPrompt = `WBS Task: ${wbs.wbsName}
Description: ${wbs.wbsDescription || 'No description provided.'}

LINKED ADRs:
${adrContext}`

    const result = await generateStructuredJson<WbsComplianceResult>({ systemPrompt, userPrompt })
    if (!result) return { ok: false, error: 'AI compliance check returned no result.' }

    await incrementAiUsage(organizationId, 'generations', 1)
    return { ok: true, data: result }
  } catch (err: any) {
    console.error('checkWbsAdrCompliance error:', err)
    return { ok: false, error: err.message || 'Compliance check failed.' }
  }
}

// ─── Integration 3: ADR Skill Gap Check (Premium) ────────────────────────────

export async function checkAdrSkillGaps(
  adrId: string,
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; data?: AdrSkillGapResult; error?: string }> {
  try {
    const usageCheck = await checkAiUsageLimit(organizationId, 'max_ai_generations')
    if (!usageCheck.allowed) {
      return { ok: false, error: 'Monthly AI generation limit reached. Upgrade for skill gap analysis.' }
    }

    const adr = await getAdrById(adrId)
    if (!adr) return { ok: false, error: 'ADR not found.' }

    const teamMatrix = await getTeamCapacityMatrix(projectId, organizationId)
    const teamContext = teamMatrix.length
      ? teamMatrix.map(t =>
          `- ${t.name} (${t.role}): Skills: ${t.skills.join(', ') || 'None listed'} | ${t.allocated_percentage}% booked`
        ).join('\n')
      : 'No team members mapped to this project yet.'

    const systemPrompt = `You are a Technical Resource Planning AI. Extract what skills/technologies an ADR requires and cross-reference against the team capacity matrix to identify skill deficits.

Output a JSON object matching exactly:
{
  "hasGaps": boolean,
  "missingSkills": ["string"],
  "warnings": ["string"],
  "summary": "string (1-2 sentence assessment)"
}

If hasGaps is false, missingSkills and warnings must be [].`

    const userPrompt = `ADR: ${adr.title}
Domain: ${adr.technical_domain}
Technical Decision: ${adr.decision}

TEAM CAPACITY MATRIX:
${teamContext}`

    const result = await generateStructuredJson<AdrSkillGapResult>({ systemPrompt, userPrompt })
    if (!result) return { ok: false, error: 'AI skill gap check returned no result.' }

    await incrementAiUsage(organizationId, 'generations', 1)
    return { ok: true, data: result }
  } catch (err: any) {
    console.error('checkAdrSkillGaps error:', err)
    return { ok: false, error: err.message || 'ADR skill gap check failed.' }
  }
}
