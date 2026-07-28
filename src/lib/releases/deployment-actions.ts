'use server'

import { createClient } from '@/utils/supabase/server'
import type { ReleaseDeploymentPlan, ReleaseRollbackPlan } from './types'
import { revalidatePath } from 'next/cache'

// Deployment Plans

export async function addDeploymentStep(
  releaseId: string,
  phase: 'Before' | 'During' | 'After',
  stepText: string,
  sortOrder: number
): Promise<{ ok: boolean; error?: string; step?: ReleaseDeploymentPlan }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('release_deployment_plans')
    .insert({
      release_id: releaseId,
      phase,
      step_text: stepText.trim(),
      is_completed: false,
      sort_order: sortOrder
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  return {
    ok: true,
    step: {
      id: data.id,
      releaseId: data.release_id,
      phase: data.phase,
      stepText: data.step_text,
      isCompleted: data.is_completed,
      completedByUserId: data.completed_by_user_id,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      sortOrder: data.sort_order
    }
  }
}

export async function toggleDeploymentStep(
  id: string,
  releaseId: string,
  isCompleted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const updateData = isCompleted
    ? { is_completed: true, completed_by_user_id: userId, completed_at: new Date().toISOString() }
    : { is_completed: false, completed_by_user_id: null, completed_at: null }

  const { error } = await supabase
    .from('release_deployment_plans')
    .update(updateData)
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteDeploymentStep(
  id: string,
  releaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_deployment_plans')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateDeploymentStepOrder(
  id: string,
  releaseId: string,
  sortOrder: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_deployment_plans')
    .update({ sort_order: sortOrder })
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// Rollback Plans

export async function addRollbackStep(
  releaseId: string,
  stepText: string,
  sortOrder: number
): Promise<{ ok: boolean; error?: string; step?: ReleaseRollbackPlan }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('release_rollback_plans')
    .insert({
      release_id: releaseId,
      step_text: stepText.trim(),
      is_completed: false,
      sort_order: sortOrder
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  return {
    ok: true,
    step: {
      id: data.id,
      releaseId: data.release_id,
      stepText: data.step_text,
      isCompleted: data.is_completed,
      completedByUserId: data.completed_by_user_id,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      sortOrder: data.sort_order
    }
  }
}

export async function toggleRollbackStep(
  id: string,
  releaseId: string,
  isCompleted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const updateData = isCompleted
    ? { is_completed: true, completed_by_user_id: userId, completed_at: new Date().toISOString() }
    : { is_completed: false, completed_by_user_id: null, completed_at: null }

  const { error } = await supabase
    .from('release_rollback_plans')
    .update(updateData)
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteRollbackStep(
  id: string,
  releaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_rollback_plans')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateRollbackStepOrder(
  id: string,
  releaseId: string,
  sortOrder: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_rollback_plans')
    .update({ sort_order: sortOrder })
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
