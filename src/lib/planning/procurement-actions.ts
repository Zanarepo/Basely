'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProcurementEntry = {
  id: string
  project_id: string
  vendor_name: string
  contract_scope: string | null
  cost: number | null
  linked_cost_account_id: string | null
  key_dates: { name: string; date: string }[]
  created_at: string
  updated_at: string
  cost_accounts?: {
    id: string
    budgeted_total: number
    currency: string
  }
}

export async function getProcurementEntries(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('procurement_entries')
    .select(`
      *,
      cost_accounts (
        id,
        budgeted_total,
        currency
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    
  if (error) return { error: error.message }
  return { entries: data as ProcurementEntry[] }
}

export async function upsertProcurementEntry(
  projectId: string, 
  entry: Partial<ProcurementEntry>
) {
  const supabase = await createClient()
  
  const payload: any = {
    project_id: projectId,
    vendor_name: entry.vendor_name,
    contract_scope: entry.contract_scope,
    cost: entry.cost,
    linked_cost_account_id: entry.linked_cost_account_id,
    key_dates: entry.key_dates || []
  }
  
  if (entry.id) {
    payload.id = entry.id
  }
  
  const { data, error } = await supabase
    .from('procurement_entries')
    .upsert(payload)
    .select('*')
    .single()
    
  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { entry: data }
}

export async function deleteProcurementEntry(
  projectId: string,
  entryId: string
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('procurement_entries')
    .delete()
    .eq('id', entryId)
    
  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function getAvailableCostAccounts(projectId: string) {
  const supabase = await createClient()
  
  // We need to fetch cost accounts that belong to this project
  // We can do this by joining wbs_elements
  const { data, error } = await supabase
    .from('cost_accounts')
    .select(`
      id,
      budgeted_total,
      currency,
      wbs_elements!inner (
        id,
        project_id,
        code,
        name
      )
    `)
    .eq('wbs_elements.project_id', projectId)
    
  if (error) return { error: error.message }
  return { costAccounts: data }
}
