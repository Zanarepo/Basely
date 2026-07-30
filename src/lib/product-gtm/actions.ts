'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReleaseGtm(releaseId: string) {
  const supabase = await createClient()
  
  const { data: phases, error: phasesError } = await supabase
    .from('release_rollout_phases')
    .select('*')
    .eq('release_id', releaseId)
    .order('target_percentage', { ascending: true })
    
  if (phasesError) return { success: false, error: phasesError.message }
  
  const { data: flags, error: flagsError } = await supabase
    .from('release_feature_flags')
    .select('*')
    .eq('release_id', releaseId)
    .order('created_at', { ascending: false })
    
  if (flagsError) return { success: false, error: flagsError.message }
  
  return { success: true, phases, flags }
}

export async function upsertRolloutPhase(payload: any) {
  const supabase = await createClient()
  const { id, release_id, ...rest } = payload
  
  if (id) {
    const { error } = await supabase.from('release_rollout_phases').update(rest).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('release_rollout_phases').insert({ release_id, ...rest })
    if (error) return { success: false, error: error.message }
  }
  return { success: true }
}

export async function deleteRolloutPhase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('release_rollout_phases').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function upsertFeatureFlag(payload: any) {
  const supabase = await createClient()
  const { id, release_id, ...rest } = payload
  
  if (id) {
    const { error } = await supabase.from('release_feature_flags').update(rest).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('release_feature_flags').insert({ release_id, ...rest })
    if (error) return { success: false, error: error.message }
  }
  return { success: true }
}

export async function toggleFeatureFlag(id: string, is_enabled: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('release_feature_flags').update({ is_enabled }).eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteFeatureFlag(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('release_feature_flags').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
