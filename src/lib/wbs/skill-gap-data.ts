import { createClient } from '@/utils/supabase/server'
import { getProjectRaciStakeholders } from '@/lib/wbs/raci-actions'

export interface WbsSkillRequirement {
  id: string
  name: string
  status: string
  required_skills: string[]
}

export interface TeamMemberSkillProfile {
  id: string
  name: string
  role: string
  skills: string[]
  capacity_hours_per_week: number
  allocated_percentage: number
}

export async function getUpcomingWbsRequirements(projectId: string): Promise<WbsSkillRequirement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wbs_elements')
    .select('id, name, status, required_skills')
    .eq('project_id', projectId)
    .in('status', ['Not Started', 'In Progress'])
    // @ts-ignore
    .neq('required_skills', '{}')

  if (error || !data) {
    return []
  }

  // Filter out those that actually have skills in the array
  // Sometimes '{}' text representation or empty arrays vary
  return data
    .filter((el: any) => Array.isArray(el.required_skills) && el.required_skills.length > 0)
    .map((el: any) => ({
      id: el.id,
      name: el.name,
      status: el.status,
      required_skills: el.required_skills,
    }))
}

export async function getTeamCapacityMatrix(projectId: string, orgId: string): Promise<TeamMemberSkillProfile[]> {
  const supabase = await createClient()
  
  // Get stakeholders (members mapped to this project)
  const stakeholders = await getProjectRaciStakeholders(projectId)
  if (!stakeholders || stakeholders.length === 0) return []

  const userIds = stakeholders.map((s: any) => s.linked_user_id).filter(Boolean) as string[]
  if (userIds.length === 0) return []

  // Fetch their skills and capacity
  const [{ data: skills }, { data: capacities }] = await Promise.all([
    supabase
      .from('member_skill_profiles')
      .select('*')
      .eq('organization_id', orgId)
      .in('user_id', userIds),
    supabase
      .from('member_capacity_allocations')
      .select('*')
      .eq('project_id', projectId)
      .in('user_id', userIds)
  ])

  return stakeholders
    .filter((s: any) => s.linked_user_id)
    .map((s: any) => {
      const uid = s.linked_user_id
      const userSkills = (skills || [])
        .filter((sk: any) => sk.user_id === uid)
        .map((sk: any) => sk.skill_name)
      
      const userCap = (capacities || []).find((c: any) => c.user_id === uid)

      return {
        id: s.id,
        name: s.profiles?.full_name || s.name || 'Unknown',
        role: s.role_title || s.sub_category || 'N/A',
        skills: userSkills,
        capacity_hours_per_week: userCap?.available_hours_per_week ?? 40,
        allocated_percentage: userCap?.allocated_percentage ?? 100
      }
    })
}
