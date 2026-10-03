import { updateActivityDuration, updateActivityConstraint } from '@/lib/schedule/actions/activities'
import { createDependency, deleteDependency } from '@/lib/schedule/actions/dependencies'
import { computeCPM, type Activity, type Dependency, type CalendarConfig } from '@/lib/schedule/cpm'
import type { HudMessage } from './useScheduleData'

type ScheduleActionsDeps = {
  projectId: string
  activities: Activity[]
  setActivities: (acts: Activity[]) => void
  dependencies: Dependency[]
  setDependencies: (deps: Dependency[]) => void
  timelineStart: string
  showHud: (text: string, type: NonNullable<HudMessage>['type'], autoHideMs?: number) => void
  fetchData: (showHud?: boolean) => Promise<void>
}

const DEFAULT_CALENDAR: CalendarConfig = { workingDays: [1, 2, 3, 4, 5], holidays: [] }

/**
 * Provides optimistic CPM handlers for move, resize, and dependency operations.
 */
export function useScheduleActions({
  projectId,
  activities,
  setActivities,
  dependencies,
  setDependencies,
  timelineStart,
  showHud,
  fetchData,
}: ScheduleActionsDeps) {

  const handleMoveActivity = async (id: string, deltaDays: number): Promise<boolean> => {
    try {
      const act = activities.find((a) => a.id === id)
      if (!act || !act.es) return false

      // Calculate new start date using UTC date arithmetic
      const cleanEs = act.es.split('T')[0]!.split(' ')[0]!
      const esParts = cleanEs.split('-').map(Number)
      if (esParts.length < 3 || esParts.some(isNaN)) return false

      const [sy, sm, sd] = esParts
      const targetEsDate = new Date(Date.UTC(sy!, sm! - 1, sd! + deltaDays))
      const newEsStr = targetEsDate.toISOString().split('T')[0]!

      // Optimistic local CPM recalculation for INSTANT UI update
      const updatedActs = activities.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            constraintType: 'Must Start On' as const,
            constraintDate: newEsStr,
            es: newEsStr,
          }
        }
        return a
      })

      const projectStart = timelineStart || newEsStr
      const cpmResult = computeCPM(updatedActs, dependencies, projectStart, DEFAULT_CALENDAR)

      if (cpmResult.ok) {
        setActivities(cpmResult.activities)
      }

      // Persist to server in background
      showHud('Saving schedule changes...', 'info', 2000)
      const res = await updateActivityConstraint(projectId, id, 'Must Start On', newEsStr)
      if (!res.ok) {
        await fetchData(false)
        throw new Error(res.error)
      }

      showHud('Schedule updated successfully!', 'success', 2500)
      return true
    } catch (err: any) {
      showHud(err.message, 'error')
      return false
    }
  }

  const handleResizeActivity = async (id: string, newDuration: number): Promise<boolean> => {
    try {
      const act = activities.find((a) => a.id === id)
      if (!act) return false

      // Optimistic local CPM recalculation for INSTANT UI update
      const updatedActs = activities.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            duration: newDuration,
            type: (newDuration === 0 ? 'Milestone' : 'Task') as any,
          }
        }
        return a
      })

      const projectStart = timelineStart || new Date().toISOString().split('T')[0]!
      const cpmResult = computeCPM(updatedActs, dependencies, projectStart, DEFAULT_CALENDAR)

      if (cpmResult.ok) {
        setActivities(cpmResult.activities)
      }

      // Persist to server in background
      showHud('Saving duration changes...', 'info', 2000)
      const res = await updateActivityDuration(projectId, id, newDuration)
      if (!res.ok) {
        await fetchData(false)
        throw new Error(res.error)
      }

      showHud('Duration updated successfully!', 'success', 2500)
      return true
    } catch (err: any) {
      showHud(err.message, 'error')
      return false
    }
  }

  const handleCreateDependency = async (predId: string, succId: string): Promise<boolean> => {
    try {
      if (predId === succId) return false

      const existing = dependencies.find(d => d.predecessorId === predId && d.successorId === succId)
      if (existing) return true

      const tempId = `temp_dep_${Date.now()}`
      const newDep: Dependency = {
        id: tempId,
        projectId,
        predecessorId: predId,
        successorId: succId,
        type: 'FS',
        lagDays: 0,
      }

      const updatedDeps = [...dependencies, newDep]
      const projectStart = timelineStart || new Date().toISOString().split('T')[0]!
      const cpmResult = computeCPM(activities, updatedDeps, projectStart, DEFAULT_CALENDAR)

      if (!cpmResult.ok) {
        showHud(cpmResult.error, 'error', 4000)
        return false
      }

      // Optimistic local update INSTANTLY
      setDependencies(updatedDeps)
      setActivities(cpmResult.activities)

      // Persist to server in background
      showHud('Adding dependency link...', 'info', 2000)
      const res = await createDependency(projectId, predId, succId, 'FS', 0)
      if (!res.ok) {
        await fetchData(false)
        throw new Error(res.error)
      }

      showHud('Dependency link established!', 'success', 2500)
      return true
    } catch (err: any) {
      showHud(err.message, 'error')
      return false
    }
  }

  const handleDeleteDependency = async (depId: string): Promise<boolean> => {
    try {
      const updatedDeps = dependencies.filter((d) => d.id !== depId)
      const projectStart = timelineStart || new Date().toISOString().split('T')[0]!
      const cpmResult = computeCPM(activities, updatedDeps, projectStart, DEFAULT_CALENDAR)

      if (cpmResult.ok) {
        setDependencies(updatedDeps)
        setActivities(cpmResult.activities)
      }

      // Persist to server in background
      showHud('Removing dependency link...', 'info', 2000)
      const res = await deleteDependency(projectId, depId)
      if (!res.ok) {
        await fetchData(false)
        throw new Error(res.error)
      }

      showHud('Dependency link removed!', 'success', 2500)
      return true
    } catch (err: any) {
      showHud(err.message, 'error')
      return false
    }
  }

  return {
    handleMoveActivity,
    handleResizeActivity,
    handleCreateDependency,
    handleDeleteDependency,
  }
}
