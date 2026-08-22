'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'
import { getProjectRaciStakeholders } from '@/lib/wbs/raci-actions'

export type AiAssignmentSuggestion = {
  suggestedResponsibleId: string
  suggestedAccountableId?: string
  suggestedConsultedIds?: string[]
  suggestedInformedIds?: string[]
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
    const userIds = stakeholders.map((s: any) => s.linked_user_id).filter(Boolean) as string[]
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
Your task is to review the following Work Breakdown Structure (WBS) task and suggest the most appropriate team members from the available stakeholders to form a complete RACI matrix assignment.

Output a JSON object exactly matching this schema:
{
  "suggestedResponsibleId": "string (The exact ID of the stakeholder doing the work)",
  "suggestedAccountableId": "string (The exact ID of the stakeholder accountable, often a lead or manager)",
  "suggestedConsultedIds": ["string", "string"] (Array of IDs for SMEs or clients whose input is needed),
  "suggestedInformedIds": ["string", "string"] (Array of IDs for people who need to be kept in the loop),
  "rationale": "string (A short 1-2 sentence rationale for the selection)"
}`

    const userPrompt = `
      TASK DETAILS:
      Name: ${element.name}
      Description: ${element.description || 'No description provided.'}
      Checklist Items: ${(element.deliverables_data as any[] || []).map(i => i.text).join(', ') || 'None'}
      
      AVAILABLE STAKEHOLDERS (Include their skills):
      ${stakeholders.map((s: any) => {
        const userSkills = skillsData.filter(sk => sk.user_id === s.linked_user_id)
        const skillsString = userSkills.length > 0 ? userSkills.map(sk => `${sk.skill_name} (${sk.proficiency_level})`).join(', ') : 'No specific skills listed'
        return `- ID: ${s.id} | Name: ${s.name} | Type: ${s.organization_type} | Role: ${s.role_title || s.sub_category || 'N/A'} | Influence/Interest: ${s.influence || 3}/${s.interest || 3} | Details: ${s.profiles?.full_name || ''} ${s.profiles?.email || ''} | Skills: ${skillsString}`
      }).join('\n')}
      
      Based on the task name, description, and checklist, select stakeholder IDs from the list above for Responsible, Accountable, Consulted, and Informed roles. 
      - heavily weigh the stakeholder's listed Skills in your decision for 'Responsible'.
      - external clients with high interest/influence are good for 'Consulted' or 'Informed'.
      Provide a brief rationale (1-2 sentences) explaining the choices.
      If you are unsure for Responsible, pick the first internal stakeholder. You do not have to fill Consulted and Informed if it doesn't make sense.
    `

    const result = await generateStructuredJson<AiAssignmentSuggestion>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.suggestedResponsibleId) {
      return { ok: false, error: 'Praz-AI failed to suggest a valid stakeholder.' }
    }

    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unknown error occurred during Praz-AI assignment.' }
  }
}

export type BulkAiAssignmentSuggestion = {
  wbsElementId: string
  suggestedResponsibleId: string
  suggestedAccountableId?: string
  suggestedConsultedIds?: string[]
  suggestedInformedIds?: string[]
}

export async function bulkSuggestRaciAssignments(
  organizationId: string,
  projectId: string,
  wbsElementIds: string[]
): Promise<{ ok: boolean; data?: BulkAiAssignmentSuggestion[]; error?: string }> {
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

    if (!wbsElementIds || wbsElementIds.length === 0) {
      return { ok: false, error: 'No WBS elements provided for assignment.' }
    }

    // 2. Fetch WBS Elements Details
    const { data: elements, error: elError } = await supabase
      .from('wbs_elements')
      .select('id, name, description, deliverables_data')
      .in('id', wbsElementIds)

    if (elError || !elements || elements.length === 0) {
      console.error('Fetch WBS error:', elError)
      return { ok: false, error: 'Failed to fetch WBS elements details.' }
    }

    // 3. Fetch Available Stakeholders
    const stakeholders = await getProjectRaciStakeholders(projectId)
    if (!stakeholders || stakeholders.length === 0) {
      return { ok: false, error: 'No available stakeholders found in this project to assign.' }
    }

    // 3b. Fetch Skills for these stakeholders
    const userIds = stakeholders.map((s: any) => s.linked_user_id).filter(Boolean) as string[]
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
Your task is to review the following Work Breakdown Structure (WBS) tasks and suggest the most appropriate team members from the available stakeholders to form a complete RACI matrix assignment for EACH task.

Output a JSON object exactly matching this schema:
{
  "assignments": [
    {
      "wbsElementId": "string (The exact ID of the WBS element)",
      "suggestedResponsibleId": "string (The exact ID of the stakeholder doing the work)",
      "suggestedAccountableId": "string (The exact ID of the stakeholder accountable)",
      "suggestedConsultedIds": ["string", "string"] (Array of IDs for SMEs or clients),
      "suggestedInformedIds": ["string", "string"] (Array of IDs for people to keep in loop)
    }
  ]
}`

    const elementsContext = elements.map(el => `
      TASK ID: ${el.id}
      Name: ${el.name}
      Description: ${el.description || 'No description provided.'}
      Checklist Items: ${(el.deliverables_data as any[] || []).map(i => i.text).join(', ') || 'None'}
    `).join('\n---\n')

    const userPrompt = `
      TASKS TO ASSIGN:
      ${elementsContext}
      
      AVAILABLE STAKEHOLDERS (Include their skills):
      ${stakeholders.map((s: any) => {
        const userSkills = skillsData.filter(sk => sk.user_id === s.linked_user_id)
        const skillsString = userSkills.length > 0 ? userSkills.map(sk => `${sk.skill_name} (${sk.proficiency_level})`).join(', ') : 'No specific skills listed'
        return `- ID: ${s.id} | Name: ${s.name} | Type: ${s.organization_type} | Role: ${s.role_title || s.sub_category || 'N/A'} | Influence/Interest: ${s.influence || 3}/${s.interest || 3} | Details: ${s.profiles?.full_name || ''} ${s.profiles?.email || ''} | Skills: ${skillsString}`
      }).join('\n')}
      
      Based on each task's name, description, and checklist, select stakeholder IDs for 'Responsible', 'Accountable', 'Consulted', and 'Informed' roles from the list above. 
      You MUST heavily weigh the stakeholder's listed Skills in your decision for 'Responsible'.
      'Responsible' is the person doing the work. 'Accountable' is the person ensuring it gets done (often a manager or lead).
      'Consulted' (optional array) are subject matter experts or clients whose input is needed. 'Informed' (optional array) are people who just need to be kept up to date.
      Return the JSON array covering ALL provided tasks.
    `

    const result = await generateStructuredJson<{ assignments: BulkAiAssignmentSuggestion[] }>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.assignments || result.assignments.length === 0) {
      return { ok: false, error: 'Praz-AI failed to generate bulk assignments.' }
    }

    return { ok: true, data: result.assignments }
  } catch (err: any) {
    console.error('[bulkSuggestRaciAssignments Error]:', err)
    return { ok: false, error: err.message || 'Unknown error occurred during bulk Praz-AI assignment.' }
  }
}
