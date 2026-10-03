export type ChangeRequestEntry = {
  id: string
  description: string
  rationale?: string
  cost_impact?: number
  schedule_impact_days?: number
  outcome: 'pending' | 'pending_sponsor_approval' | 'approved' | 'rejected' | 'withdrawn'
  created_at: string
  created_by_user_id?: string
  source?: 'standalone' | 'approval_workflow' | 'risk_escalation'
  creator?: { email: string, full_name: string }
}
