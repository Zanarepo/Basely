import React from 'react'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import StructuredEditableField from '../../StructuredEditableField'
import WbsDictionaryResolver from '../../../resolvers/WbsDictionaryResolver'
import RaciMatrixResolver from '../../../resolvers/RaciMatrixResolver'
import ScheduleStatusResolver from '../../../resolvers/ScheduleStatusResolver'
import EvmStatusResolver from '../../../resolvers/EvmStatusResolver'
import { ScopeStatementResolver } from '../../../planning/ScopeStatementResolver'
import { CommunicationPlanResolver } from '../../../planning/CommunicationPlanResolver'
import { QualityManagementPlanResolver } from '../../../planning/QualityManagementPlanResolver'
import { ProcurementPlanResolver } from '../../../planning/ProcurementPlanResolver'
import TopRisksResolver from '../../../resolvers/TopRisksResolver'
import StakeholderRegisterResolver from '../../../resolvers/StakeholderRegisterResolver'
import RiskRegisterResolver from '../../../resolvers/RiskRegisterResolver'
import BusinessCaseResolver from '../../../resolvers/BusinessCaseResolver'
import FeasibilityStudyResolver from '../../../resolvers/FeasibilityStudyResolver'
import { BudgetBaselineResolver } from '../../../resolvers/BudgetBaselineResolver'
import { IssueLogResolver } from '../../../resolvers/IssueLogResolver'
import { ScheduleDocumentResolver } from '../../../resolvers/ScheduleDocumentResolver'
import { ChangeManagementPlanResolver } from '../../../resolvers/ChangeManagementPlanResolver'
import { HandoverDeliverablesResolver } from '@/components/dashboard/documents/resolvers/HandoverDeliverablesResolver'
import { HandoverOwnersResolver } from '@/components/dashboard/documents/resolvers/HandoverOwnersResolver'
import { ProjectManagementPlanResolver } from '../../../resolvers/ProjectManagementPlanResolver'
import { ProductStrategyResolver } from '../../../resolvers/ProductStrategyResolver'
import { OkrKpiReportResolver } from '../../../resolvers/OkrKpiReportResolver'
import { PrdDocumentResolver } from '../../../resolvers/PrdDocumentResolver'

interface SectionResolverSwitchProps {
  section: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  projectId: string
  projectContext: any
  isSnapshot: boolean
  hasEditAccess: boolean
  freeText: Record<string, string>
  handleFreeTextChange: (key: string, value: string) => void
  resolveDataBoundSource: (source?: string) => string
}

export function SectionResolverSwitch({
  section,
  generatedDoc,
  projectId,
  projectContext,
  isSnapshot,
  hasEditAccess,
  freeText,
  handleFreeTextChange,
  resolveDataBoundSource,
}: SectionResolverSwitchProps) {
  if (section.source === 'wbs.dictionary' || section.source === 'wbs.prototype' || section.source?.startsWith('wbs.')) {
    return <WbsDictionaryResolver projectId={projectId} />
  }
  if (section.resolver?.startsWith('scope_statement_') || section.source === 'scope_statement_data') {
    return <ScopeStatementResolver projectId={projectId} sectionKey={section.resolver.replace('scope_statement_', '')} />
  }
  if (section.resolver === 'communication_plan_entries' || section.source === 'communication_plan_data') {
    return <CommunicationPlanResolver projectId={projectId} />
  }
  if (section.resolver === 'quality_management_plan_data') {
    return <QualityManagementPlanResolver projectId={projectId} />
  }
  if (section.resolver === 'procurement_plan_entries') {
    return <ProcurementPlanResolver projectId={projectId} />
  }
  if (section.source === 'raci.matrix') {
    return <RaciMatrixResolver projectId={projectId} />
  }
  if (section.source === 'status.schedule') {
    return (
      <ScheduleStatusResolver
        projectId={projectId}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? generatedDoc?.frozen_data?.schedule : undefined}
      />
    )
  }
  if (section.source === 'status.cost') {
    return (
      <EvmStatusResolver
        projectId={projectId}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? generatedDoc?.frozen_data?.cost : undefined}
      />
    )
  }
  if (section.source === 'status.risks') {
    return (
      <TopRisksResolver
        projectId={projectId}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? generatedDoc?.frozen_data?.risks : undefined}
      />
    )
  }
  if (section.source === 'register.stakeholders') {
    return (
      <StakeholderRegisterResolver
        projectId={projectId}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? generatedDoc?.frozen_data?.stakeholders : undefined}
      />
    )
  }
  if (section.source === 'register.risks') {
    return (
      <RiskRegisterResolver
        projectId={projectId}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? generatedDoc?.frozen_data?.risks : undefined}
      />
    )
  }
  if (section.source?.startsWith('initiation.business_case')) {
    return <BusinessCaseResolver entityId={projectId} field={section.source.split('_').pop() as any} />
  }
  if (section.source?.startsWith('initiation.feasibility')) {
    return <FeasibilityStudyResolver entityId={projectId} field={section.source.split('_').pop() as any} />
  }
  if (section.source === 'cost.budget_baseline') {
    return (
      <BudgetBaselineResolver
        projectId={projectId}
        sectionKey={section.key}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.budget_baseline : undefined}
      />
    )
  }
  if (section.source === 'accountability.issue_log') {
    return (
      <IssueLogResolver
        projectId={projectId}
        sectionKey={section.key}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.issue_log : undefined}
      />
    )
  }
  if (section.source === 'planning.schedule_document') {
    return (
      <ScheduleDocumentResolver
        projectId={projectId}
        sectionKey={section.key}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.schedule_document : undefined}
      />
    )
  }
  if (section.source === 'governance.change_management_plan') {
    return (
      <ChangeManagementPlanResolver
        projectId={projectId}
        sectionKey={section.key}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.change_management : undefined}
      />
    )
  }
  if (section.source === 'closure.deliverables_table') {
    return (
      <HandoverDeliverablesResolver
        projectId={projectId}
        sectionKey={section.key}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.deliverables_table : undefined}
      />
    )
  }
  if (section.source === 'closure.ongoing_owners') {
    return (
      <HandoverOwnersResolver
        projectId={projectId}
        sectionKey={section.key}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.ongoing_owners : undefined}
      />
    )
  }
  if (section.source === 'master.project_management_plan') {
    return (
      <ProjectManagementPlanResolver
        projectId={projectId}
        sectionKey={section.key}
        periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())}
        frozenData={isSnapshot ? (generatedDoc?.frozen_data as any)?.project_management_plan : undefined}
      />
    )
  }
  if (section.source?.startsWith('product.')) {
    return <ProductStrategyResolver projectId={projectId} source={section.source as any} />
  }
  if (section.source?.startsWith('okrs.')) {
    return <OkrKpiReportResolver projectId={projectId} organizationId={projectContext?.organization_id || ''} source={section.source} />
  }
  if (section.source?.startsWith('prd.')) {
    return <PrdDocumentResolver projectId={projectId} source={section.source as any} />
  }
  if (freeText[section.key]) {
    return (
      <div className="-ml-4 mt-2">
        <StructuredEditableField
          value={freeText[section.key]}
          onChange={(val) => handleFreeTextChange(section.key, val)}
          title={section.title}
          hasEditAccess={hasEditAccess && !isSnapshot}
          isDataBound={true}
        />
      </div>
    )
  }

  return <p className="font-medium">{resolveDataBoundSource(section.source)}</p>
}
