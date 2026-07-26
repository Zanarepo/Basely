'use client'

import React from 'react'
import { ClosureReportViewer } from './ClosureReportViewer'
import { LessonsLearnedEditor } from './LessonsLearnedEditor'
import { HandoverViewer } from './HandoverViewer'
import { PostImplementationReviewViewer } from './PostImplementationReviewViewer'
import { SignoffManagementBoard } from '@/components/dashboard/projects/signoffs/SignoffManagementBoard'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'

export type ClosureDocType = 'closure_report' | 'lessons_learned' | 'handover_document' | 'post_implementation_review' | 'signoff_board'

export interface ClosureDocumentsRouterProps {
  documentType: ClosureDocType
  projectId: string
  hasEditAccess: boolean
  currentLifecycle?: string
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ClosureDocumentsRouter({
  documentType,
  projectId,
  hasEditAccess,
  currentLifecycle = 'Execution',
  onOpenLifecycleModal,
  onShowToast
}: ClosureDocumentsRouterProps) {
  const lifecycle = currentLifecycle as ProjectLifecycleStatus

  switch (documentType) {
    case 'closure_report':
      return (
        <ClosureReportViewer
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          currentLifecycle={lifecycle}
          onOpenLifecycleModal={onOpenLifecycleModal}
          onShowToast={onShowToast}
        />
      )
    case 'lessons_learned':
      return (
        <LessonsLearnedEditor
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          currentLifecycle={lifecycle}
          onOpenLifecycleModal={onOpenLifecycleModal}
          onShowToast={onShowToast}
        />
      )
    case 'handover_document':
      return (
        <HandoverViewer
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          currentLifecycle={lifecycle}
          onOpenLifecycleModal={onOpenLifecycleModal}
          onShowToast={onShowToast}
        />
      )
    case 'post_implementation_review':
      return (
        <PostImplementationReviewViewer
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          currentLifecycle={lifecycle}
          onOpenLifecycleModal={onOpenLifecycleModal}
          onShowToast={onShowToast}
        />
      )
    case 'signoff_board':
      return (
        <SignoffManagementBoard
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    default:
      return null
  }
}
