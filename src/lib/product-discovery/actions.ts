'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import type { DiscoveryInsight, ProductRequirementsDoc } from '@/lib/product-strategy/types'

// ---------------------------
// Discovery Insight Server Actions
// ---------------------------

export async function getDiscoveryInsights(organizationId: string, projectId?: string): Promise<DiscoveryInsight[]> {
  const supabase = await createClient()

  let query = supabase
    .from('discovery_insights')
    .select('*, persona:personas(id, name, role_title, avatar_color)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching discovery insights:', error)
    return []
  }
  return data as DiscoveryInsight[]
}

export async function createDiscoveryInsight(payload: Partial<DiscoveryInsight>): Promise<{ ok: boolean; error?: string; data?: DiscoveryInsight }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('discovery_insights')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select('*, persona:personas(id, name, role_title, avatar_color)')
    .single()

  if (error) {
    console.error('Error creating discovery insight:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'discovery_insight' as any, data.id, 'created', { title: data.title })
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
  }

  return { ok: true, data: data as DiscoveryInsight }
}

export async function updateDiscoveryInsight(id: string, payload: Partial<DiscoveryInsight>): Promise<{ ok: boolean; error?: string; data?: DiscoveryInsight }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('discovery_insights')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, persona:personas(id, name, role_title, avatar_color)')
    .single()

  if (error) {
    console.error('Error updating discovery insight:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'discovery_insight' as any, data.id, 'updated', { title: data.title })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as DiscoveryInsight }
}

export async function deleteDiscoveryInsight(id: string, projectId?: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('discovery_insights')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting discovery insight:', error)
    return { ok: false, error: error.message }
  }

  if (projectId) {
    await logProjectActivity(projectId, 'discovery_insight' as any, id, 'deleted', {})
    revalidatePath(`/dashboard/projects/${projectId}`)
  }

  return { ok: true }
}

// ---------------------------
// PRD Metadata Server Actions
// ---------------------------

export async function getPrdMetadata(organizationId: string, projectId?: string): Promise<ProductRequirementsDoc[]> {
  const supabase = await createClient()

  let query = supabase
    .from('product_requirements_docs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching PRD metadata:', error)
    return []
  }
  return data as ProductRequirementsDoc[]
}

export async function upsertPrdMetadata(payload: Partial<ProductRequirementsDoc>): Promise<{ ok: boolean; error?: string; data?: ProductRequirementsDoc }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const insertPayload = { ...payload, created_by: user?.id || null }

  const { data, error } = await supabase
    .from('product_requirements_docs')
    .upsert(insertPayload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting PRD metadata:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as ProductRequirementsDoc }
}

// ---------------------------
// Convert Insight → Change Request (Bridge Action)
// ---------------------------

export async function convertInsightToChangeRequest(
  insightId: string,
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string; changeRequestId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch the insight
  const { data: insight, error: fetchErr } = await supabase
    .from('discovery_insights')
    .select('*')
    .eq('id', insightId)
    .single()

  if (fetchErr || !insight) {
    return { ok: false, error: fetchErr?.message || 'Insight not found' }
  }

  // 2. Create a Change Request from the insight
  const { data: cr, error: crErr } = await supabase
    .from('change_request_log_entries')
    .insert([{
      project_id: projectId,
      title: `[VoC] ${insight.title}`,
      description: insight.description || `Converted from Discovery Insight: ${insight.title}`,
      priority: insight.severity === 'critical' ? 'critical' : insight.severity === 'high' ? 'high' : 'medium',
      status: 'submitted',
      requested_by: user?.id || null
    }])
    .select()
    .single()

  if (crErr || !cr) {
    return { ok: false, error: crErr?.message || 'Failed to create change request' }
  }

  // 3. Create the junction link
  await supabase
    .from('discovery_change_request_links')
    .insert([{
      discovery_insight_id: insightId,
      change_request_id: cr.id,
      link_type: 'converted_from'
    }])

  // 4. Update insight status to converted
  await supabase
    .from('discovery_insights')
    .update({ status: 'converted', updated_at: new Date().toISOString() })
    .eq('id', insightId)

  if (projectId) {
    await logProjectActivity(projectId, 'discovery_insight' as any, insightId, 'updated', { action: 'converted_to_change_request', change_request_id: cr.id })
    revalidatePath(`/dashboard/projects/${projectId}`)
  }

  return { ok: true, changeRequestId: cr.id }
}

// ---------------------------
// Link Insight → Risk (Bridge Action)
// ---------------------------

export async function linkInsightToRisk(
  insightId: string,
  riskId: string,
  projectId?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('discovery_risk_links')
    .insert([{
      discovery_insight_id: insightId,
      risk_id: riskId,
      link_type: 'supporting_context'
    }])

  if (error) {
    console.error('Error linking insight to risk:', error)
    return { ok: false, error: error.message }
  }

  if (projectId) {
    await logProjectActivity(projectId, 'discovery_insight' as any, insightId, 'updated', { action: 'linked_to_risk', risk_id: riskId })
    revalidatePath(`/dashboard/projects/${projectId}`)
  }

  return { ok: true }
}
