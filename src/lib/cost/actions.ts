'use server'

import { createClient } from '@/utils/supabase/server'
import type { EstimationMethod } from './types'

export async function saveCostEstimate(
  wbsElementId: string, 
  payload: {
    estimation_method: EstimationMethod;
    budgeted_total: number;
    rate?: number | null;
    quantity?: number | null;
    analogous_reference_note?: string | null;
    currency?: string;
  }
) {
  const supabase = await createClient()

  // 1. Check if cost account exists for this WBS element
  const { data: existingAccount } = await supabase
    .from('cost_accounts')
    .select('id')
    .eq('wbs_element_id', wbsElementId)
    .maybeSingle()

  if (existingAccount) {
    // Update existing
    const { data, error } = await supabase
      .from('cost_accounts')
      .update({
        estimation_method: payload.estimation_method,
        budgeted_total: payload.budgeted_total,
        rate: payload.rate || null,
        quantity: payload.quantity || null,
        analogous_reference_note: payload.analogous_reference_note || null,
        currency: payload.currency || 'USD',
        reconciliation_status: payload.estimation_method === 'bottom_up' ? 'pending' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAccount.id)
      .select()
      .single()
      
    if (error) throw error
    return { success: true, data }
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('cost_accounts')
      .insert({
        wbs_element_id: wbsElementId,
        estimation_method: payload.estimation_method,
        budgeted_total: payload.budgeted_total,
        rate: payload.rate || null,
        quantity: payload.quantity || null,
        analogous_reference_note: payload.analogous_reference_note || null,
        currency: payload.currency || 'USD',
        reconciliation_status: 'pending',
      })
      .select()
      .single()
      
    if (error) throw error
    return { success: true, data }
  }
}

export async function generateLinearTimePhasing(costAccountId: string, startDate: string, endDate: string, budgetedTotal: number) {
  const supabase = await createClient()

  // Simple linear distribution logic over months
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Calculate total days
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
  if (totalDays <= 0) {
    throw new Error("Invalid dates for time phasing")
  }

  const entries = []
  let currentStart = new Date(start)

  while (currentStart <= end) {
    // Determine end of current month or end of project
    let currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0)
    if (currentEnd > end) {
      currentEnd = new Date(end)
    }

    const daysInPeriod = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24) + 1
    const amount = (budgetedTotal * daysInPeriod) / totalDays

    entries.push({
      cost_account_id: costAccountId,
      period_start_date: currentStart.toISOString().split('T')[0],
      period_end_date: currentEnd.toISOString().split('T')[0],
      planned_amount: Number(amount.toFixed(2)),
    })

    // Move to next month
    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
  }

  // Delete existing
  await supabase.from('time_phase_entries').delete().eq('cost_account_id', costAccountId)

  // Insert new
  const { error } = await supabase.from('time_phase_entries').insert(entries)
  if (error) throw error

  return { success: true }
}

export async function createBudgetBaseline(projectId: string, name: string) {
  const supabase = await createClient()
  
  // Create Baseline
  const { data: baseline, error: bError } = await supabase
    .from('budget_baselines')
    .insert({ project_id: projectId, name })
    .select()
    .single()
    
  if (bError) throw bError

  // In a real app, this snapshotting might be done via a Postgres RPC function 
  // for performance and transactional integrity. 
  // Here we do it via application logic for demonstration.
  const { data: wbsElements } = await supabase.from('wbs_elements').select('id, name, parent_id').eq('project_id', projectId)
  const { data: costAccounts } = await supabase.from('cost_accounts').select('*, time_phase_entries(*)').in('wbs_element_id', (wbsElements || []).map(w => w.id))

  if (wbsElements && costAccounts) {
    const snapshots = costAccounts.map(ca => {
      const wbs = wbsElements.find(w => w.id === ca.wbs_element_id)
      return {
        baseline_id: baseline.id,
        wbs_element_id: ca.wbs_element_id,
        snapshotted_wbs_name: wbs?.name || 'Unknown',
        snapshotted_parent_id: wbs?.parent_id || null,
        baseline_total: ca.budgeted_total,
        exchange_rate_at_snapshot: 1.0, // Hardcoded for now
        baseline_time_phase: ca.time_phase_entries, // JSONB
      }
    })

    if (snapshots.length > 0) {
      const { error: sError } = await supabase.from('baseline_cost_snapshots').insert(snapshots)
      if (sError) throw sError
    }
  }

  return { success: true, data: baseline }
}

export async function updateProjectContingency(projectId: string, amount: number, type?: 'flat' | 'percentage') {
  const supabase = await createClient()
  
  const updateData: any = { contingency_amount: amount }
  if (type) {
    updateData.contingency_type = type
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select('contingency_amount, contingency_type')
    .single()
    
  if (error) throw error
  return { success: true, data }
}

export async function createResourceRate(projectId: string, payload: {
  name: string, type: 'labor' | 'material' | 'fixed', rate: number, unit: 'hr' | 'day' | 'unit' | 'flat', currency?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resource_rates')
    .insert({
      project_id: projectId,
      name: payload.name,
      type: payload.type,
      rate: payload.rate,
      unit: payload.unit,
      currency: payload.currency || 'USD'
    })
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

export async function updateResourceRate(rateId: string, payload: {
  name: string, type: 'labor' | 'material' | 'fixed', rate: number, unit: 'hr' | 'day' | 'unit' | 'flat', currency?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resource_rates')
    .update({
      name: payload.name,
      type: payload.type,
      rate: payload.rate,
      unit: payload.unit,
      currency: payload.currency,
      updated_at: new Date().toISOString()
    })
    .eq('id', rateId)
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

export async function deleteResourceRate(rateId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resource_rates')
    .delete()
    .eq('id', rateId)

  if (error) throw error
  return { success: true }
}

export async function updateGlobalOverhead(projectId: string, percentage: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({ global_overhead_percentage: percentage })
    .eq('id', projectId)
    .select('global_overhead_percentage')
    .single()
    
  if (error) throw error
  return { success: true, data }
}

export async function assignResourceToActivity(wbsElementId: string, resourceRateId: string, quantity: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('activity_resource_assignments')
    .insert({
      wbs_element_id: wbsElementId,
      resource_rate_id: resourceRateId,
      quantity: quantity
    })
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

export async function deleteResourceAssignment(assignmentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('activity_resource_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw error
  return { success: true }
}

export async function reconcileBottomUpEstimate(costAccountId: string, resourceCalculatedTotal: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cost_accounts')
    .update({ 
      budgeted_total: resourceCalculatedTotal,
      reconciliation_status: 'reconciled',
      updated_at: new Date().toISOString()
    })
    .eq('id', costAccountId)
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

export async function getBaselineSnapshots(baselineId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('baseline_cost_snapshots')
    .select('*')
    .eq('baseline_id', baselineId)

  if (error) throw error
  return data
}

export async function updateBudgetBaseline(baselineId: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_baselines')
    .update({ name })
    .eq('id', baselineId)
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

export async function deleteBudgetBaseline(baselineId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('budget_baselines')
    .delete()
    .eq('id', baselineId)

  if (error) throw error
  return { success: true }
}

export async function bulkImportResourceRates(projectId: string, resources: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in')

  if (!resources || resources.length === 0) return { success: true }

  const { error } = await supabase
    .from('resource_rates')
    .insert(resources)

  if (error) throw error
  return { success: true }
}

export async function bulkDeleteResourceRates(rateIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in')

  if (!rateIds || rateIds.length === 0) return { success: true }

  const { error } = await supabase
    .from('resource_rates')
    .delete()
    .in('id', rateIds)

  if (error) throw error
  return { success: true }
}
