import { computeCPM } from './cpm'
import type { Activity, Dependency, CalendarConfig } from './cpm'

// Assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Mock Activity builder to maintain 100% type safety
function createMockActivity(overrides: Partial<Activity> & { id: string; name: string }): Activity {
  return {
    projectId: 'mock-project-id',
    wbsElementId: `wbs-${overrides.id}`,
    type: 'Task',
    duration: 1,
    percentComplete: 0,
    constraintType: 'ASAP',
    constraintDate: null,
    es: null,
    ef: null,
    ls: null,
    lf: null,
    totalFloat: null,
    freeFloat: null,
    isCritical: false,
    calendarId: null,
    ...overrides,
  }
}

// Mock Dependency builder to maintain 100% type safety
function createMockDependency(overrides: Partial<Dependency> & { predecessorId: string; successorId: string }): Dependency {
  return {
    id: `dep-${overrides.predecessorId}-${overrides.successorId}`,
    projectId: 'mock-project-id',
    type: 'FS',
    lagDays: 0,
    ...overrides,
  }
}

// 1. Cycle Detection Test
function testCycleDetection() {
  console.log('Running testCycleDetection...')
  
  const activities: Activity[] = [
    createMockActivity({ id: 'A', name: 'Activity A' }),
    createMockActivity({ id: 'B', name: 'Activity B' }),
    createMockActivity({ id: 'C', name: 'Activity C' }),
  ]
  
  const dependencies: Dependency[] = [
    createMockDependency({ predecessorId: 'A', successorId: 'B' }),
    createMockDependency({ predecessorId: 'B', successorId: 'C' }),
    createMockDependency({ predecessorId: 'C', successorId: 'A' }), // Cycle!
  ]
  
  const calendar: CalendarConfig = { workingDays: [1, 2, 3, 4, 5], holidays: [] }
  const result = computeCPM(activities, dependencies, '2026-07-20', calendar)
  
  if (result.ok) {
    throw new Error('CPM should have failed due to circular dependencies')
  }
  assert(
    result.error.includes('Circular dependency detected'),
    `Expected circular dependency message, got: ${result.error}`
  )
  console.log('✅ testCycleDetection passed!')
}

// 2. Textbook CPM Network Test (Waterfall with Weekends)
function testTextbookCPM() {
  console.log('Running testTextbookCPM...')
  
  // Design:
  // A (5d) -> B (3d) -> D (2d)
  // A (5d) -> C (4d) -> D (2d) -- Critical Path: A -> C -> D (11 working days)
  const activities: Activity[] = [
    createMockActivity({ id: 'A', name: 'A', duration: 5 }),
    createMockActivity({ id: 'B', name: 'B', duration: 3 }),
    createMockActivity({ id: 'C', name: 'C', duration: 4 }),
    createMockActivity({ id: 'D', name: 'D', duration: 2 }),
  ]
  
  const dependencies: Dependency[] = [
    createMockDependency({ predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 }),
    createMockDependency({ predecessorId: 'A', successorId: 'C', type: 'FS', lagDays: 0 }),
    createMockDependency({ predecessorId: 'B', successorId: 'D', type: 'FS', lagDays: 0 }),
    createMockDependency({ predecessorId: 'C', successorId: 'D', type: 'FS', lagDays: 0 }),
  ]
  
  const calendar: CalendarConfig = { workingDays: [1, 2, 3, 4, 5], holidays: [] }
  
  // Project starts Monday July 20, 2026
  const result = computeCPM(activities, dependencies, '2026-07-20', calendar)
  
  if (!result.ok) {
    throw new Error(`Expected CPM calculation to succeed, got: ${result.error}`)
  }
  
  const actMap = new Map<string, Activity>()
  result.activities.forEach((a) => actMap.set(a.id, a))
  
  const a = actMap.get('A')!
  const b = actMap.get('B')!
  const c = actMap.get('C')!
  const d = actMap.get('D')!
  
  // Assert A
  assert(a.es === '2026-07-20', `A.es should be 2026-07-20, got ${a.es}`)
  assert(a.ef === '2026-07-24', `A.ef should be 2026-07-24, got ${a.ef}`) // Mon-Fri
  assert(a.totalFloat === 0, `A float should be 0, got ${a.totalFloat}`)
  assert(a.isCritical === true, 'A should be critical')
  
  // Assert B
  assert(b.es === '2026-07-27', `B.es should be 2026-07-27, got ${b.es}`) // Shifts to next Monday
  assert(b.ef === '2026-07-29', `B.ef should be 2026-07-29, got ${b.ef}`) // Mon-Wed
  assert(b.totalFloat === 1, `B float should be 1, got ${b.totalFloat}`) // Late Start is 2026-07-28
  assert(b.isCritical === false, 'B should not be critical')
  
  // Assert C
  assert(c.es === '2026-07-27', `C.es should be 2026-07-27, got ${c.es}`)
  assert(c.ef === '2026-07-30', `C.ef should be 2026-07-30, got ${c.ef}`) // Mon-Thu
  assert(c.totalFloat === 0, `C float should be 0, got ${c.totalFloat}`)
  assert(c.isCritical === true, 'C should be critical')
  
  // Assert D
  assert(d.es === '2026-07-31', `D.es should be 2026-07-31, got ${d.es}`) // Starts Friday
  assert(d.ef === '2026-08-03', `D.ef should be 2026-08-03, got ${d.ef}`) // Mon (crosses weekend Aug 1-2)
  assert(d.totalFloat === 0, `D float should be 0, got ${d.totalFloat}`)
  assert(d.isCritical === true, 'D should be critical')
  
  console.log('✅ testTextbookCPM passed!')
}

// 3. Constraints Test
function testConstraints() {
  console.log('Running testConstraints...')
  
  const activities: Activity[] = [
    createMockActivity({ id: 'A', name: 'A', duration: 3, constraintType: 'Start No Earlier Than', constraintDate: '2026-07-23' }),
  ]
  const calendar: CalendarConfig = { workingDays: [1, 2, 3, 4, 5], holidays: [] }
  const result = computeCPM(activities, [], '2026-07-20', calendar)
  
  if (!result.ok) {
    throw new Error(`Expected CPM constraints to succeed, got: ${result.error}`)
  }
  const a = result.activities[0]!
  assert(a.es === '2026-07-23', `A.es should be 2026-07-23 due to SNET constraint, got ${a.es}`)
  assert(a.ef === '2026-07-27', `A.ef should be 2026-07-27, got ${a.ef}`) // Thu to Mon
  
  console.log('✅ testConstraints passed!')
}

// Run all tests
try {
  testCycleDetection()
  testTextbookCPM()
  testConstraints()
  console.log('\n🎉 ALL CPM ENGINE TESTS COMPLETED SUCCESSFULLY!')
} catch (err: any) {
  console.error('\n❌ CPM Engine Test Runner failed:')
  console.error(err.message)
  process.exit(1)
}
