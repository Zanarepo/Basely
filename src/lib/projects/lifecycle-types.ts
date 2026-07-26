// Modular Types and Constants for Project Lifecycle Management

export type ProjectLifecycleStatus = 
  | 'Initiating'
  | 'Planning'
  | 'Executing'
  | 'Monitoring & Controlling'
  | 'Closing'
  | 'Closed'

export const LIFECYCLE_STAGES: ProjectLifecycleStatus[] = [
  'Initiating',
  'Planning',
  'Executing',
  'Monitoring & Controlling',
  'Closing',
  'Closed'
]

export interface LifecycleTransitionLog {
  id: string
  project_id: string
  from_status: ProjectLifecycleStatus
  to_status: ProjectLifecycleStatus
  reason: string | null
  is_override: boolean
  transitioned_by: string | null
  created_at: string
  transitioned_by_profile?: {
    full_name?: string
    email?: string
  }
}

/**
 * Validates whether a transition is allowed automatically without admin override.
 * Standard sequential steps (e.g., Initiating -> Planning) are allowed automatically.
 * Reopening or skipping phases requires an override and mandatory written justification.
 */
export function isValidStandardTransition(from: ProjectLifecycleStatus, to: ProjectLifecycleStatus): boolean {
  const fromIdx = LIFECYCLE_STAGES.indexOf(from)
  const toIdx = LIFECYCLE_STAGES.indexOf(to)
  
  if (fromIdx === -1 || toIdx === -1) return false
  // Allow moving forward exactly one phase, or switching between Executing and Monitoring & Controlling
  if (toIdx === fromIdx + 1) return true
  if (from === 'Monitoring & Controlling' && to === 'Executing') return true
  if (from === 'Executing' && to === 'Monitoring & Controlling') return true
  return false
}
