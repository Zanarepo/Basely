'use server'

import { createClient } from '@/utils/supabase/server'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'

export type ExtractedMeetingData = {
  discussionNotes: string
  decisions: { text: string }[]
  attendees: string[]
  actionItems: {
    description: string
    owner_stakeholder_id?: string
  }[]
}

export async function extractMeetingNotesWithAiAction(
  projectId: string,
  rawNotes: string
): Promise<{
  ok: boolean
  data?: ExtractedMeetingData
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Unauthorized' }
    }

    // 0. Fetch Organization ID from Project
    const { data: projectData } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()
      
    if (!projectData) {
      return { ok: false, error: 'Project not found' }
    }
    const organizationId = projectData.organization_id

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'

    if (!isEnterprise && !isPremium) {
      return { ok: false, error: 'Meeting Praz-AI is only available on Premium and Enterprise plans.' }
    }

    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch Available Stakeholders (to map attendees and action item owners)
    const { data: stakeholders } = await supabase
      .from('stakeholders')
      .select('id, name, role_title')
      .eq('project_id', projectId)

    // 3. Formulate Prompt
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const systemPrompt = `You are an expert Project Management Praz-AI.
Your task is to review the following raw, messy meeting notes or transcript, and extract structured data from it.

Output a JSON object exactly matching this schema:
{
  "discussionNotes": "string (A clean, professional, markdown-formatted summary of the meeting discussions)",
  "decisions": [
    { "text": "string (A clear decision that was made)" }
  ],
  "attendees": [
    "string (The exact stakeholder ID from the list below if the person's name appears to be in the meeting)"
  ],
  "actionItems": [
    {
      "description": "string (Short, clear description of the actionable task)",
      "owner_stakeholder_id": "string (The exact stakeholder ID from the list below, or null if unassigned)"
    }
  ]
}

Only return IDs that exist in the provided Stakeholder List.
`

    const userPrompt = `
      AVAILABLE STAKEHOLDERS:
      ${(stakeholders || []).map(s => `- ID: ${s.id} | Name: ${s.name} | Role: ${s.role_title}`).join('\n')}
      
      RAW MEETING NOTES / TRANSCRIPT:
      ${rawNotes}
    `

    const result = await generateStructuredJson<ExtractedMeetingData>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.discussionNotes) {
      return { ok: false, error: 'Praz-AI failed to extract valid meeting data.' }
    }

    // 4. Log governance event
    await logGovernanceEvent(organizationId, 'ai_generation', {
      user_id: user.id,
      project_id: projectId,
      target_type: 'meeting_minutes',
      action: 'ai_extraction'
    }).catch((e: any) => console.error('Failed to log governance event:', e))

    return { ok: true, data: result }
  } catch (err: any) {
    console.error('extractMeetingNotesWithAiAction error:', err)
    return { ok: false, error: err.message || 'Failed to extract meeting notes with Praz-AI' }
  }
}
