'use client'

import React from 'react'
import { ScopeStatementEditor } from './ScopeStatementEditor'
import { CommunicationPlanEditor } from './CommunicationPlanEditor'
import { QualityManagementPlanEditor } from './QualityManagementPlanEditor'
import { ProcurementPlanEditor } from './ProcurementPlanEditor'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'

export type PlanningDocType = 'scope_statement' | 'communication_plan' | 'quality_management_plan' | 'procurement_plan'

export interface PlanningDocumentsRouterProps {
  documentType: PlanningDocType
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function PlanningDocumentsRouter({
  documentType,
  projectId,
  hasEditAccess,
  onShowToast
}: PlanningDocumentsRouterProps) {

  switch (documentType) {
    case 'scope_statement':
      return (
        <ScopeStatementEditor
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    case 'communication_plan':
      return (
        <CommunicationPlanEditor
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    case 'quality_management_plan':
      return (
        <QualityManagementPlanEditor
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    case 'procurement_plan':
      return (
        <ProcurementPlanEditor
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onShowToast={onShowToast}
        />
      )
    default:
      return null
  }
}
