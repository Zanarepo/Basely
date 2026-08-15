'use server'

import { createClient } from '@/utils/supabase/server'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { getOrganizationSubscription } from '@/lib/organizations/tier-core'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'

export async function generateAdrWithAiAction(
  projectId: string,
  organizationId: string,
  title: string,
  domain: string,
  briefContext?: string
): Promise<{
  ok: boolean
  data?: { context: string; decision: string; consequences: string }
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Unauthorized' }
    }

    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'

    if (!isEnterprise && !isPremium) {
      return { ok: false, error: 'Praz-AI Auto-Drafting is only available on Premium and Enterprise plans.' }
    }

    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')

    const systemPrompt = `You are an expert Principal Software Engineer and System Architect. 
Your task is to draft a professional Architecture Decision Record (ADR) based on the provided title and technical domain.

Output a JSON object exactly matching this schema:
{
  "context": "string (A detailed, 2-3 paragraph explanation of the problem, current state, and why a decision is needed.)",
  "decision": "string (A clear, declarative statement of the architecture decision and the technical rationale behind it.)",
  "consequences": "string (A bulleted list of positive and negative consequences, trade-offs, and downstream impacts.)"
}

Maintain a highly professional, technical, and objective tone.`

    const userPrompt = `Draft an ADR for the following:
Title: ${title}
Technical Domain: ${domain}
Additional Context provided by user (if any): ${briefContext || 'None'}`

    const result = await generateStructuredJson<{
      context: string
      decision: string
      consequences: string
    }>({
      systemPrompt,
      userPrompt
    })

    // Log the Praz-AI generation event
    await logGovernanceEvent(organizationId, 'ai_generation', {
      user_id: user.id,
      project_id: projectId,
      target_type: 'adr',
      title_used: title,
      domain_used: domain
    }).catch((e: any) => console.error('Failed to log Praz-AI ADR generation governance event:', e))

    return { ok: true, data: result }
  } catch (err: any) {
    console.error('generateAdrWithAiAction error:', err)
    return { ok: false, error: err.message || 'Failed to generate ADR with Praz-AI' }
  }
}
