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
  gtmTerm: string
  retroTerm: string
  wbsTab: string
  wbsShortTab: string
  criticalPath: string
  costHealth: string
  milestonesWidget: string
  risksWidget: string
  
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
  gtmTerm: 'GTM Launch Channels',
  retroTerm: 'Release Retrospective',
  wbsTab: 'Product Backlog',
  wbsShortTab: 'Backlog',
  criticalPath: 'Iteration Trajectory',
  costHealth: 'Cost & Burn Rate Health',
  milestonesWidget: 'Upcoming Releases',
  risksWidget: 'Impediments & Blockers',
  
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
  gtmTerm: 'Handover & Launch',
  retroTerm: 'Milestone Post-Mortem',
  wbsTab: 'Work Breakdown Structure (WBS)',
  wbsShortTab: 'WBS',
  criticalPath: 'Critical Path Status',
  costHealth: 'Cost & EVM Health',
  milestonesWidget: 'Upcoming Milestones',
  risksWidget: 'Top Project Risks',
  
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
  gtmTerm: 'Operational Transition',
  retroTerm: 'Cycle Review',
  wbsTab: 'Operations Backlog',
  wbsShortTab: 'Backlog',
  criticalPath: 'Cycle Flow Status',
  costHealth: 'Cost & Run-Rate Health',
  milestonesWidget: 'Upcoming Cycles',
  risksWidget: 'Operational Risks',
  
  planTier: 'Program',
  planTiers: 'Programs',
  workPackage: 'Ticket',
  workPackages: 'Tickets',
  task: 'Action',
  tasks: 'Actions',
}

export function getTerminology(methodology: ProjectMethodology | null | undefined): TerminologyDict {
  const normalizedMethodology = methodology?.toLowerCase();
  
  if (normalizedMethodology === 'agile') return AGILE_TERMS;
  if (normalizedMethodology === 'waterfall') return WATERFALL_TERMS;
  if (normalizedMethodology === 'operations') return OPERATIONS_TERMS;
  
  return AGILE_TERMS; // Fallback to Agile terms (which covers 'hybrid' as well)
}
