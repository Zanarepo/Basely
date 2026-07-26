'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type QualityManagementPlan = {
  id: string
  project_id: string
  review_cadence: string | null
  created_at: string
  updated_at: string
}

export type QualityStandard = {
  id: string
  plan_id: string
  criterion_text: string
  is_checklist_item: boolean
  created_at: string
  updated_at: string
}

export async function getQualityManagementPlan(projectId: string) {
  const supabase = await createClient()
  
  const { data: plan, error: planError } = await supabase
    .from('quality_management_plans')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (planError && planError.code !== 'PGRST116') {
    return { error: planError.message }
  }

  let standards: QualityStandard[] = []
  if (plan) {
    const { data: stds, error: stdsError } = await supabase
      .from('quality_standards')
      .select('*')
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: true })
      
    if (!stdsError && stds) {
      standards = stds
    }
  }

  return { plan, standards }
}

export async function upsertQualityManagementPlan(
  projectId: string, 
  reviewCadence: string | null
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('quality_management_plans')
    .upsert(
      { project_id: projectId, review_cadence: reviewCadence },
      { onConflict: 'project_id' }
    )
    .select('*')
    .single()
    
  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { plan: data }
}

export async function upsertQualityStandard(
  planId: string, 
  standard: Partial<QualityStandard>
) {
  const supabase = await createClient()
  
  const payload: any = {
    plan_id: planId,
    criterion_text: standard.criterion_text,
    is_checklist_item: standard.is_checklist_item ?? true
  }
  
  if (standard.id) {
    payload.id = standard.id
  }
  
  const { data, error } = await supabase
    .from('quality_standards')
    .upsert(payload)
    .select('*')
    .single()
    
  if (error) return { error: error.message }
  
  return { standard: data }
}

export async function deleteQualityStandard(standardId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('quality_standards')
    .delete()
    .eq('id', standardId)
    
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleWbsQualityStandardLink(
  wbsElementId: string,
  qualityStandardId: string,
  link: boolean
) {
  const supabase = await createClient()
  
  if (link) {
    const { error } = await supabase
      .from('wbs_quality_standard_links')
      .upsert({ 
        wbs_element_id: wbsElementId, 
        quality_standard_id: qualityStandardId 
      })
      
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('wbs_quality_standard_links')
      .delete()
      .match({ 
        wbs_element_id: wbsElementId, 
        quality_standard_id: qualityStandardId 
      })
      
    if (error) return { error: error.message }
  }
  
  return { success: true }
}

export async function getWbsQualityStandardLinks(qualityStandardId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('wbs_quality_standard_links')
    .select('wbs_element_id')
    .eq('quality_standard_id', qualityStandardId)
    
  if (error) return { error: error.message }
  return { linkedWbsIds: data.map(d => d.wbs_element_id) }
}
