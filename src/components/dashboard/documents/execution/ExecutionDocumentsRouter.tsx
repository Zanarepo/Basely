'use client'

import React from 'react'
import type { ExecutionDocType } from './ExecutionSidebarSection'
import { MeetingMinutesList } from './MeetingMinutesList'
import { ChangeRequestLog } from '../change-requests/ChangeRequestLog'
import { DeliverableSignoffSheet } from '../deliverables/DeliverableSignoffSheet'

export interface ExecutionDocumentsRouterProps {
  documentType: ExecutionDocType
  projectId: string
  hasEditAccess: boolean
  isManager?: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ExecutionDocumentsRouter({
  documentType,
  projectId,
  hasEditAccess,
  isManager,
  onShowToast
}: ExecutionDocumentsRouterProps) {
  switch (documentType) {
    case 'meeting_minutes':
      return (
        <MeetingMinutesList
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    case 'change_requests':
      return (
        <ChangeRequestLog
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          isManager={isManager}
          onShowToast={onShowToast}
        />
      )
    case 'deliverables':
      if (!hasEditAccess && !isManager) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-app-muted min-h-[400px]">
            <p>You do not have permission to view or manage Deliverable Sign-offs.</p>
          </div>
        )
      }
      return (
        <DeliverableSignoffSheet
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    default:
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-app-muted min-h-[400px]">
          <p>Select an execution document from the sidebar.</p>
        </div>
      )
  }
}
