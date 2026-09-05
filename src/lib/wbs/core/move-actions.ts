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

export async function moveWbsElement(
  id: string,
  projectId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('wbs_elements')
    .update({
      parent_id: newParentId,
      sort_order: newSortOrder,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function updateWbsSortOrders(
  projectId: string,
  updates: { id: string; parentId: string | null; sortOrder: number }[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Perform updates sequentially
  for (const item of updates) {
    const { error } = await supabase
      .from('wbs_elements')
      .update({
        parent_id: item.parentId,
        sort_order: item.sortOrder,
      })
      .eq('id', item.id)

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
