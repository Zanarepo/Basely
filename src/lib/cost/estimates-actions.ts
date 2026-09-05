'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { EstimationMethod } from './types'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { logProjectActivity } from '@/lib/projects/activity-actions'

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

    const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', wbsElementId).single()
    if (wbsData) {
      await logProjectActivity(wbsData.project_id, 'cost_account', data.id, 'updated', { name: `Estimate for ${wbsData.name}`, total: payload.budgeted_total })
    }

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

    const { data: wbsData } = await supabase.from('wbs_elements').select('project_id, name').eq('id', wbsElementId).single()
    if (wbsData) {
      await logProjectActivity(wbsData.project_id, 'cost_account', data.id, 'created', { name: `Estimate for ${wbsData.name}`, total: payload.budgeted_total })
    }

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
