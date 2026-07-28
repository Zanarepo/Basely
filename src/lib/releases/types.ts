import { getTerminology } from '@/utils/terminology'

export type ReleaseStatus = 'planned' | 'in_progress' | 'released' | 'rolled_back' | 'canceled'

export interface Iteration {
  id: string
  projectId: string
  name: string
  sequenceNumber: number
  startDate: string
  endDate: string
  labelOverride?: 'sprint' | 'phase' | null
  createdAt: string
  updatedAt: string
  taggedWbsCount?: number
  taggedActivityCount?: number
}

export interface ReleaseExitCriterion {
  id: string
  releaseId: string
  criterionText: string
  isMet: boolean
  createdAt?: string
}

export interface ReleaseManualScope {
  id: string
  releaseId: string
  entityType: 'wbs_element' | 'activity' | 'custom_item'
  entityId?: string | null
  title: string
  action: 'added' | 'excluded'
  notes?: string | null
  createdAt?: string
}

export interface Release {
  id: string
  projectId: string
  name: string
  objective?: string | null
  sequenceNumber: number
  status: ReleaseStatus
  createdAt: string
  updatedAt: string
  iterationIds?: string[]
  iterations?: Iteration[]
  exitCriteria?: ReleaseExitCriterion[]
  manualScope?: ReleaseManualScope[]
  readinessItems?: ReleaseReadinessItem[]
  deploymentPlans?: ReleaseDeploymentPlan[]
  rollbackPlans?: ReleaseRollbackPlan[]
}

export interface ReleaseReadinessItem {
  id: string
  releaseId: string
  category: string
  itemText: string
  isChecked: boolean
  checkedByUserId?: string | null
  checkedAt?: string | null
  createdAt?: string
}

export interface ReleaseDeploymentPlan {
  id: string
  releaseId: string
  phase: 'Before' | 'During' | 'After'
  stepText: string
  isCompleted: boolean
  completedByUserId?: string | null
  completedAt?: string | null
  createdAt?: string
  sortOrder: number
}

export interface ReleaseRollbackPlan {
  id: string
  releaseId: string
  stepText: string
  isCompleted: boolean
  completedByUserId?: string | null
  completedAt?: string | null
  createdAt?: string
  sortOrder: number
}

export interface ReleaseScopeItem {
  id: string
  entityId: string
  entityType: 'wbs_element' | 'activity' | 'custom_item'
  title: string
  code?: string
  iterationName?: string
  iterationId?: string
  source: 'auto_derived' | 'manual_override' | 'excluded'
  notes?: string
}

export function getIterationLabel(
  projectMethodology?: string | null,
  labelOverride?: 'sprint' | 'phase' | null
): string {
  if (labelOverride === 'sprint' || labelOverride === 'phase') {
    return labelOverride === 'sprint' ? 'Sprint' : 'Phase'
  }
  return getTerminology(projectMethodology).iteration
}
