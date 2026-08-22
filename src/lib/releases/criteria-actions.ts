'use server'

import { createClient } from '@/utils/supabase/server'
import type { ReleaseExitCriterion } from './types'

export async function toggleExitCriterion(id: string, releaseId: string, isMet: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_exit_criteria')
    .update({ is_met: isMet })
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function addExitCriterion(releaseId: string, criterionText: string): Promise<{ ok: boolean; error?: string; criterion?: ReleaseExitCriterion }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('release_exit_criteria')
    .insert({
      release_id: releaseId,
      criterion_text: criterionText.trim(),
      is_met: false
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  return {
    ok: true,
    criterion: {
      id: data.id,
      releaseId: data.release_id,
      criterionText: data.criterion_text,
      isMet: data.is_met,
      createdAt: data.created_at
    }
  }
}

export async function deleteExitCriterion(id: string, releaseId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_exit_criteria')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function addManualScopeOverride(
  releaseId: string,
  entityType: 'wbs_element' | 'activity' | 'custom_item',
  title: string,
  action: 'added' | 'excluded',
  entityId?: string | null,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_manual_scope')
    .insert({
      release_id: releaseId,
      entity_type: entityType,
      entity_id: entityId || null,
      title: title.trim(),
      action: action,
      notes: notes ? notes.trim() : null
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteManualScopeOverride(id: string, releaseId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_manual_scope')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
