'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity, type ActivityEntityType } from '@/lib/projects/activity-actions'

export type AttachmentSourceType = 'local' | 'google_drive' | 'sharepoint'

export interface Attachment {
  id: string
  project_id: string
  entity_type: string
  entity_id: string
  file_name: string
  source_type: AttachmentSourceType
  external_reference?: string
  external_url?: string
  file_path?: string
  file_size?: number
  mime_type?: string
  uploaded_by_user_id: string
  created_at: string
  updated_at: string
  uploader?: {
    full_name: string
    avatar_url?: string
  }
}

export async function getAttachments(projectId: string, entityType: string, entityId: string): Promise<Attachment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attachments')
    .select(`
      *,
      uploader:profiles!uploaded_by_user_id ( full_name, avatar_url )
    `)
    .eq('project_id', projectId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get attachments:', error)
    return []
  }

  return data as Attachment[]
}

export async function addAttachment(
  projectId: string,
  entityType: ActivityEntityType,
  entityId: string,
  attachmentData: {
    file_name: string
    source_type: AttachmentSourceType
    external_reference?: string
    external_url?: string
    file_path?: string
    file_size?: number
    mime_type?: string
  }
): Promise<{ ok: boolean; error?: string; data?: Attachment }> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { ok: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      uploaded_by_user_id: userData.user.id,
      ...attachmentData
    })
    .select(`
      *,
      uploader:profiles!uploaded_by_user_id ( full_name, avatar_url )
    `)
    .single()

  if (error) {
    console.error('Failed to add attachment:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, entityType, entityId, 'uploaded', {
    file_name: attachmentData.file_name,
    source_type: attachmentData.source_type
  })

  // Revalidate to ensure server components update
  revalidatePath(`/dashboard/projects/${projectId}`)

  return { ok: true, data: data as Attachment }
}

export async function deleteAttachment(
  projectId: string,
  attachmentId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify ownership or admin handled by RLS, we just execute delete
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) {
    console.error('Failed to delete attachment:', error)
    return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
