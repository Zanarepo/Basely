'use server'

import { createClient } from '@/utils/supabase/server'

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
  const { error } = await supabase
    .from('actual_costs')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { success: true }
}
