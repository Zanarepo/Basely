export const WBS_STATUSES = ['Not Started', 'In Progress', 'Complete', 'On Hold'] as const

export type WbsStatus = (typeof WBS_STATUSES)[number]

export type WbsElement = {
  id: string
  projectId: string
  parentId: string | null
  code: string
  name: string
  description: string | null
  ownerId: string | null
  deliverables: string | null
  acceptanceCriteria: string | null
  status: WbsStatus
  isWorkPackage: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
