'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeCPM } from './cpm'
import type { Activity, Dependency, CalendarConfig } from './cpm'

export type ActionResponse<T = any> = 
  | { ok: true; data?: T }
  | { ok: false; error: string }

/**
 * Runs the CPM scheduling engine for the given project,
 * updating all calculated early/late dates and float fields.
 */
export async function recalculateSchedule(projectId: string): Promise<ActionResponse> {
  const supabase = await createClient()

  // 1. Fetch project details for start date & calendar config
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('start_date, calendar_config')
    .eq('id', projectId)
    .single()

  if (projErr || !project) {
    return { ok: false, error: projErr?.message ?? 'Project not found' }
  }

  const projectStartDate = project.start_date ?? new Date().toISOString().split('T')[0]!
  
  // 2. Fetch the project calendar (fallback to default project config)
  const { data: cal } = await supabase
    .from('project_calendars')
    .select('working_days, holidays')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .maybeSingle()

  const workingDays = cal?.working_days ?? (project.calendar_config as any)?.working_days ?? [1, 2, 3, 4, 5]
  const holidays = cal?.holidays ?? []

  const calendarConfig: CalendarConfig = {
    workingDays,
    holidays: holidays.map((h: any) => typeof h === 'string' ? h : new Date(h).toISOString().split('T')[0]!)
  }

  // 3. Fetch activities and dependencies
  const { data: dbActs, error: actsErr } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)

  if (actsErr) {
    return { ok: false, error: actsErr.message }
  }

  // Auto-heal: Ensure all WBS work packages have activities
  const { data: wbsPkgs, error: wbsErr } = await supabase
    .from('wbs_elements')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('is_work_package', true)

  if (wbsErr) {
    return { ok: false, error: wbsErr.message }
  }

  const existingWbsIds = new Set((dbActs || []).map((a) => a.wbs_element_id))
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
    
    dbActs.splice(0, dbActs.length, ...(reActs ?? []))
  }

  const { data: dbDeps, error: depsErr } = await supabase
    .from('dependencies')
    .select('*')
    .eq('project_id', projectId)

  if (depsErr) {
    return { ok: false, error: depsErr.message }
  }

  if (!dbActs || dbActs.length === 0) {
    return { ok: true } // Nothing to calculate
  }

  // Map database structures to CPM model
  const activities: Activity[] = dbActs.map((a: any) => ({
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

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/**
 * Creates an activity dependency record.
 * Automatically cycle checks and rolls back if a loop is detected.
 */
export async function createDependency(
  projectId: string,
  predecessorId: string,
  successorId: string,
  type: 'FS' | 'SS' | 'FF' | 'SF' = 'FS',
  lagDays: number = 0
): Promise<ActionResponse> {
  const supabase = await createClient()

  // Insert dependency record
  const { data: dep, error: insertErr } = await supabase
    .from('dependencies')
    .insert({
      project_id: projectId,
      predecessor_id: predecessorId,
      successor_id: successorId,
      type,
      lag_days: lagDays
    })
    .select('id')
    .single()

  if (insertErr || !dep) {
    return { ok: false, error: insertErr?.message ?? 'Could not create dependency' }
  }

  // Recalculate schedule to check for cycles
  const recalcResult = await recalculateSchedule(projectId)
  
  if (!recalcResult.ok) {
    // Cycle detected or other error -> Rollback dependency creation
    await supabase
      .from('dependencies')
      .delete()
      .eq('id', dep.id)
    
    return { ok: false, error: recalcResult.error }
  }

  return { ok: true }
}

/**
 * Deletes a dependency and updates dates.
 */
export async function deleteDependency(projectId: string, dependencyId: string): Promise<ActionResponse> {
  const supabase = await createClient()

  const { error: delErr } = await supabase
    .from('dependencies')
    .delete()
    .eq('id', dependencyId)

  if (delErr) {
    return { ok: false, error: delErr.message }
  }

  return recalculateSchedule(projectId)
}

/**
 * Updates an activity's duration and recalculates schedule.
 */
export async function updateActivityDuration(
  projectId: string,
  activityId: string,
  duration: number
): Promise<ActionResponse> {
  const supabase = await createClient()

  const { error: updErr } = await supabase
    .from('activities')
    .update({ duration, updated_at: new Date().toISOString() })
    .eq('id', activityId)

  if (updErr) {
    return { ok: false, error: updErr.message }
  }

  return recalculateSchedule(projectId)
}

/**
 * Updates an activity's constraint settings and recalculates schedule.
 */
export async function updateActivityConstraint(
  projectId: string,
  activityId: string,
  constraintType: 'ASAP' | 'Must Start On' | 'Must Finish On' | 'Start No Earlier Than' | 'Finish No Later Than',
  constraintDate: string | null
): Promise<ActionResponse> {
  const supabase = await createClient()

  const { error: updErr } = await supabase
    .from('activities')
    .update({ 
      constraint_type: constraintType, 
      constraint_date: constraintDate, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', activityId)

  if (updErr) {
    return { ok: false, error: updErr.message }
  }

  return recalculateSchedule(projectId)
}

/**
 * Freezes the current schedule dates as a named baseline.
 */
export async function saveBaseline(projectId: string, name: string): Promise<ActionResponse> {
  const supabase = await createClient()

  // 1. Create baseline record
  const { data: bLine, error: baseErr } = await supabase
    .from('baselines')
    .insert({ project_id: projectId, name })
    .select('id')
    .single()

  if (baseErr || !bLine) {
    return { ok: false, error: baseErr?.message ?? 'Could not create baseline record' }
  }

  // 2. Fetch current activities
  const { data: acts } = await supabase
    .from('activities')
    .select('id, es, ef, duration')
    .eq('project_id', projectId)

  if (!acts || acts.length === 0) {
    return { ok: true }
  }

  // 3. Save snapshots
  const snapshots = acts.map(a => ({
    baseline_id: bLine.id,
    activity_id: a.id,
    baseline_start: a.es,
    baseline_finish: a.ef,
    baseline_duration: Number(a.duration)
  }))

  const { error: snapErr } = await supabase
    .from('baseline_activity_snapshots')
    .insert(snapshots)

  if (snapErr) {
    return { ok: false, error: snapErr.message }
  }

  return { ok: true }
}

/**
 * Fetches the variance between the current schedule and a baseline.
 */
export async function getScheduleVariance(projectId: string, baselineId: string): Promise<ActionResponse> {
  const supabase = await createClient()

  const { data: snaps, error: snapErr } = await supabase
    .from('baseline_activity_snapshots')
    .select('*')
    .eq('baseline_id', baselineId)

  if (snapErr) {
    return { ok: false, error: snapErr.message }
  }

  return { ok: true, data: snaps }
}

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

  const supabase = await createClient()

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

/**
 * Updates scheduling attributes (duration, constraints) and predecessor dependencies in a single pass.
 */
export async function updateActivityScheduling(
  projectId: string,
  activityId: string,
  updates: {
    duration: number
    constraintType: 'ASAP' | 'Must Start On' | 'Must Finish On' | 'Start No Earlier Than' | 'Finish No Later Than'
    constraintDate: string | null
    predecessors: { predecessorId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }[]
  }
): Promise<ActionResponse> {
  const supabase = await createClient()

  // 1. Update activity fields
  const { error: actErr } = await supabase
    .from('activities')
    .update({
      duration: updates.duration,
      constraint_type: updates.constraintType,
      constraint_date: updates.constraintDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)

  if (actErr) {
    return { ok: false, error: actErr.message }
  }

  // 2. Fetch current predecessors to support rollback if cycle calculation fails
  const { data: oldDeps } = await supabase
    .from('dependencies')
    .select('*')
    .eq('successor_id', activityId)

  // Delete existing predecessors
  const { error: delErr } = await supabase
    .from('dependencies')
    .delete()
    .eq('successor_id', activityId)

  if (delErr) {
    return { ok: false, error: delErr.message }
  }

  // Insert new predecessors
  if (updates.predecessors.length > 0) {
    const insertData = updates.predecessors.map((p) => ({
      project_id: projectId,
      predecessor_id: p.predecessorId,
      successor_id: activityId,
      type: p.type,
      lag_days: p.lagDays,
    }))

    const { error: insErr } = await supabase
      .from('dependencies')
      .insert(insertData)

    if (insErr) {
      // Rollback deletions
      if (oldDeps && oldDeps.length > 0) {
        await supabase.from('dependencies').insert(oldDeps.map(o => ({
          project_id: o.project_id,
          predecessor_id: o.predecessor_id,
          successor_id: o.successor_id,
          type: o.type,
          lag_days: o.lag_days
        })))
      }
      return { ok: false, error: insErr.message }
    }
  }

  // 3. Trigger recalculation
  const recalcRes = await recalculateSchedule(projectId)
  
  if (!recalcRes.ok) {
    // Rollback dependency updates if cycle or calculation error is encountered
    await supabase.from('dependencies').delete().eq('successor_id', activityId)
    if (oldDeps && oldDeps.length > 0) {
      await supabase.from('dependencies').insert(oldDeps.map(o => ({
        project_id: o.project_id,
        predecessor_id: o.predecessor_id,
        successor_id: o.successor_id,
        type: o.type,
        lag_days: o.lag_days
      })))
    }
    // Re-run recalculation with original state to recover
    await recalculateSchedule(projectId)
    
    return { ok: false, error: recalcRes.error }
  }

  return { ok: true }
}


