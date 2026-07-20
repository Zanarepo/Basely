export const DEFAULT_WBS_STATUSES = ['Not Started', 'In Progress', 'Complete', 'On Hold'] as const

export type WbsStatus = string // Changed from strict literal to support dynamic columns

export type RaciRoleType = 'Responsible' | 'Accountable' | 'Consulted' | 'Informed'

export type RaciAssignment = {
  id: string
  wbsElementId: string
  stakeholderId: string
  roleType: RaciRoleType
  stakeholder?: {
    id: string
    name: string
    organization_type: 'internal' | 'external'
    linked_user_id: string | null
    profiles?: { full_name: string | null; email: string | null }
  }
}

export type ChecklistItem = {
  id: string
  text: string
  completed: boolean
}

export type DeliverableItem = ChecklistItem
export type AcceptanceCriteriaItem = ChecklistItem

export type WbsElement = {
  id: string
  projectId: string
  parentId: string | null
  code: string
  name: string
  description: string | null
  ownerId?: string | null // Deprecated, use raciAssignments
  deliverables: string | null
  deliverablesData?: DeliverableItem[]
  acceptanceCriteria: string | null
  acceptanceCriteriaData?: AcceptanceCriteriaItem[]
  status: WbsStatus
  isWorkPackage: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  raciAssignments?: RaciAssignment[]
}
