'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { computeCPM } from '../cpm'
import type { Activity, Dependency, CalendarConfig } from '../cpm'
import type { ActionResponse } from './types'

/**
 * Runs the CPM scheduling engine for the given project,
 * updating all calculated early/late dates and float fields.
 */
export async function recalculateSchedule(projectId: string): Promise<ActionResponse> {
  const supabase = createAdminClient()

  // Fetch project, calendar, activities, wbs elements, and dependencies in parallel
  const [
    { data: project, error: projErr },
    { data: cal },
    { data: dbActs, error: actsErr },
    { data: wbsPkgs, error: wbsErr },
    { data: dbDeps, error: depsErr }
  ] = await Promise.all([
    supabase.from('projects').select('start_date, calendar_config').eq('id', projectId).single(),
    supabase.from('project_calendars').select('working_days, holidays').eq('project_id', projectId).eq('is_default', true).maybeSingle(),
    supabase.from('activities').select('*').eq('project_id', projectId),
    supabase.from('wbs_elements').select('id, name').eq('project_id', projectId).eq('is_work_package', true),
    supabase.from('dependencies').select('*').eq('project_id', projectId)
  ])

  if (projErr || !project) {
    return { ok: false, error: projErr?.message ?? 'Project not found' }
  }

  if (actsErr) {
    return { ok: false, error: actsErr.message }
  }

  if (wbsErr) {
    return { ok: false, error: wbsErr.message }
  }

  if (depsErr) {
    return { ok: false, error: depsErr.message }
  }

  const projectStartDate = project.start_date ?? new Date().toISOString().split('T')[0]!
  
  const workingDays = cal?.working_days ?? (project.calendar_config as any)?.working_days ?? [1, 2, 3, 4, 5]
  const holidays = cal?.holidays ?? []

  const calendarConfig: CalendarConfig = {
    workingDays,
    holidays: holidays.map((h: any) => typeof h === 'string' ? h : new Date(h).toISOString().split('T')[0]!)
  }

  const activeActs = dbActs || []

  // Auto-heal: Ensure all WBS work packages have activities
  const existingWbsIds = new Set(activeActs.map((a) => a.wbs_element_id))
  const missingPkgs = (wbsPkgs ?? []).filter((p) => !existingWbsIds.has(p.id))

  if (missingPkgs.length > 0) {
    const newActs = missingPkgs.map((p) => ({
      project_id: projectId,
      wbs_element_id: p.id,
      name: p.name,
      type: 'Task',
    }))
    const { error: insErr } = await supabase
      .from('activities')
      .insert(newActs)

    if (insErr) {
      return { ok: false, error: insErr.message }
    }

    // Re-fetch activities after auto-healing insertion
    const { data: reActs, error: reErr } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId)
    
    if (reErr) {
      return { ok: false, error: reErr.message }
    }
    
    activeActs.splice(0, activeActs.length, ...(reActs ?? []))
  }

  if (!activeActs || activeActs.length === 0) {
    return { ok: true } // Nothing to calculate
  }

  // Map database structures to CPM model
  const activities: Activity[] = activeActs.map((a: any) => ({
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
    calendarId: a.calendar_id
  }))

  const dependencies: Dependency[] = dbDeps.map((d: any) => ({
    id: d.id,
    projectId: d.project_id,
    predecessorId: d.predecessor_id,
    successorId: d.successor_id,
    type: d.type,
    lagDays: Number(d.lag_days)
  }))

  // 4. Compute schedule early/late parameters
  const cpmResult = computeCPM(activities, dependencies, projectStartDate, calendarConfig)
  if (!cpmResult.ok) {
    return { ok: false, error: cpmResult.error }
  }

  // 5. Bulk update activity parameters in the database
  const updates = cpmResult.activities.map((a) => ({
    id: a.id,
    project_id: a.projectId,
    wbs_element_id: a.wbsElementId,
    name: a.name,
    type: a.type,
    duration: a.duration,
    percent_complete: a.percentComplete,
    constraint_type: a.constraintType,
    constraint_date: a.constraintDate,
    es: a.es,
    ef: a.ef,
    ls: a.ls,
    lf: a.lf,
    total_float: a.totalFloat,
    free_float: a.freeFloat,
    is_critical: a.isCritical,
    calendar_id: a.calendarId
  }))

  const { error: upsertErr } = await supabase
    .from('activities')
    .upsert(updates)

  if (upsertErr) {
    return { ok: false, error: upsertErr.message }
  }

  return { ok: true }
}
