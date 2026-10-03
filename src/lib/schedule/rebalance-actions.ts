'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import type { RebalanceSuggestionResult, ReassignmentOption } from './rebalance-types'
import { revalidatePath } from 'next/cache'

export async function generateRebalanceSuggestions(
  projectId: string, 
  organizationId: string, 
  iterationId: string
): Promise<{
  ok: boolean
  data?: RebalanceSuggestionResult
  error?: string
}> {
  try {
    const supabase = await createClient()

    // 2. Fetch WBS Elements in this iteration with their RACI assignments
    const { data: wbsElements, error: wbsError } = await supabase
      .from('wbs_elements')
      .select(`
        id, 
        name, 
        story_points,
        raci_assignments (
          id,
          role_type,
          stakeholder_id,
          stakeholder:stakeholders (
            id,
            name,
            linked_user_id
          )
        )
      `)
      .eq('project_id', projectId)
      .eq('iteration_id', iterationId)

    if (wbsError) return { ok: false, error: wbsError.message }

    // Aggregate current workload per user
    // We only care about 'Responsible' RACI role for doing the work.
    const workloadMap = new Map<string, { totalPoints: number, tasks: any[] }>()
    const userToStakeholderMap = new Map<string, { stakeholderId: string, name: string }>()

    const assignedTasks = wbsElements?.filter(wbs => {
      const resp = wbs.raci_assignments?.find((r: any) => r.role_type === 'Responsible')
      return !!(resp?.stakeholder as any)?.linked_user_id
    }) || []

    assignedTasks.forEach((wbs) => {
      const resp = wbs.raci_assignments.find((r: any) => r.role_type === 'Responsible')
      if (!resp) return
      const stakeholder = resp.stakeholder as any
      const userId = stakeholder?.linked_user_id
      if (userId) {
        if (!workloadMap.has(userId)) {
          workloadMap.set(userId, { totalPoints: 0, tasks: [] })
          userToStakeholderMap.set(userId, { 
            stakeholderId: resp.stakeholder_id, 
            name: stakeholder?.name || 'Unknown'
          })
        }
        const points = Number(wbs.story_points) || 0
        const current = workloadMap.get(userId)!
        current.totalPoints += points
        current.tasks.push({
          id: wbs.id,
          name: wbs.name,
          points: points,
          currentStakeholderId: resp.stakeholder_id,
          currentStakeholderName: stakeholder?.name || 'Unknown'
        })
      }
    })

    // 3. Fetch Team Capacities
    const { data: teamCapacity, error: capacityError } = await supabase
      .from('member_capacity_allocations')
      .select('user_id, sprint_velocity_points, member_name')
      .eq('project_id', projectId)

    if (capacityError) return { ok: false, error: capacityError.message }

    const capacityMap = new Map<string, number>()
    teamCapacity?.forEach(c => {
      if (c.user_id) capacityMap.set(c.user_id, Number(c.sprint_velocity_points) || 0)
    })

    // 4. Identify Overloaded Members
    const overloadedMembers: any[] = []
    workloadMap.forEach((workload, userId) => {
      const capacity = capacityMap.get(userId) || 0
      if (capacity > 0 && workload.totalPoints > capacity) {
        overloadedMembers.push({
          userId,
          name: userToStakeholderMap.get(userId)?.name || 'Unknown',
          capacity,
          currentWorkload: workload.totalPoints,
          tasks: workload.tasks
        })
      }
    })

    if (overloadedMembers.length === 0) {
      return { 
        ok: true, 
        data: { hasOverloadedMembers: false, message: 'All team members are within capacity.', suggestions: [] } 
      }
    }

    // 5. Fetch Skills Matrix for the whole organization
    const { data: skills, error: skillsError } = await supabase
      .from('member_skill_profiles')
      .select('user_id, skill_name, skill_category, proficiency_level')
      .eq('organization_id', organizationId)
    
    if (skillsError) return { ok: false, error: skillsError.message }

    // Map skills by user
    const skillsMap = new Map<string, string[]>()
    skills?.forEach(s => {
      if (s.user_id) {
        if (!skillsMap.has(s.user_id)) skillsMap.set(s.user_id, [])
        skillsMap.get(s.user_id)!.push(`${s.skill_name} (${s.proficiency_level})`)
      }
    })

    // Also get stakeholders mapping for all members so AI can assign to valid stakeholder IDs
    const { data: projectStakeholders } = await supabase
      .from('stakeholders')
      .select('id, name, linked_user_id')
      .eq('project_id', projectId)
      .not('linked_user_id', 'is', null)

    const availableTeamMembers = teamCapacity?.map(member => {
      const userId = member.user_id!
      const currentWorkload = workloadMap.get(userId)?.totalPoints || 0
      const maxCapacity = member.sprint_velocity_points || 0
      const spareBandwidth = maxCapacity - currentWorkload
      const stakeholder = projectStakeholders?.find(s => s.linked_user_id === userId)
      return {
        userId,
        stakeholderId: stakeholder?.id,
        name: member.member_name || stakeholder?.name || 'Unknown',
        spareBandwidth,
        skills: skillsMap.get(userId) || []
      }
    }).filter(member => member.spareBandwidth > 0 && member.stakeholderId) // Only those with spare capacity & stakeholder records

    // 6. Use AI to generate Rebalance Suggestions
    const aiPrompt = `
You are an expert Agile Scrum Master and Resource Manager.
We have identified overloaded team members whose assigned Story Points exceed their sprint capacity.
We also have a list of other team members with spare bandwidth and specific skills.

OVERLOADED MEMBERS:
${JSON.stringify(overloadedMembers, null, 2)}

AVAILABLE TEAM MEMBERS (With Spare Bandwidth & Skills):
${JSON.stringify(availableTeamMembers, null, 2)}

Your task is to:
1. Review the tasks assigned to overloaded members.
2. Infer the likely required skill for each task based on its name.
3. Find an AVAILABLE team member who has matching or highly relevant skills AND enough spare bandwidth to take on the task.
4. Suggest reassignments to alleviate the overload.

Return a JSON object matching this interface:
{
  "message": "string (A brief summary of what you are suggesting)",
  "suggestions": [
    {
      "wbsElementId": "string (ID of the task)",
      "wbsElementName": "string",
      "currentStakeholderId": "string",
      "currentStakeholderName": "string",
      "suggestedStakeholderId": "string (The ID from AVAILABLE TEAM MEMBERS)",
      "suggestedStakeholderName": "string",
      "requiredSkill": "string (What skill did you infer this task requires?)",
      "storyPoints": number,
      "justification": "string (Why this person? e.g. 'Elena has React skills and 10 pts bandwidth')"
    }
  ]
}
Note: Do not exceed a member's spare bandwidth. You don't have to resolve all overloads if no one has the skills/bandwidth.
`

    const result = await generateStructuredJson<{
      message: string;
      suggestions: ReassignmentOption[];
    }>({
      systemPrompt: 'You are an AI Resource Manager. Respond strictly in JSON format as requested.',
      userPrompt: aiPrompt
    })

    return { 
      ok: true, 
      data: {
        hasOverloadedMembers: true,
        message: result.message,
        suggestions: result.suggestions
      } 
    }

  } catch (err: any) {
    console.error('generateRebalanceSuggestions failed:', err)
    return { ok: false, error: err?.message || 'Failed to generate rebalance suggestions' }
  }
}

export async function applyRebalanceSuggestion(wbsElementId: string, newStakeholderId: string, projectId: string): Promise<{ok: boolean, error?: string}> {
  try {
    const supabase = await createClient()
    
    // Find existing 'Responsible' assignment for this WBS element
    const { data: assignments, error: fetchErr } = await supabase
      .from('raci_assignments')
      .select('id, role_type')
      .eq('wbs_element_id', wbsElementId)
      .eq('role_type', 'Responsible')

    if (fetchErr) return { ok: false, error: fetchErr.message }

    if (assignments && assignments.length > 0) {
      // Update existing
      const { error: updateErr } = await supabase
        .from('raci_assignments')
        .update({ stakeholder_id: newStakeholderId })
        .eq('id', assignments[0].id)
      
      if (updateErr) return { ok: false, error: updateErr.message }
    } else {
      // Insert new
      const { error: insertErr } = await supabase
        .from('raci_assignments')
        .insert({
          wbs_element_id: wbsElementId,
          stakeholder_id: newStakeholderId,
          role_type: 'Responsible',
          project_id: projectId
        })
      
      if (insertErr) return { ok: false, error: insertErr.message }
    }

    revalidatePath(`/dashboard/projects/${projectId}?tab=releases`)
    return { ok: true }
  } catch (err: any) {
    console.error('applyRebalanceSuggestion failed:', err)
    return { ok: false, error: err?.message || 'Failed to apply rebalance' }
  }
}
