'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBackofficeNotifications() {
  const supabase = await createClient()
  
  // We rely on RLS to only fetch notifications for the current internal_staff
  const { data, error } = await supabase
    .from('backoffice_notifications')
    .select(`
      id,
      type,
      title,
      message,
      is_read,
      created_at,
      organization_id,
      organizations ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to fetch backoffice notifications:', error)
    return []
  }

  return data
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('backoffice_notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/backoffice', 'layout')
  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('backoffice_notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  if (error) {
    console.error('Failed to mark all notifications as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/backoffice', 'layout')
  return { success: true }
}
