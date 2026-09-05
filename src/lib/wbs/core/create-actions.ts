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

export async function createWbsElement(
  projectId: string,
  parentId: string | null,
  name: string,
  sortOrder: number,
  initialData?: { status?: string; isWorkPackage?: boolean }
): Promise<CreateWbsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Simple validation for name
  if (!name.trim()) return { ok: false, error: 'Name is required' }

  const insertPayload: any = {
    project_id: projectId,
    parent_id: parentId,
    name: name.trim(),
    sort_order: sortOrder,
    created_by: user.id,
  }

  if (initialData?.status) insertPayload.status = initialData.status
  if (initialData?.isWorkPackage !== undefined) insertPayload.is_work_package = initialData.isWorkPackage

  const { data, error } = await supabase
    .from('wbs_elements')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  if (initialData?.isWorkPackage) {
    await recalculateSchedule(projectId)
  }

    // Auto-assign the creator as Responsible so they can edit it
    const { data: stakeholder } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('linked_user_id', user.id)
      .eq('project_id', projectId)
      .single()
      
    if (stakeholder) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      )

      const { error: raciError } = await adminSupabase.from('raci_assignments').insert({
        project_id: projectId,
        wbs_element_id: data.id,
        stakeholder_id: stakeholder.id,
        role_type: 'Responsible'
      })
      if (raciError) console.error("Raci Auto Assign Error:", raciError);
    }

  await logProjectActivity(projectId, 'wbs_element', data.id, 'created', { name: name.trim() })

  await dispatchNotification({
    userId: user.id,
    triggerType: 'assignment',
    referenceEntityType: 'wbs',
    referenceEntityId: data.id,
    projectId,
    contentSummary: `New WBS Task Created: "${name.trim()}"`
  }).catch(err => console.error('Webhook notification failed:', err))

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true, id: data.id }
}

export async function bulkImportWbsElements(
  projectId: string,
  elements: any[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  if (!elements || elements.length === 0) return { ok: true }

  const { error } = await supabase
    .from('wbs_elements')
    .insert(elements)

  if (error) return { ok: false, error: error.message }

  await recalculateSchedule(projectId)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}
