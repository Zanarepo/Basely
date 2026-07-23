'use server'

import { createClient } from '@/utils/supabase/server'
import { logProjectActivity } from '@/lib/projects/activity-actions'

export async function recordActualCost(payload: {
  wbs_element_id: string;
  activity_id?: string;
  resource_rate_id?: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  source?: 'manual' | 'import' | 'api';
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actual_costs')
    .insert({
      wbs_element_id: payload.wbs_element_id,
      activity_id: payload.activity_id || null,
      resource_rate_id: payload.resource_rate_id || null,
      amount: payload.amount,
      currency: payload.currency,
      date: payload.date,
      description: payload.description || null,
      source: payload.source || 'manual'
    })
    .select()
    .single()

  if (error) throw error
  
  const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', payload.wbs_element_id).single()
  if (wbsData?.project_id) {
    await logProjectActivity(wbsData.project_id, 'actuals', data.id, 'created', { name: `Actual Cost for ${wbsData.name}`, amount: payload.amount, currency: payload.currency })
  }
  
  return { success: true, data }
}

export async function updateActualCost(id: string, payload: {
  wbs_element_id?: string;
  activity_id?: string | null;
  resource_rate_id?: string | null;
  amount?: number;
  currency?: string;
  date?: string;
  description?: string | null;
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actual_costs')
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (payload.wbs_element_id) {
    const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', payload.wbs_element_id).single()
    if (wbsData?.project_id) {
      await logProjectActivity(wbsData.project_id, 'actuals', id, 'updated', { name: `Actual Cost for ${wbsData.name}`, amount: payload.amount })
    }
  } else {
    // try to fetch from actual_costs to get wbs_element_id
    const { data: actualData } = await supabase.from('actual_costs').select('wbs_element_id').eq('id', id).single()
    if (actualData?.wbs_element_id) {
      const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', actualData.wbs_element_id).single()
      if (wbsData?.project_id) {
        await logProjectActivity(wbsData.project_id, 'actuals', id, 'updated', { name: `Actual Cost for ${wbsData.name}`, amount: payload.amount })
      }
    }
  }

  return { success: true, data }
}

export async function bulkImportActualCosts(rows: Array<{
  wbs_element_id: string;
  activity_id?: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
}>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actual_costs')
    .insert(
      rows.map(row => ({
        wbs_element_id: row.wbs_element_id,
        activity_id: row.activity_id || null,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        description: row.description || null,
        source: 'import'
      }))
    )
    .select()

  if (error) throw error
  return { success: true, data }
}

export async function deleteActualCost(id: string) {
  const supabase = await createClient()
  const { data: actualData } = await supabase.from('actual_costs').select('wbs_element_id').eq('id', id).single()

  const { error } = await supabase
    .from('actual_costs')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (actualData?.wbs_element_id) {
    const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', actualData.wbs_element_id).single()
    if (wbsData?.project_id) {
      await logProjectActivity(wbsData.project_id, 'actuals', id, 'deleted', { name: `Actual Cost for ${wbsData.name}`, id })
    }
  }

  return { success: true }
}

export async function bulkDeleteActualCosts(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in')
  if (!ids || ids.length === 0) return { success: true }

  const { error } = await supabase
    .from('actual_costs')
    .delete()
    .in('id', ids)

  if (error) throw error
  return { success: true }
}
