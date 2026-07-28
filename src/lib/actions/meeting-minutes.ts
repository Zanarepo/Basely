'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMeetingMinute(
  projectId: string,
  data: {
    meeting_date: string
    attendee_stakeholder_ids: string[]
    discussion_notes?: string
    decisions?: any[]
  }
) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('meeting_minutes')
    .insert({
      project_id: projectId,
      meeting_date: data.meeting_date,
      attendee_stakeholder_ids: data.attendee_stakeholder_ids,
      discussion_notes: data.discussion_notes || null,
      decisions: data.decisions || []
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating meeting minute:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, data: result }
}

export async function updateMeetingMinute(
  id: string,
  projectId: string,
  data: {
    meeting_date?: string
    attendee_stakeholder_ids?: string[]
    discussion_notes?: string
    decisions?: any[]
  }
) {
  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('meeting_minutes')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating meeting minute:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, data: result }
}

export async function deleteMeetingMinute(id: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('meeting_minutes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting meeting minute:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
