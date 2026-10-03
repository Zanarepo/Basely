'use client'

import { useState } from 'react'
import { ApproverQueue } from './ApproverQueue'
import { RequesterQueue } from './RequesterQueue'

export interface ApprovalRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  action_type: string
  payload: any
  created_at: string
  decided_at?: string
  decision_comment?: string
  requested_by_user_id: string
  requester_name: string
  requester_email: string
  decider_name?: string
  project_name?: string
}

interface ApprovalsWorkspaceProps {
  organizationId: string
  requests: ApprovalRequest[]
  canApprove: boolean
  currentUserId: string
}

export function ApprovalsWorkspace({ organizationId, requests, canApprove, currentUserId }: ApprovalsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'approver' | 'requester'>(canApprove ? 'approver' : 'requester')

  const myRequests = requests.filter(r => r.requested_by_user_id === currentUserId)
  // An approver should see ALL pending requests in the organization, except maybe their own?
  // Let's just show all pending requests in the org to approvers, RLS handles the filtering.
  const orgRequests = canApprove ? requests : []

  return (
    <div className="flex flex-col h-full overflow-hidden bg-app-surface border border-app-border rounded-3xl shadow-sm">
      <div className="flex border-b border-app-border px-4 pt-2">
        {canApprove && (
          <button
            onClick={() => setActiveTab('approver')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'approver'
                ? 'border-violet-500 text-violet-500'
                : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
          >
            Review Queue
          </button>
        )}
        <button
          onClick={() => setActiveTab('requester')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'requester'
              ? 'border-violet-500 text-violet-500'
              : 'border-transparent text-app-muted hover:text-app-fg'
            }`}
        >
          My Submissions
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-app-muted-surface">
        {activeTab === 'approver' && canApprove ? (
          <ApproverQueue requests={orgRequests} />
        ) : (
          <RequesterQueue requests={myRequests} />
        )}
      </div>
    </div>
  )
}
