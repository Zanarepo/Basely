'use server'

import { getUpcomingWbsRequirements, getTeamCapacityMatrix } from './skill-gap-data'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export interface SkillGapAnalysisResult {
  hasGaps: boolean
  gaps: Array<{
    wbsElementId: string
    wbsElementName: string
    missingSkills: string[]
    description: string
    recommendedAction: string
  }>
  warnings: Array<{
    message: string
  }>
}

/**
 * AI-driven Skill Gap Analysis engine.
 * Takes the upcoming WBS items and their required skills,
 * compares them against the actual team matrix,
 * and returns detected gaps or capacity warnings.
 */
export async function analyzeSkillGaps(projectId: string, orgId: string): Promise<{ ok: boolean; data?: SkillGapAnalysisResult; error?: string }> {
  try {
    const upcomingWbs = await getUpcomingWbsRequirements(projectId)
    if (upcomingWbs.length === 0) {
      return { ok: true, data: { hasGaps: false, gaps: [], warnings: [{ message: 'No upcoming WBS elements have required_skills defined.' }] } }
    }

    const teamMatrix = await getTeamCapacityMatrix(projectId, orgId)
    
    const systemPrompt = `You are a Project Management AI specializing in Skill Gap Analysis and Resource Planning.
Your task is to compare the Required Skills for upcoming project phases against the actual Team Capacity Matrix provided.

Output a JSON object exactly matching this schema:
{
  "hasGaps": boolean,
  "gaps": [
    {
      "wbsElementId": "string",
      "wbsElementName": "string",
      "missingSkills": ["string"],
      "description": "string (Explain the exact deficit, e.g., 'Marcus is the only data scientist and is fully booked.')",
      "recommendedAction": "string (e.g., 'Hire a contractor' or 'Re-assign tasks')"
    }
  ],
  "warnings": [
    {
      "message": "string (Any general capacity warnings)"
    }
  ]
}`

    const wbsContext = upcomingWbs.map(w => `
      - WBS ID: ${w.id}
      - Name: ${w.name}
      - Required Skills: ${w.required_skills.join(', ')}
    `).join('\n')

    const teamContext = teamMatrix.map(t => `
      - Member: ${t.name} (${t.role})
      - Skills: ${t.skills.join(', ')}
      - Bandwidth: ${t.allocated_percentage}% allocated (${t.capacity_hours_per_week} hrs/wk total)
    `).join('\n')

    const userPrompt = `
      UPCOMING WBS ELEMENTS:
      ${wbsContext}

      TEAM CAPACITY MATRIX:
      ${teamContext || 'No team members mapped to this project yet.'}

      Analyze the requirements against the team. Identify any required skills that NO team member has.
      Also identify if a required skill is present, but the person who has it is 100% booked (0% available bandwidth).
      Return the results strictly adhering to the JSON schema.
    `

    const aiResult = await generateStructuredJson({ systemPrompt, userPrompt })
    
    if (!aiResult) {
      return { ok: false, error: 'Failed to generate AI response.' }
    }

    return { ok: true, data: aiResult as SkillGapAnalysisResult }

  } catch (error: any) {
    console.error('Skill Gap Analysis Error:', error)
    return { ok: false, error: error.message || 'An error occurred during Skill Gap Analysis.' }
  }
}
