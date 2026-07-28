'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createActionItem(
  projectId: string,
  data: {
    description: string
    owner_stakeholder_id?: string
    due_date?: string
    status?: 'open' | 'in_progress' | 'done'
    source_meeting_minutes_id?: string
  }
) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('action_items')
    .insert({
      project_id: projectId,
      description: data.description,
      owner_stakeholder_id: data.owner_stakeholder_id || null,
      due_date: data.due_date || null,
      status: data.status || 'open',
      source_meeting_minutes_id: data.source_meeting_minutes_id || null
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating action item:', error)
    return { success: false, error: error.message }
  }

  // TODO: Trigger notification if assigned (fast-follow or within Collaboration Layer)

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, data: result }
}

export async function updateActionItem(
  id: string,
  projectId: string,
  data: {
    description?: string
    owner_stakeholder_id?: string
    due_date?: string
    status?: 'open' | 'in_progress' | 'done'
  }
) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('action_items')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating action item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, data: result }
}

export async function deleteActionItem(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('action_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting action item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
