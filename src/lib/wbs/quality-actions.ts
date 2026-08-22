'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitQualitySignoff(
  projectId: string,
  wbsElementId: string,
  checksStatus: { key: string; status: 'met' | 'na'; reason?: string }[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('wbs_quality_signoffs')
    .upsert({
      wbs_element_id: wbsElementId,
      signed_off_by: user.id,
      checks_status: checksStatus,
      signed_off_at: new Date().toISOString()
    }, { onConflict: 'wbs_element_id' })

  if (error) {
    console.error('submitQualitySignoff error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function raiseQualityException(
  projectId: string,
  wbsElementId: string,
  exceptionDetails: string
): Promise<{ ok: boolean; error?: string }> {
  console.log('raiseQualityException START', { projectId, wbsElementId, exceptionDetails })
  try {
    const supabase = await createClient()
    console.log('raiseQualityException: createClient done')
    const { data: { user } } = await supabase.auth.getUser()
    console.log('raiseQualityException: getUser done', user?.id)

    if (!user) return { ok: false, error: 'Unauthorized' }

    // 1. Get WBS Element details
    console.log('raiseQualityException: fetching wbs element')
    const { data: wbsData } = await supabase.from('wbs_elements').select('name, code').eq('id', wbsElementId).single()
    console.log('raiseQualityException: wbs element fetched', wbsData)
    
    // 2. Create RAID log entry and 3. Mark the task as 'In Review' concurrently
    console.log('raiseQualityException: inserting raid entry and updating status')
    
    const raidInsertPromise = supabase
      .from('raid_log_entries')
      .insert({
        project_id: projectId,
        category: 'issue',
        title: `Quality Exception: ${wbsData?.code || ''} ${wbsData?.name || 'WBS Element'}`.trim(),
        description: exceptionDetails,
        status: 'open',
        priority: 'high',
        impact_rating: 4,
        linked_wbs_element_id: wbsElementId,
        created_by: user.id
      }).select()

    const wbsUpdatePromise = supabase.from('wbs_elements').update({ status: 'In Review' }).eq('id', wbsElementId)

    const [raidRes, updateRes] = await Promise.all([raidInsertPromise, wbsUpdatePromise])
    
    console.log('raiseQualityException: raid insert and status update done')

    if (raidRes.error) {
      console.error('raiseQualityException RAID error:', raidRes.error)
      return { ok: false, error: raidRes.error.message }
    }

    // Fire revalidation — don't block the response
    try { revalidatePath(`/dashboard/projects/${projectId}`) } catch {}
    return { ok: true }
  } catch (error: any) {
    console.error('raiseQualityException UNHANDLED ERROR:', error)
    return { ok: false, error: error.message || 'Internal Server Error' }
  }
}
