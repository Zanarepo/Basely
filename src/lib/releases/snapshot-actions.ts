'use server'

import { createClient } from '@/utils/supabase/server'

export async function captureSprintSnapshot(projectId: string) {
  try {
    const supabase = await createClient()

    // 1. Get the active sprint for the project
    const { data: activeSprints } = await supabase
      .from('iterations')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .limit(1)
      
    if (!activeSprints || activeSprints.length === 0) return { ok: false, error: 'No active sprint' }
    const activeSprint = activeSprints[0]

    // 2. Check if a snapshot already exists for today
    const { data: existingSnap } = await supabase
      .from('sprint_snapshots')
      .select('id')
      .eq('iteration_id', activeSprint.id)
      .eq('snapshot_date', new Date().toISOString().split('T')[0])
      .limit(1)
      
    if (existingSnap && existingSnap.length > 0) {
      return { ok: true, message: 'Snapshot already exists for today' }
    }

    // 3. Fetch WBS items and Activities linked to this sprint
    const { data: taggedWbs } = await supabase
      .from('wbs_elements')
      .select('id, status')
      .eq('iteration_id', activeSprint.id)

    const { data: taggedActs } = await supabase
      .from('activities')
      .select('id, status')
      .eq('iteration_id', activeSprint.id)

    const allItems = [...(taggedWbs || []), ...(taggedActs || [])]
    const totalItems = allItems.length
    
    if (totalItems === 0) return { ok: true, message: 'No items in sprint to snapshot' }

    const isCompletedStatus = (s?: string | null) => s ? ['complete', 'completed', 'done', 'closed', 'finished'].includes(s.trim().toLowerCase()) : false
    const isInProgressStatus = (s?: string | null) => s ? ['in progress', 'in_progress', 'active', 'doing', 'started'].includes(s.trim().toLowerCase()) : false

    const completedCount = allItems.filter(i => isCompletedStatus(i.status)).length
    const inProgressCount = allItems.filter(i => isInProgressStatus(i.status)).length
    const plannedCount = Math.max(0, totalItems - completedCount - inProgressCount)

    // 4. Insert Snapshot
    const { error: insertError } = await supabase
      .from('sprint_snapshots')
      .insert({
        iteration_id: activeSprint.id,
        project_id: projectId,
        total_items: totalItems,
        completed_items: completedCount,
        in_progress_items: inProgressCount,
        planned_items: plannedCount,
        snapshot_date: new Date().toISOString().split('T')[0]
      })

    if (insertError) throw insertError

    return { ok: true, message: 'Snapshot captured successfully' }
  } catch (error: any) {
    console.error('Error capturing sprint snapshot:', error)
    return { ok: false, error: error.message }
  }
}
