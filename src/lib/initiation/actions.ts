'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type BusinessCase = {
  id: string
  organization_id: string
  project_id: string | null
  name: string
  problem_statement: string | null
  proposed_solution: string | null
  estimated_cost: number | null
  estimated_benefit: string | null
  recommendation: string | null
  linked_cost_estimate_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FeasibilityStudy = {
  id: string
  organization_id: string
  project_id: string | null
  business_case_id: string | null
  name: string
  technical_assessment: string | null
  financial_assessment: string | null
  operational_assessment: string | null
  overall_recommendation: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ---------------------------
// Business Cases
// ---------------------------
export async function getBusinessCases(organizationId: string): Promise<BusinessCase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_cases')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching business cases:', error)
    return []
  }
  return data as BusinessCase[]
}

export async function createBusinessCase(payload: Partial<BusinessCase>): Promise<{ ok: boolean; error?: string; data?: BusinessCase }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_cases')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }
  
  revalidatePath('/dashboard')
  return { ok: true, data: data as BusinessCase }
}

export async function updateBusinessCase(id: string, payload: Partial<BusinessCase>): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('business_cases')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteBusinessCase(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('business_cases')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

// ---------------------------
// Feasibility Studies
// ---------------------------
export async function getFeasibilityStudies(organizationId: string): Promise<FeasibilityStudy[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feasibility_studies')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching feasibility studies:', error)
    return []
  }
  return data as FeasibilityStudy[]
}

export async function createFeasibilityStudy(payload: Partial<FeasibilityStudy>): Promise<{ ok: boolean; error?: string; data?: FeasibilityStudy }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feasibility_studies')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }
  
  revalidatePath('/dashboard')
  return { ok: true, data: data as FeasibilityStudy }
}

export async function updateFeasibilityStudy(id: string, payload: Partial<FeasibilityStudy>): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('feasibility_studies')
    .update(payload)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteFeasibilityStudy(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('feasibility_studies')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
