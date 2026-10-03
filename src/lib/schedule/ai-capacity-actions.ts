'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function analyzeSprintCapacityRisk(projectId: string, organizationId: string, sprintId: string, selectedWbsIds: string[]): Promise<{
  ok: boolean;
  data?: {
    hasRisk: boolean;
    warningMessage: string;
    totalPoints: number;
    teamCapacity: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient()

    // 1. Fetch the project and organization details
    const { data: project } = await supabase.from('projects').select('organization_id').eq('id', projectId).single()
    
    // Check if the project is Enterprise-only for AI capacity check
    let isEnterprise = false
    if (project?.organization_id) {
      const { data: sub } = await supabase.from('organization_subscriptions').select('tier_id').eq('organization_id', project.organization_id).maybeSingle()
      if (sub?.tier_id === 'enterprise') {
        isEnterprise = true
      }
    }

    if (!isEnterprise) {
      return { ok: false, error: 'AI Sprint Capacity Risk analysis is a Premium/Enterprise feature.' }
    }

    // 2. Fetch the WBS elements story points
    if (!selectedWbsIds || selectedWbsIds.length === 0) {
      return { ok: true, data: { hasRisk: false, warningMessage: '', totalPoints: 0, teamCapacity: 0 } }
    }

    const { data: wbsElements, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('story_points, name')
      .in('id', selectedWbsIds)

    if (wbsError) return { ok: false, error: wbsError.message }

    const totalPoints = wbsElements.reduce((acc, el) => acc + (Number(el.story_points) || 0), 0)

    // 3. Fetch Team Capacity Allocation
    const { data: teamCapacity, error: capacityError } = await supabase
      .from('member_capacity_allocations')
      .select('sprint_velocity_points')
      .eq('project_id', projectId)

    if (capacityError) return { ok: false, error: capacityError.message }

    const totalCapacity = teamCapacity?.reduce((acc, el) => acc + (Number(el.sprint_velocity_points) || 0), 0) || 0

    if (totalPoints === 0 && totalCapacity === 0) {
      return { ok: true, data: { hasRisk: false, warningMessage: '', totalPoints: 0, teamCapacity: 0 } }
    }

    // 4. Use AI to analyze
    const result = await generateStructuredJson<{
      has_risk: boolean;
      warning_message: string;
    }>({
      systemPrompt: `You are an expert Agile Scrum Master and Resource Manager.
Analyze the sprint scope against the team's capacity and determine if there is a capacity risk.
The team's total capacity for the sprint is given in story points. The proposed sprint backlog requires a total amount of story points.
Return a JSON object containing a boolean "has_risk" indicating if the team is overallocated, and a "warning_message" providing a short, actionable warning if there is a risk, or a brief affirmation if there is no risk.`,
      userPrompt: `Team's total sprint capacity: ${totalCapacity} points.\nProposed Sprint Backlog requires: ${totalPoints} points.\nNumber of items: ${wbsElements.length}`
    })

    return { 
      ok: true, 
      data: {
        hasRisk: result.has_risk,
        warningMessage: result.warning_message,
        totalPoints,
        teamCapacity: totalCapacity
      } 
    }

  } catch (err: any) {
    console.error('analyzeSprintCapacityRisk failed:', err)
    return { ok: false, error: err?.message || 'Failed to analyze sprint capacity risk' }
  }
}
