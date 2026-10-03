'use server'

/**
 * ADR Workflow Data Layer
 * Responsible ONLY for database reads/writes related to ADR cross-module integrations.
 * No AI logic, no UI, no business rules.
 */

import { createClient } from '@/utils/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdrSummary {
  id: string
  title: string
  status: string
  technical_domain: string
  decision: string
  context: string
  consequences: string
}

export interface WbsAdrLinkData {
  wbsElementId: string
  wbsName: string
  wbsDescription: string | null
  linkedAdrIds: string[]
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getAdrById(adrId: string): Promise<AdrSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('architecture_decision_records')
    .select('id, title, status, technical_domain, decision, context, consequences')
    .eq('id', adrId)
    .single()

  if (error || !data) return null
  return data as AdrSummary
}

export async function getAdrsByIds(adrIds: string[]): Promise<AdrSummary[]> {
  if (!adrIds.length) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('architecture_decision_records')
    .select('id, title, status, technical_domain, decision, context, consequences')
    .in('id', adrIds)

  if (error || !data) return []
  return data as AdrSummary[]
}

export async function getWbsWithLinkedAdrs(wbsElementId: string): Promise<WbsAdrLinkData | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wbs_elements')
    .select('id, name, description, linked_adr_ids')
    .eq('id', wbsElementId)
    .single()

  if (error || !data) return null
  return {
    wbsElementId: data.id,
    wbsName: data.name,
    wbsDescription: data.description,
    linkedAdrIds: data.linked_adr_ids || [],
  }
}

export async function getProjectAdrs(projectId: string): Promise<AdrSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('architecture_decision_records')
    .select('id, title, status, technical_domain, decision, context, consequences')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as AdrSummary[]
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function updateWbsLinkedAdrs(
  wbsElementId: string,
  adrIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('wbs_elements')
    .update({ linked_adr_ids: adrIds })
    .eq('id', wbsElementId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function createRaidEntryFromAdrSuggestion(payload: {
  projectId: string
  organizationId: string
  sourceAdrId: string
  category: 'risk' | 'assumption' | 'dependency'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('raid_log_entries')
    .insert({
      project_id: payload.projectId,
      organization_id: payload.organizationId,
      source_adr_id: payload.sourceAdrId,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      status: 'open',
      impact_rating: payload.priority === 'critical' ? 5 : payload.priority === 'high' ? 4 : payload.priority === 'medium' ? 3 : 2,
      probability_rating: 3,
      created_by: user?.id || null,
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
