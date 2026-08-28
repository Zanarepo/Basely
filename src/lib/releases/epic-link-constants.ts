export const EPIC_LINK_CATEGORIES = [
  { key: 'all', label: 'All Items' },
  { key: 'epics', label: 'Group by Epic / Summary' },
  { key: 'stories', label: 'Individual Stories / Work Packages' },
  { key: 'manual', label: 'Manual Overrides' },
] as const

export const GTM_RELEASE_CHECKLIST_CATEGORIES = [
  'Database Migration',
  'API & Integrations',
  'Security & Auth',
  'Documentation',
  'Quality Assurance & Audit',
] as const

export const DUAL_METHODOLOGY_LABELS = {
  Agile: {
    epicTerm: 'Epic',
    epicsTerm: 'Epics',
    storyTerm: 'User Story',
    storiesTerm: 'User Stories',
    sprintTerm: 'Sprint',
    sprintsTerm: 'Sprints',
    releaseTerm: 'Release',
    releasesTerm: 'Releases',
    releaseNotesTerm: 'Release Notes',
    checklistTerm: 'Deployment Readiness Checklist',
    gtmTerm: 'GTM Launch Channels',
    retroTerm: 'Release Retrospective',
  },
  Waterfall: {
    epicTerm: 'Summary Element',
    epicsTerm: 'Summary Elements',
    storyTerm: 'Work Package',
    storiesTerm: 'Work Packages',
    sprintTerm: 'Phase',
    sprintsTerm: 'Phases',
    releaseTerm: 'Milestone',
    releasesTerm: 'Milestones',
    releaseNotesTerm: 'Milestone Handover Report',
    checklistTerm: 'Prerequisites Compliance Checklist',
    gtmTerm: 'Handover & Launch',
    retroTerm: 'Milestone Post-Mortem',
  },
  Hybrid: {
    epicTerm: 'Epic / Summary',
    epicsTerm: 'Epics / Summaries',
    storyTerm: 'Story / Work Package',
    storiesTerm: 'Stories / Work Packages',
    sprintTerm: 'Sprint / Phase',
    sprintsTerm: 'Sprints / Phases',
    releaseTerm: 'Release / Milestone',
    releasesTerm: 'Releases / Milestones',
    releaseNotesTerm: 'Release & Handover Notes',
    checklistTerm: 'Readiness & Compliance Checklist',
    gtmTerm: 'Launch & Handover',
    retroTerm: 'Milestone Retrospective',
  },
} as const

export type SupportedMethodology = keyof typeof DUAL_METHODOLOGY_LABELS

export function getDualLabels(methodology?: string | null) {
  if (methodology === 'Waterfall') return DUAL_METHODOLOGY_LABELS.Waterfall
  if (methodology === 'Hybrid') return DUAL_METHODOLOGY_LABELS.Hybrid
  return DUAL_METHODOLOGY_LABELS.Agile
}
