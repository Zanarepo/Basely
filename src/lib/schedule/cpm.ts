export type Activity = {
  id: string
  projectId: string
  wbsElementId: string
  name: string
  type: 'Task' | 'Milestone' | 'Summary'
  duration: number
  percentComplete: number
  constraintType: 'ASAP' | 'Must Start On' | 'Must Finish On' | 'Start No Earlier Than' | 'Finish No Later Than'
  constraintDate: string | null
  es: string | null
  ef: string | null
  ls: string | null
  lf: string | null
  totalFloat: number | null
  freeFloat: number | null
  isCritical: boolean
  calendarId: string | null
}

export type Dependency = {
  id: string
  projectId: string
  predecessorId: string
  successorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

export type CalendarConfig = {
  workingDays: number[]
  holidays: string[]
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!
}

export function isWorkDay(date: Date, calendar: CalendarConfig): boolean {
  const day = date.getUTCDay()
  const dateStr = formatDate(date)
  if (calendar.holidays.includes(dateStr)) return false
  return calendar.workingDays.includes(day)
}

export function getNextWorkingDay(dateStr: string, calendar: CalendarConfig): string {
  let date = parseDate(dateStr)
  do {
    date.setUTCDate(date.getUTCDate() + 1)
  } while (!isWorkDay(date, calendar))
  return formatDate(date)
}

export function getPrevWorkingDay(dateStr: string, calendar: CalendarConfig): string {
  let date = parseDate(dateStr)
  do {
    date.setUTCDate(date.getUTCDate() - 1)
  } while (!isWorkDay(date, calendar))
  return formatDate(date)
}

export function addWorkingDaysOffset(startDateStr: string, offset: number, calendar: CalendarConfig): string {
  let date = parseDate(startDateStr)
  while (!isWorkDay(date, calendar)) {
    date.setUTCDate(date.getUTCDate() + 1)
  }
  
  let curr = formatDate(date)
  for (let i = 0; i < offset; i++) {
    curr = getNextWorkingDay(curr, calendar)
  }
  return curr
}

export function subtractWorkingDaysOffset(finishDateStr: string, offset: number, calendar: CalendarConfig): string {
  let date = parseDate(finishDateStr)
  while (!isWorkDay(date, calendar)) {
    date.setUTCDate(date.getUTCDate() - 1)
  }
  
  let curr = formatDate(date)
  for (let i = 0; i < offset; i++) {
    curr = getPrevWorkingDay(curr, calendar)
  }
  return curr
}

export function calculateFinishDate(startDateStr: string, duration: number, calendar: CalendarConfig): string {
  if (duration <= 1) {
    let date = parseDate(startDateStr)
    while (!isWorkDay(date, calendar)) {
      date.setUTCDate(date.getUTCDate() + 1)
    }
    return formatDate(date)
  }
  return addWorkingDaysOffset(startDateStr, duration - 1, calendar)
}

export function calculateStartDate(finishDateStr: string, duration: number, calendar: CalendarConfig): string {
  if (duration <= 1) {
    let date = parseDate(finishDateStr)
    while (!isWorkDay(date, calendar)) {
      date.setUTCDate(date.getUTCDate() - 1)
    }
    return formatDate(date)
  }
  return subtractWorkingDaysOffset(finishDateStr, duration - 1, calendar)
}

export function countWorkingDays(s1: string, s2: string, calendar: CalendarConfig): number {
  let d1 = parseDate(s1)
  const d2 = parseDate(s2)
  if (d1.getTime() > d2.getTime()) return -countWorkingDays(s2, s1, calendar)
  
  let count = 0
  while (d1.getTime() < d2.getTime()) {
    if (isWorkDay(d1, calendar)) {
      count++
    }
    d1.setUTCDate(d1.getUTCDate() + 1)
  }
  return count
}

export function computeCPM(
  activities: Activity[],
  dependencies: Dependency[],
  projectStartDate: string,
  calendar: CalendarConfig
): { activities: Activity[]; ok: true } | { error: string; ok: false } {
  const adj = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  const activityMap = new Map<string, Activity>()
  
  activities.forEach(a => {
    adj.set(a.id, [])
    inDegree.set(a.id, 0)
    activityMap.set(a.id, JSON.parse(JSON.stringify(a)))
  })
  
  for (const dep of dependencies) {
    if (!activityMap.has(dep.predecessorId) || !activityMap.has(dep.successorId)) {
      continue
    }
    adj.get(dep.predecessorId)!.push(dep.successorId)
    inDegree.set(dep.successorId, inDegree.get(dep.successorId)! + 1)
  }
  
  // Cycle Detection (DFS)
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const path: string[] = []
  
  function detectCycle(nodeId: string): string[] | null {
    visited.add(nodeId)
    recStack.add(nodeId)
    path.push(nodeId)
    
    for (const neighbor of adj.get(nodeId) ?? []) {
      if (!visited.has(neighbor)) {
        const cycle = detectCycle(neighbor)
        if (cycle) return cycle
      } else if (recStack.has(neighbor)) {
        const startIndex = path.indexOf(neighbor)
        return [...path.slice(startIndex), neighbor]
      }
    }
    
    recStack.delete(nodeId)
    path.pop()
    return null
  }
  
  for (const a of activities) {
    if (!visited.has(a.id)) {
      const cycle = detectCycle(a.id)
      if (cycle) {
        const names = cycle.map(id => activityMap.get(id)?.name ?? id).join(' → ')
        return { ok: false, error: `Circular dependency detected: ${names}` }
      }
    }
  }
  
  // Topological Sort
  const queue: string[] = []
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id)
  })
  
  const topoOrder: string[] = []
  while (queue.length > 0) {
    const curr = queue.shift()!
    topoOrder.push(curr)
    
    for (const neighbor of adj.get(curr) ?? []) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor)
      }
    }
  }
  
  if (topoOrder.length !== activities.length) {
    return { ok: false, error: 'Unresolved cycle exists in schedule activities.' }
  }
  
  // Predecessors map
  const incoming = new Map<string, { predecessorId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }[]>()
  activities.forEach(a => incoming.set(a.id, []))
  for (const dep of dependencies) {
    if (incoming.has(dep.successorId)) {
      incoming.get(dep.successorId)!.push({
        predecessorId: dep.predecessorId,
        type: dep.type,
        lagDays: dep.lagDays
      })
    }
  }
  
  // Align project start
  let projectStart = parseDate(projectStartDate)
  while (!isWorkDay(projectStart, calendar)) {
    projectStart.setUTCDate(projectStart.getUTCDate() + 1)
  }
  const projectStartStr = formatDate(projectStart)
  
  // Forward Pass
  for (const id of topoOrder) {
    const act = activityMap.get(id)!
    const preds = incoming.get(id) ?? []
    
    let earlyStart = projectStartStr
    
    if (preds.length > 0) {
      let maxStartStr = projectStartStr
      
      for (const dep of preds) {
        const pred = activityMap.get(dep.predecessorId)!
        let possibleStart = projectStartStr
        
        if (dep.type === 'FS') {
          possibleStart = addWorkingDaysOffset(pred.ef!, 1 + dep.lagDays, calendar)
        } else if (dep.type === 'SS') {
          possibleStart = addWorkingDaysOffset(pred.es!, dep.lagDays, calendar)
        } else if (dep.type === 'FF') {
          const earlyFinish = addWorkingDaysOffset(pred.ef!, dep.lagDays, calendar)
          possibleStart = calculateStartDate(earlyFinish, act.duration, calendar)
        } else if (dep.type === 'SF') {
          const earlyFinish = addWorkingDaysOffset(pred.es!, dep.lagDays, calendar)
          possibleStart = calculateStartDate(earlyFinish, act.duration, calendar)
        }
        
        const d1 = parseDate(possibleStart)
        const d2 = parseDate(maxStartStr)
        if (d1.getTime() > d2.getTime()) {
          maxStartStr = possibleStart
        }
      }
      earlyStart = maxStartStr
    }
    
    if (act.constraintType === 'Must Start On' && act.constraintDate) {
      earlyStart = act.constraintDate
    } else if (act.constraintType === 'Start No Earlier Than' && act.constraintDate) {
      const d1 = parseDate(earlyStart)
      const d2 = parseDate(act.constraintDate)
      if (d2.getTime() > d1.getTime()) {
        earlyStart = act.constraintDate
      }
    }
    
    act.es = earlyStart
    act.ef = calculateFinishDate(earlyStart, act.duration, calendar)
    
    if (act.constraintType === 'Must Finish On' && act.constraintDate) {
      act.ef = act.constraintDate
      act.es = calculateStartDate(act.ef, act.duration, calendar)
    }
  }
  
  // Successors map
  const outgoing = new Map<string, { successorId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }[]>()
  activities.forEach(a => outgoing.set(a.id, []))
  for (const dep of dependencies) {
    if (outgoing.has(dep.predecessorId)) {
      outgoing.get(dep.predecessorId)!.push({
        successorId: dep.successorId,
        type: dep.type,
        lagDays: dep.lagDays
      })
    }
  }
  
  // Project finish
  let projectFinishStr = projectStartStr
  for (const act of activityMap.values()) {
    if (act.ef) {
      const d1 = parseDate(act.ef)
      const d2 = parseDate(projectFinishStr)
      if (d1.getTime() > d2.getTime()) {
        projectFinishStr = act.ef
      }
    }
  }
  
  // Backward Pass
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i]!
    const act = activityMap.get(id)!
    const succs = outgoing.get(id) ?? []
    
    let lateFinish = projectFinishStr
    
    if (succs.length > 0) {
      let minFinishStr = '9999-12-31'
      
      for (const dep of succs) {
        const succ = activityMap.get(dep.successorId)!
        let possibleFinish = projectFinishStr
        
        if (dep.type === 'FS') {
          possibleFinish = subtractWorkingDaysOffset(succ.ls!, 1 + dep.lagDays, calendar)
        } else if (dep.type === 'SS') {
          const ls = subtractWorkingDaysOffset(succ.ls!, dep.lagDays, calendar)
          possibleFinish = calculateFinishDate(ls, act.duration, calendar)
        } else if (dep.type === 'FF') {
          possibleFinish = subtractWorkingDaysOffset(succ.lf!, dep.lagDays, calendar)
        } else if (dep.type === 'SF') {
          const ls = subtractWorkingDaysOffset(succ.lf!, dep.lagDays, calendar)
          possibleFinish = calculateFinishDate(ls, act.duration, calendar)
        }
        
        const d1 = parseDate(possibleFinish)
        const d2 = parseDate(minFinishStr)
        if (d1.getTime() < d2.getTime()) {
          minFinishStr = possibleFinish
        }
      }
      lateFinish = minFinishStr
    }
    
    if (act.constraintType === 'Must Finish On' && act.constraintDate) {
      lateFinish = act.constraintDate
    } else if (act.constraintType === 'Finish No Later Than' && act.constraintDate) {
      const d1 = parseDate(lateFinish)
      const d2 = parseDate(act.constraintDate)
      if (d2.getTime() < d1.getTime()) {
        lateFinish = act.constraintDate
      }
    } else if (act.constraintType === 'Must Start On' && act.constraintDate) {
      const ls = act.constraintDate
      lateFinish = calculateFinishDate(ls, act.duration, calendar)
    }
    
    act.lf = lateFinish
    act.ls = calculateStartDate(lateFinish, act.duration, calendar)
  }
  
  // Float & Critical Path
  for (const act of activityMap.values()) {
    act.totalFloat = countWorkingDays(act.es!, act.ls!, calendar)
    
    let minFreeFloat = 9999
    const successors = outgoing.get(act.id) ?? []
    if (successors.length === 0) {
      act.freeFloat = act.totalFloat
    } else {
      for (const dep of successors) {
        const succ = activityMap.get(dep.successorId)!
        if (dep.type === 'FS') {
          const gap = countWorkingDays(act.ef!, succ.es!, calendar) - 1 - dep.lagDays
          if (gap < minFreeFloat) minFreeFloat = gap
        } else {
          minFreeFloat = 0
        }
      }
      act.freeFloat = Math.max(0, minFreeFloat === 9999 ? 0 : minFreeFloat)
    }
    
    act.isCritical = act.totalFloat <= 0
  }
  
  return { ok: true, activities: Array.from(activityMap.values()) }
}
