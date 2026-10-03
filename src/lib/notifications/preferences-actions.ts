'use server'

import { createClient } from '@/utils/supabase/server'
import { NotificationPreferences } from './types'

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  // Ensure row exists
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Create default row
    const { data: newData, error: insertError } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userData.user.id,
        email_enabled: true,
        slack_enabled: false
      })
      .select('*')
      .single()

    if (!insertError) return newData as NotificationPreferences
  }

  return data as NotificationPreferences
}

export async function updateNotificationPreferences(emailEnabled: boolean, slackEnabled: boolean) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return false

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userData.user.id,
      email_enabled: emailEnabled,
      slack_enabled: slackEnabled
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating preferences:', error)
    return false
  }
  return true
}
