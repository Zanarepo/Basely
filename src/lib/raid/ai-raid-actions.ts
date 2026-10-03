'use server'

import { getWbsElements } from '@/lib/wbs/core-actions'
import { getRaidEntries } from '@/lib/raid/actions'
import { checkProjectFeatureAccess } from '@/lib/organizations/tier-logic'
import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export type PredictedRaidEntry = {
  category: 'risk' | 'assumption' | 'issue' | 'dependency'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact_rating: number
  probability_rating: number
  mitigation_plan?: string
  linked_wbs_element_id?: string
}

export async function predictRaidRisks(projectId: string, organizationId: string): Promise<{ ok: boolean; data?: PredictedRaidEntry[]; error?: string }> {
  // Check AI access
  const access = await checkProjectFeatureAccess(projectId, 'ai.praz_copilot')
  if (!access.allowed) {
    return { ok: false, error: `Predictive Praz-AI requires ${access.requiredTier} tier.` }
  }

  // 1. Fetch WBS Elements (For schedule/dependency analysis)
  const wbsRes = await getWbsElements(projectId)
  const wbsElements = 'data' in wbsRes && wbsRes.data ? wbsRes.data : []

  // 2. Fetch current RAID entries to avoid duplicating existing risks
  const raidRes = await getRaidEntries(projectId, 'all')
  const currentRaid = 'data' in raidRes && raidRes.data ? raidRes.data : []

  // 3. Fetch Cost Accounts for budget overrun analysis
  const supabase = await createClient()
  const { data: costData } = await supabase
    .from('cost_accounts')
    .select('wbs_element_id, budgeted_total, actual_cost, name')
    .eq('project_id', projectId)
    
  const costAccounts = costData || []

  const systemPrompt = `You are an expert Project Management Praz-AI Copilot.
Your job is to analyze the project's pulse and proactively predict schedule slippage, budget overruns, and dependency bottlenecks.

Analyze the provided WBS elements (schedule), Cost Accounts (budget), and existing RAID log.
Identify at least 3 to 5 predicted risks, issues, or dependencies.
Do not duplicate items that already exist in the RAID log.
Focus on:
1. Schedule Slippage: Flag tasks that might miss deadlines.
2. Budget Overruns: Flag tasks where actual_cost is approaching or exceeding budgeted_total.
3. Dependencies: Identify tasks waiting on others or resource constraints.

Output a JSON object exactly matching this schema:
{
  "predictions": [
    {
      "category": "risk" | "assumption" | "issue" | "dependency",
      "title": "Clear, concise title",
      "description": "Detailed description of the bottleneck, risk, or dependency",
      "priority": "low" | "medium" | "high" | "critical",
      "impact_rating": number (1-5),
      "probability_rating": number (1-5),
      "mitigation_plan": "Suggested mitigation or resolution plan",
      "linked_wbs_element_id": "Optional string matching an existing WBS ID"
    }
  ]
}
`

  const promptData = {
    wbsElements: wbsElements.map((w: any) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      start_date: w.start_date,
      end_date: w.end_date,
      progress: w.progress_percentage
    })),
    costAccounts,
    existingRaidTitles: currentRaid.map(r => r.title)
  }

  try {
    const result = await generateStructuredJson<{ predictions: PredictedRaidEntry[] }>({
      systemPrompt,
      userPrompt: `Project Context: ${JSON.stringify(promptData, null, 2)}`
    })

    if (!result || !result.predictions) {
      return { ok: false, error: 'Praz-AI failed to generate valid predictions.' }
    }

    return { ok: true, data: result.predictions }
  } catch (error: any) {
    console.error('Praz-AI Prediction Error:', error)
    return { ok: false, error: 'Failed to generate predictions' }
  }
}
