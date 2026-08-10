export type ProjectMethodology = 'Agile' | 'Waterfall' | 'Operations' | 'Hybrid' | string

export interface TerminologyDict {
  release: string
  releases: string
  releasePlan: string
  iteration: string
  iterations: string
  deployment: string
  rollback: string
  readiness: string
  
  // WBS / Hierarchy terminology
  planTier: string
  planTiers: string
  workPackage: string
  workPackages: string
  task: string
  tasks: string
}

export const AGILE_TERMS: TerminologyDict = {
  release: 'Release',
  releases: 'Releases',
  releasePlan: 'Release Plan',
  iteration: 'Sprint',
  iterations: 'Sprints',
  deployment: 'Deployment',
  rollback: 'Rollback',
  readiness: 'Readiness',
  
  planTier: 'Epic',
  planTiers: 'Epics',
  workPackage: 'Story',
  workPackages: 'Stories',
  task: 'Sub-task',
  tasks: 'Sub-tasks',
}

export const WATERFALL_TERMS: TerminologyDict = {
  release: 'Milestone',
  releases: 'Milestones',
  releasePlan: 'Milestone Delivery',
  iteration: 'Phase',
  iterations: 'Phases',
  deployment: 'Handover',
  rollback: 'Contingency',
  readiness: 'Prerequisites',
  
  planTier: 'Summary Element',
  planTiers: 'Summary Elements',
  workPackage: 'Work Package',
  workPackages: 'Work Packages',
  task: 'Task',
  tasks: 'Tasks',
}

export const OPERATIONS_TERMS: TerminologyDict = {
  release: 'Operating Cycle',
  releases: 'Operating Cycles',
  releasePlan: 'Cycle Target',
  iteration: 'Shift',
  iterations: 'Shifts',
  deployment: 'Transition',
  rollback: 'Reversion',
  readiness: 'Compliance',
  
  planTier: 'Program',
  planTiers: 'Programs',
  workPackage: 'Ticket',
  workPackages: 'Tickets',
  task: 'Action',
  tasks: 'Actions',
}

export function getTerminology(methodology: ProjectMethodology | null | undefined): TerminologyDict {
  switch (methodology) {
    case 'Agile':
      return AGILE_TERMS
    case 'Waterfall':
      return WATERFALL_TERMS
    case 'Operations':
      return OPERATIONS_TERMS
    case 'Hybrid':
    default:
      return AGILE_TERMS // Fallback to Agile terms
  }
}
