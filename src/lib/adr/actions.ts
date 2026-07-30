'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type AdrStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded' | 'rejected'
export type AdrDomain = 'backend' | 'frontend' | 'database' | 'infrastructure' | 'security' | 'ai_data'

export interface ArchitectureDecisionRecord {
  id: string
  organization_id: string
  project_id?: string
  document_id?: string
  title: string
  status: AdrStatus
  context: string
  decision: string
  consequences: string
  technical_domain: AdrDomain
  superseded_by_adr_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export async function getAdrs(projectId?: string, organizationId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('architecture_decision_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  } else if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching ADRs:', error)
    return { ok: false, error: error.message, data: [] }
  }

  return { ok: true, data: (data || []) as ArchitectureDecisionRecord[] }
}

export async function saveAdr(data: Partial<ArchitectureDecisionRecord>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  let returnedRow: any = null

  if (data.id && isUuid(data.id)) {
    const { data: updated, error } = await supabase
      .from('architecture_decision_records')
      .update({
        organization_id: data.organization_id || 'default_org_id',
        project_id: data.project_id || null,
        title: data.title,
        status: data.status || 'proposed',
        context: data.context,
        decision: data.decision,
        consequences: data.consequences,
        technical_domain: data.technical_domain || 'backend',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ADR:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = updated
  } else {
    const { data: created, error } = await supabase
      .from('architecture_decision_records')
      .insert([
        {
          organization_id: data.organization_id || 'default_org_id',
          project_id: data.project_id || null,
          title: data.title,
          status: data.status || 'proposed',
          context: data.context,
          decision: data.decision,
          consequences: data.consequences,
          technical_domain: data.technical_domain || 'backend',
          created_by: user?.id || null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating ADR:', error)
      return { ok: false, error: error.message }
    }
    returnedRow = created
  }

  if (data.project_id) {
    revalidatePath(`/dashboard/projects/${data.project_id}/adr`)
  }
  return { ok: true, data: returnedRow }
}

export async function deleteAdr(id: string, projectId?: string) {
  const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  if (!isUuid(id)) return { ok: true }

  const supabase = await createClient()
  const { error } = await supabase
    .from('architecture_decision_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ADR:', error)
    return { ok: false, error: error.message }
  }

  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}/adr`)
  }
  return { ok: true }
}
