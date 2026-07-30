'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type RaidCategory = 'risk' | 'assumption' | 'issue' | 'dependency'
export type RaidStatus = 'open' | 'in_progress' | 'mitigated' | 'closed' | 'verified' | 'invalidated'
export type RaidPriority = 'low' | 'medium' | 'high' | 'critical'

export interface RaidLogEntry {
  id: string
  organization_id: string
  project_id: string
  category: RaidCategory
  title: string
  description: string
  status: RaidStatus
  priority: RaidPriority
  owner_id?: string
  external_owner_name?: string
  target_resolution_date?: string
  validation_due_date?: string
  impact_rating: number
  probability_rating: number
  mitigation_plan?: string
  linked_wbs_element_id?: string
  linked_sprint_item_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export async function getRaidEntries(projectId: string, categoryFilter?: RaidCategory | 'all') {
  const supabase = await createClient()

  let query = supabase
    .from('raid_log_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (categoryFilter && categoryFilter !== 'all') {
    query = query.eq('category', categoryFilter)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching RAID entries:', error)
    return { ok: false, error: error.message, data: [] }
  }

  return { ok: true, data: (data || []) as RaidLogEntry[] }
}

export async function getWbsRaidBlockers(wbsElementId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('raid_log_entries')
    .select('*')
    .eq('linked_wbs_element_id', wbsElementId)
    .in('status', ['open', 'in_progress', 'invalidated'])

  if (error) {
    console.error('Error fetching WBS RAID blockers:', error)
    return { ok: false, error: error.message, data: [] }
  }

  return { ok: true, data: (data || []) as RaidLogEntry[] }
}

const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export async function upsertRaidEntry(data: Partial<RaidLogEntry>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let returnedRow: RaidLogEntry | null = null

  if (data.id && isUuid(data.id)) {
    const { data: updated, error } = await supabase
      .from('raid_log_entries')
      .update({
        organization_id: data.organization_id || 'default_org',
        project_id: data.project_id,
        category: data.category || 'risk',
        title: data.title,
        description: data.description || '',
        status: data.status || 'open',
        priority: data.priority || 'medium',
        external_owner_name: data.external_owner_name || null,
        target_resolution_date: data.target_resolution_date || null,
        validation_due_date: data.validation_due_date || null,
        impact_rating: data.impact_rating || 3,
        probability_rating: data.probability_rating || 3,
        mitigation_plan: data.mitigation_plan || null,
        linked_wbs_element_id: data.linked_wbs_element_id || null,
        linked_sprint_item_id: data.linked_sprint_item_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating RAID entry:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = updated as RaidLogEntry
  } else {
    const { data: created, error } = await supabase
      .from('raid_log_entries')
      .insert([
        {
          organization_id: data.organization_id || 'default_org',
          project_id: data.project_id,
          category: data.category || 'risk',
          title: data.title,
          description: data.description || '',
          status: data.status || 'open',
          priority: data.priority || 'medium',
          owner_id: data.owner_id || null,
          external_owner_name: data.external_owner_name || null,
          target_resolution_date: data.target_resolution_date || null,
          validation_due_date: data.validation_due_date || null,
          impact_rating: data.impact_rating || 3,
          probability_rating: data.probability_rating || 3,
          mitigation_plan: data.mitigation_plan || null,
          linked_wbs_element_id: data.linked_wbs_element_id || null,
          linked_sprint_item_id: data.linked_sprint_item_id || null,
          created_by: user?.id || null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating RAID entry:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = created as RaidLogEntry
  }

  if (data.project_id) {
    revalidatePath(`/dashboard/projects/${data.project_id}/risks`)
  }
  return { ok: true, data: returnedRow }
}

export async function deleteRaidEntry(id: string, projectId: string) {
  if (!isUuid(id)) return { ok: true }
  const supabase = await createClient()
  const { error } = await supabase
    .from('raid_log_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting RAID entry:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}/risks`)
  return { ok: true }
}
