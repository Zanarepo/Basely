export type ChangeRequestEntry = {
  id: string
  description: string
  rationale?: string
  outcome: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  created_at: string
  created_by_user_id?: string
  source?: 'standalone' | 'approval_workflow'
  creator?: { email: string, full_name: string }
}
