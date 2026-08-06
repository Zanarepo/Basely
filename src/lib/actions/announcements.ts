'use server'

import { createClient } from '@/utils/supabase/server'
import { Announcement } from '@/components/common/GlobalBanner'

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const supabase = await createClient()
  
  // We can just use the anon client for reading active announcements since they are public
  const { data, error } = await supabase
    .from('system_announcements')
    .select('id, message, type, link_url')
    .eq('is_active', true)
    // .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  
  return data as Announcement
}
