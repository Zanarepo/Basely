'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import type { ProductKpi } from './types'

export async function getProductKpis(organizationId: string, projectId?: string): Promise<ProductKpi[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('product_kpis')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching product KPIs:', error)
    return []
  }
  return data as ProductKpi[]
}

export async function createProductKpi(payload: Partial<ProductKpi>): Promise<{ ok: boolean; error?: string; data?: ProductKpi }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('product_kpis')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select()
    .single()

  if (error) {
    console.error('Error creating product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'kpi' as any, data.id, 'created', { name: data.name, value: data.current_value })
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
  }
  
  return { ok: true, data: data as ProductKpi }
}

export async function updateProductKpi(id: string, payload: Partial<ProductKpi>): Promise<{ ok: boolean; error?: string; data?: ProductKpi }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('product_kpis')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'kpi' as any, data.id, 'updated', { name: data.name, value: data.current_value })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as ProductKpi }
}

export async function deleteProductKpi(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('product_kpis').select('project_id, name').eq('id', id).single()
  const { error } = await supabase.from('product_kpis').delete().eq('id', id)

  if (error) {
    console.error('Error deleting product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'kpi' as any, id, 'deleted', { name: data.name })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true }
}
