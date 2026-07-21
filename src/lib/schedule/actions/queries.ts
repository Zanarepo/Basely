'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { recalculateSchedule } from './recalculate'
import type { ActionResponse } from './types'

/**
 * Retrieves all schedule data (activities, dependencies, calendars, baselines) for a project.
 */
export async function getScheduleData(projectId: string): Promise<ActionResponse<{
  activities: any[]
  dependencies: any[]
  calendars: any[]
  baselines: any[]
}>> {
  // Trigger automatic recalculation pass (runs WBS auto-heal and CPM engine)
  await recalculateSchedule(projectId)

  const supabase = createAdminClient()

  const { data: activities, error: actErr } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)

  const { data: dependencies, error: depErr } = await supabase
    .from('dependencies')
    .select('*')
    .eq('project_id', projectId)

  const { data: calendars, error: calErr } = await supabase
    .from('project_calendars')
    .select('*')
    .eq('project_id', projectId)

  const { data: baselines, error: baseErr } = await supabase
    .from('baselines')
    .select('*')
    .eq('project_id', projectId)

  if (actErr || depErr || calErr || baseErr) {
    return {
      ok: false,
      error: actErr?.message || depErr?.message || calErr?.message || baseErr?.message || 'Error fetching schedule details',
    }
  }

  const mappedActs = (activities || []).map((a: any) => ({
    id: a.id,
    projectId: a.project_id,
    wbsElementId: a.wbs_element_id,
    name: a.name,
    type: a.type,
    duration: Number(a.duration),
    percentComplete: Number(a.percent_complete),
    constraintType: a.constraint_type,
    constraintDate: a.constraint_date,
    es: a.es,
    ef: a.ef,
    ls: a.ls,
    lf: a.lf,
    totalFloat: a.total_float !== null ? Number(a.total_float) : null,
    freeFloat: a.free_float !== null ? Number(a.free_float) : null,
    isCritical: a.is_critical,
    calendarId: a.calendar_id,
  }))

  const mappedDeps = (dependencies || []).map((d: any) => ({
    id: d.id,
    projectId: d.project_id,
    predecessorId: d.predecessor_id,
    successorId: d.successor_id,
    type: d.type,
    lagDays: Number(d.lag_days),
  }))

  return {
    ok: true,
    data: {
      activities: mappedActs,
      dependencies: mappedDeps,
      calendars: calendars || [],
      baselines: baselines || [],
    },
  }
}
