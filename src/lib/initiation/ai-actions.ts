'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { logGovernanceEvent } from '@/lib/governance/actions'

export type FeasibilityAiSuggestion = {
  technical_assessment: string
  financial_assessment: string
  operational_assessment: string
  overall_recommendation: string
}

export async function autoGenerateFeasibilityStudy(
  businessCaseId: string, 
  organizationId: string
): Promise<{ success: boolean; data?: FeasibilityAiSuggestion; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch the Business Case
    const { data: bc, error: fetchError } = await supabase
      .from('business_cases')
      .select('*')
      .eq('id', businessCaseId)
      .single()

    if (fetchError || !bc) {
      return { success: false, error: fetchError?.message || 'Business Case not found' }
    }

    // 2. Generate content using Praz-AI Router
    console.log(`🤖 [Feasibility AI] Generating feasibility study for business case: ${bc.name}`)

    const systemPrompt = `You are an expert Project Manager and Business Analyst. 
Your task is to analyze a given Business Case and draft the sections of a Feasibility Study as AI suggestions.

Output strictly a JSON object with the following schema:
{
  "technical_assessment": "string (Detailed assessment of whether this can be built, tech stack, and risks. Keep it professional and concise.)",
  "financial_assessment": "string (Assessment of affordability, required funding, and potential cash flow impacts.)",
  "operational_assessment": "string (Assessment of practical implementation, resource needs, and change management.)",
  "overall_recommendation": "string (Final verdict and recommendation on whether the project is feasible.)"
}`

    const userPrompt = `Business Case Name: ${bc.name}
Problem Statement: ${bc.problem_statement || 'N/A'}
Proposed Solution: ${bc.proposed_solution || 'N/A'}
Estimated Cost: ${bc.estimated_cost ? '$' + bc.estimated_cost : 'N/A'}
Estimated Benefit: ${bc.estimated_benefit || 'N/A'}
Recommendation: ${bc.recommendation || 'N/A'}`

    const result = await generateStructuredJson<FeasibilityAiSuggestion>({
      systemPrompt,
      userPrompt
    })

    if (!result.technical_assessment || !result.financial_assessment) {
      throw new Error('Praz-AI failed to generate a complete feasibility study.')
    }

    // 3. Log Governance Event
    await logGovernanceEvent(organizationId, 'ai_generation', {
      action: 'feasibility_study_generation',
      business_case_id: businessCaseId
    }).catch(err => {
      console.error('Failed to log governance event:', err)
    })

    return { success: true, data: result }

  } catch (err: any) {
    console.error("autoGenerateFeasibilityStudy failed:", err)
    return { success: false, error: err.message }
  }
}
