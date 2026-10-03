'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import type { 
  WbsElement, 
  WbsStatus, 
  DeliverableItem, 
  AcceptanceCriteriaItem,
  ChecklistItem 
} from '../constants'
import { recalculateSchedule } from '@/lib/schedule/actions/recalculate'
import { ActionResponse, CreateWbsResult } from './types'

async function performCascadingWbsDelete(adminClient: any, targetIds: string[], projectId: string) {
  if (!targetIds || targetIds.length === 0) return

  // 1. Fetch all WBS elements for the project to recursively gather all child IDs
  const { data: allWbs } = await adminClient
    .from('wbs_elements')
    .select('id, parent_id')
    .eq('project_id', projectId)

  const allToDelete = new Set<string>(targetIds)
  let addedNew = true
  while (addedNew) {
    addedNew = false
    if (allWbs) {
      for (const item of allWbs) {
        if (item.parent_id && allToDelete.has(item.parent_id) && !allToDelete.has(item.id)) {
          allToDelete.add(item.id)
          addedNew = true
        }
      }
    }
  }

  const idsArray = Array.from(allToDelete)

  // 2. Unlink product backlog items (SET wbs_element_id = NULL)
  await adminClient
    .from('product_backlog_items')
    .update({ wbs_element_id: null })
    .in('wbs_element_id', idsArray)

  // 3. Find all activity IDs for these WBS elements
  const { data: acts } = await adminClient
    .from('activities')
    .select('id')
    .in('wbs_element_id', idsArray)

  if (acts && acts.length > 0) {
    const actIds = acts.map((a: any) => a.id)
    // Delete dependencies referencing these activities (as predecessor or successor)
    await adminClient.from('dependencies').delete().in('predecessor_id', actIds)
    await adminClient.from('dependencies').delete().in('successor_id', actIds)
    // Delete activities
    await adminClient.from('activities').delete().in('id', actIds)
  }

  // 4. Delete associated cost accounts
  await adminClient.from('cost_accounts').delete().in('wbs_element_id', idsArray)

  // 5. Delete RACI assignments
  await adminClient.from('raci_assignments').delete().in('wbs_element_id', idsArray)

  // 6. Delete WBS elements
  const { error: delErr } = await adminClient
    .from('wbs_elements')
    .delete()
    .in('id', idsArray)

  if (delErr) {
    console.error('Cascading WBS delete error:', delErr)
    throw new Error(delErr.message)
  }
}

export async function deleteWbsElement(id: string, projectId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'You must be signed in' }

    const adminClient = createAdminClient()
    await performCascadingWbsDelete(adminClient, [id], projectId)

    // Recalculate schedule to update timelines after deletion
    await recalculateSchedule(projectId)

    await logProjectActivity(projectId, 'wbs_element', id, 'deleted', { id })

    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    console.error('deleteWbsElement failed:', err)
    return { ok: false, error: err?.message || 'Could not delete WBS element' }
  }
}

export async function bulkDeleteWbsElements(
  ids: string[],
  projectId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'You must be signed in' }
    if (!ids || ids.length === 0) return { ok: true }

    const adminClient = createAdminClient()
    await performCascadingWbsDelete(adminClient, ids, projectId)

    await recalculateSchedule(projectId)

    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    console.error('bulkDeleteWbsElements failed:', err)
    return { ok: false, error: err?.message || 'Could not delete WBS elements' }
  }
}

