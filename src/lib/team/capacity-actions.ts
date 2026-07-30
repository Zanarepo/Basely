'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'data_science' | 'design' | 'management'
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface MemberSkillProfile {
  id: string
  organization_id: string
  user_id: string
  skill_name: string
  skill_category: SkillCategory
  proficiency_level: ProficiencyLevel
  years_experience: number
  is_primary_specialization: boolean
  updated_at: string
}

export interface MemberCapacityAllocation {
  id: string
  organization_id: string
  project_id: string
  user_id: string
  member_name?: string
  member_role?: string
  avatar_initials?: string
  iteration_id?: string
  wbs_phase_id?: string
  available_hours_per_week: number
  allocated_percentage: number
  sprint_velocity_points: number
  effective_start_date: string
  effective_end_date: string
  updated_at: string
}

const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export async function getTeamSkillsMatrix(organizationId: string) {
  const supabase = await createClient()

  const { data: skills, error: skillsError } = await supabase
    .from('member_skill_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('skill_name', { ascending: true })

  if (skillsError) {
    console.error('Error fetching skills matrix:', skillsError)
    return { ok: false, error: skillsError.message, data: [] }
  }

  return { ok: true, data: (skills || []) as MemberSkillProfile[] }
}

export async function saveMemberSkill(data: Partial<MemberSkillProfile>) {
  const supabase = await createClient()
  let returnedRow: MemberSkillProfile | null = null

  if (data.id && isUuid(data.id)) {
    const { data: updated, error } = await supabase
      .from('member_skill_profiles')
      .update({
        organization_id: data.organization_id || 'default_org',
        user_id: data.user_id,
        skill_name: data.skill_name,
        skill_category: data.skill_category || 'frontend',
        proficiency_level: data.proficiency_level || 'intermediate',
        years_experience: data.years_experience || 1.0,
        is_primary_specialization: data.is_primary_specialization || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member skill:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = updated as MemberSkillProfile
  } else {
    const { data: created, error } = await supabase
      .from('member_skill_profiles')
      .insert([
        {
          organization_id: data.organization_id || 'default_org',
          user_id: data.user_id,
          skill_name: data.skill_name,
          skill_category: data.skill_category || 'frontend',
          proficiency_level: data.proficiency_level || 'intermediate',
          years_experience: data.years_experience || 1.0,
          is_primary_specialization: data.is_primary_specialization || false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error inserting member skill:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = created as MemberSkillProfile
  }

  revalidatePath('/dashboard/team/capacity')
  return { ok: true, data: returnedRow }
}

export async function deleteMemberSkill(id: string) {
  if (!isUuid(id)) return { ok: true }
  const supabase = await createClient()
  const { error } = await supabase
    .from('member_skill_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting member skill:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard/team/capacity')
  return { ok: true }
}

export async function getMemberCapacityAllocations(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('member_capacity_allocations')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching capacity allocations:', error)
    return { ok: false, error: error.message, data: [] }
  }

  return { ok: true, data: (data || []) as MemberCapacityAllocation[] }
}

export async function saveMemberCapacity(data: Partial<MemberCapacityAllocation>) {
  const supabase = await createClient()
  let returnedRow: MemberCapacityAllocation | null = null

  if (data.id && isUuid(data.id)) {
    const { data: updated, error } = await supabase
      .from('member_capacity_allocations')
      .update({
        organization_id: data.organization_id || 'default_org',
        project_id: data.project_id,
        user_id: data.user_id,
        member_name: data.member_name || null,
        member_role: data.member_role || null,
        avatar_initials: data.avatar_initials || null,
        iteration_id: data.iteration_id || null,
        wbs_phase_id: data.wbs_phase_id || null,
        available_hours_per_week: data.available_hours_per_week || 40.00,
        allocated_percentage: data.allocated_percentage ?? 100,
        sprint_velocity_points: data.sprint_velocity_points || 10.00,
        effective_start_date: data.effective_start_date || new Date().toISOString().split('T')[0],
        effective_end_date: data.effective_end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating capacity allocation:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = updated as MemberCapacityAllocation
  } else {
    const { data: created, error } = await supabase
      .from('member_capacity_allocations')
      .insert([
        {
          organization_id: data.organization_id || 'default_org',
          project_id: data.project_id,
          user_id: data.user_id,
          member_name: data.member_name || null,
          member_role: data.member_role || null,
          avatar_initials: data.avatar_initials || null,
          iteration_id: data.iteration_id || null,
          wbs_phase_id: data.wbs_phase_id || null,
          available_hours_per_week: data.available_hours_per_week || 40.00,
          allocated_percentage: data.allocated_percentage ?? 100,
          sprint_velocity_points: data.sprint_velocity_points || 10.00,
          effective_start_date: data.effective_start_date || new Date().toISOString().split('T')[0],
          effective_end_date: data.effective_end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error inserting capacity allocation:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = created as MemberCapacityAllocation
  }

  if (data.project_id) {
    revalidatePath(`/dashboard/projects/${data.project_id}/team`)
  }
  return { ok: true, data: returnedRow }
}
