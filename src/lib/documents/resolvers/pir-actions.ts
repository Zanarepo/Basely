'use server'

import { createClient } from '@/utils/supabase/server'

export async function lockPIRSchedule(projectId: string, targetDateIso: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update({ 
      pir_scheduled_date: targetDateIso,
      pir_notified: false
    })
    .eq('id', projectId)

  if (error) {
    console.error('Failed to lock PIR schedule:', error)
    throw new Error('Failed to lock PIR schedule: ' + error.message)
  }

  return { success: true, scheduledDate: targetDateIso }
}

export async function getPIRSchedule(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('pir_scheduled_date, pir_notified')
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // not found is ok
      console.error('Failed to fetch PIR schedule:', error)
    }
    return null
  }

  return data
}
