'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ScopeStatement {
  id: string
  project_id: string
  in_scope_summary: string | null
  out_of_scope: string | null
  assumptions: string | null
  constraints: string | null
  anchored_wbs_element_ids: string[] | null
  created_at: string
  updated_at: string
}

export interface CommunicationPlanEntry {
  id: string
  project_id: string
  stakeholder_id: string
  document_type: string
  cadence: string | null
  channel: string | null
  created_at: string
  updated_at: string
  stakeholders?: {
    name: string
    role_title: string | null
    organization_type: string
  }
}

// ----------------------------------------------------------------------
// Scope Statement Actions
// ----------------------------------------------------------------------

export async function getScopeStatement(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scope_statements')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching scope statement:', error)
    return { data: null, error: error.message }
  }

  return { data: data as ScopeStatement | null, error: null }
}

export async function upsertScopeStatement(projectId: string, data: Partial<ScopeStatement>) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('scope_statements')
    .upsert({
      project_id: projectId,
      in_scope_summary: data.in_scope_summary,
      out_of_scope: data.out_of_scope,
      assumptions: data.assumptions,
      constraints: data.constraints,
      anchored_wbs_element_ids: data.anchored_wbs_element_ids,
    }, { onConflict: 'project_id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting scope statement:', error)
    return { data: null, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { data: result as ScopeStatement, error: null }
}

// ----------------------------------------------------------------------
// Communication Plan Actions
// ----------------------------------------------------------------------

export async function getCommunicationPlanEntries(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('communication_plan_entries')
    .select(`
      *,
      stakeholders (
        name,
        role_title,
        organization_type
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching communication plan entries:', error)
    return { data: [], error: error.message }
  }

  return { data: data as CommunicationPlanEntry[], error: null }
}

export async function upsertCommunicationPlanEntry(projectId: string, data: Partial<CommunicationPlanEntry>) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('communication_plan_entries')
    .upsert({
      id: data.id,
      project_id: projectId,
      stakeholder_id: data.stakeholder_id,
      document_type: data.document_type,
      cadence: data.cadence,
      channel: data.channel,
    })
    .select(`
      *,
      stakeholders (
        name,
        role_title,
        organization_type
      )
    `)
    .single()

  if (error) {
    console.error('Error upserting communication plan entry:', error)
    return { data: null, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { data: result as CommunicationPlanEntry, error: null }
}

export async function deleteCommunicationPlanEntry(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('communication_plan_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting communication plan entry:', error)
    return { error: error.message }
  }

  return { error: null }
}

// ----------------------------------------------------------------------
// Helper to pre-populate Communication Plan from existing stakeholders
// ----------------------------------------------------------------------
export async function autoPopulateCommunicationPlan(projectId: string) {
  const supabase = await createClient()
  
  // 1. Fetch stakeholders with communication preferences
  const { data: stakeholders, error: shError } = await supabase
    .from('stakeholders')
    .select('id, communication_preference')
    .eq('project_id', projectId)
    .not('communication_preference', 'is', null)
    
  if (shError || !stakeholders) return { error: shError?.message || 'Failed to load stakeholders' }
  
  // 2. Fetch existing entries to avoid duplicates
  const { data: existing } = await supabase
    .from('communication_plan_entries')
    .select('stakeholder_id, document_type')
    .eq('project_id', projectId)
    
  const existingSet = new Set(existing?.map(e => `${e.stakeholder_id}-${e.document_type}`))
  
  const toInsert: any[] = []
  
  stakeholders.forEach(sh => {
    // Basic prepopulation: Assign 'status_report' if not already assigned
    if (!existingSet.has(`${sh.id}-status_report`) && sh.communication_preference) {
      toInsert.push({
        project_id: projectId,
        stakeholder_id: sh.id,
        document_type: 'status_report',
        cadence: 'Weekly', // Default fallback
        channel: 'Email', // Default fallback, user might have put something in preferences
      })
    }
  })
  
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('communication_plan_entries')
      .insert(toInsert)
      
    if (insertError) return { error: insertError.message }
  }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { error: null, count: toInsert.length }
}
