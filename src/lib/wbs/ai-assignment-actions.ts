'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'
import { getProjectRaciStakeholders } from '@/lib/wbs/actions'

export type AiAssignmentSuggestion = {
  suggestedStakeholderId: string
  rationale: string
}

export async function suggestAssigneeWithAiAction(
  organizationId: string,
  projectId: string,
  wbsElementId: string
): Promise<{ ok: boolean; data?: AiAssignmentSuggestion; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'

    if (!isEnterprise && !isPremium) {
      return { ok: false, error: 'Praz-AI Auto-Assignment is only available on Premium and Enterprise plans.' }
    }

    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch WBS Element Details
    const { data: element, error: elError } = await supabase
      .from('wbs_elements')
      .select('name, description, deliverables_data')
      .eq('id', wbsElementId)
      .single()

    if (elError || !element) {
      console.error('Fetch WBS error:', elError)
      return { ok: false, error: 'Failed to fetch WBS element details.' }
    }

    // 3. Fetch Available Stakeholders
    const stakeholders = await getProjectRaciStakeholders(projectId)
    if (!stakeholders || stakeholders.length === 0) {
      return { ok: false, error: 'No available stakeholders found in this project to assign.' }
    }

    // 3b. Fetch Skills for these stakeholders
    const userIds = stakeholders.map(s => s.linked_user_id).filter(Boolean) as string[]
    let skillsData: any[] = []
    if (userIds.length > 0) {
      const { data: skills } = await supabase
        .from('member_skill_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .in('user_id', userIds)
      
      if (skills) skillsData = skills
    }

    // 4. Formulate Prompt
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const systemPrompt = `You are an expert Project Management Praz-AI.
Your task is to review the following Work Breakdown Structure (WBS) task and suggest the most appropriate team member from the available stakeholders to be the "Responsible" assignee.

Output a JSON object exactly matching this schema:
{
  "suggestedStakeholderId": "string (The exact ID of the stakeholder)",
  "rationale": "string (A short 1-2 sentence rationale for the selection)"
}`

    const userPrompt = `
      TASK DETAILS:
      Name: ${element.name}
      Description: ${element.description || 'No description provided.'}
      Checklist Items: ${(element.deliverables_data as any[] || []).map(i => i.text).join(', ') || 'None'}
      
      AVAILABLE STAKEHOLDERS (Include their skills):
      ${stakeholders.map(s => {
        const userSkills = skillsData.filter(sk => sk.user_id === s.linked_user_id)
        const skillsString = userSkills.length > 0 ? userSkills.map(sk => `${sk.skill_name} (${sk.proficiency_level})`).join(', ') : 'No specific skills listed'
        return `- ID: ${s.id} | Name: ${s.name} | Type: ${s.organization_type} | Details: ${s.profiles?.full_name || ''} ${s.profiles?.email || ''} | Skills: ${skillsString}`
      }).join('\n')}
      
      Based on the task name, description, and checklist, select exactly one stakeholder ID from the list above that would be best suited for the task. You MUST heavily weigh the stakeholder's listed Skills in your decision.
      Provide a brief rationale (1-2 sentences) explaining why they are a good fit based on their skills, name, role, or context.
      If you are unsure, pick the first internal stakeholder and provide a generic rationale.
    `

    const result = await generateStructuredJson<{ suggestedStakeholderId: string, rationale: string }>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.suggestedStakeholderId) {
      return { ok: false, error: 'Praz-AI failed to suggest a valid stakeholder.' }
    }

    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unknown error occurred during Praz-AI assignment.' }
  }
}
