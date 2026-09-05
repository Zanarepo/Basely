import React from 'react'
import dynamic from 'next/dynamic'
import { Kanban, FileText, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MarketResearchChainBanner = dynamic(() => import('./chain/MarketResearchChainBanner'), { ssr: false })
const RiskRegisterChainBanner = dynamic(() => import('./chain/RiskRegisterChainBanner'), { ssr: false })
const CharterInitiationBanner = dynamic(() => import('./CharterInitiationBanner'), { ssr: false })
const ScopeInitiationBanner = dynamic(() => import('./ScopeInitiationBanner'), { ssr: false })
const ScopeToRiceAutomationBanner = dynamic(() => import('./rice-automation/ScopeToRiceAutomationBanner'), { ssr: false })
const WbsToBaselinesChainBanner = dynamic(() => import('./chain/WbsToBaselinesChainBanner'), { ssr: false })
const PmPlanSynthesisChainBanner = dynamic(() => import('./chain/PmPlanSynthesisChainBanner'), { ssr: false })
const AiStatusReportBanner = dynamic(() => import('./execution/AiStatusReportBanner').then(m => m.AiStatusReportBanner), { ssr: false })
const AiClosureSynthesisBanner = dynamic(() => import('./closure/AiClosureSynthesisBanner').then(m => m.AiClosureSynthesisBanner), { ssr: false })
const AiStakeholderRegisterBanner = dynamic(() => import('./chain/AiStakeholderRegisterBanner'), { ssr: false })
const GenericAiChainBanner = dynamic(() => import('./chain/GenericAiChainBanner'), { ssr: false })

interface DocumentAiBannersProps {
  projectId: string
  organizationId: string
  template: any
  freeText: any
  setFreeText: React.Dispatch<React.SetStateAction<any>>
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>
  onShowToast: (type: 'success' | 'error', msg: string) => void
  onSaveSuccess?: () => void
  isSnapshot: boolean
  hasEditAccess: boolean
  handleGenerateBacklog: () => void
  isGeneratingBacklog: boolean
  isBacklogGenerated: boolean
  handleDraftStrategy: () => void
  isDraftingStrategy: boolean
  handleSynthesizeRoadmap: () => void
  isSynthesizingRoadmap: boolean
  isStrategyDone: boolean
}

export function DocumentAiBanners({
  projectId,
  organizationId,
  template,
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  onSaveSuccess,
  isSnapshot,
  hasEditAccess,
  handleGenerateBacklog,
  isGeneratingBacklog,
  isBacklogGenerated,
  handleDraftStrategy,
  isDraftingStrategy,
  handleSynthesizeRoadmap,
  isSynthesizingRoadmap,
  isStrategyDone
}: DocumentAiBannersProps) {
  const router = useRouter()

  return (
    <>
      {/* Competitive / Market Research Banners */}
      {['competitive_analysis_workspace', 'competitive_benchmarking_matrix', 'market_research_report', 'market_research_workspace'].includes(template.document_type) && (
        <MarketResearchChainBanner
          projectId={projectId}
          organizationId={organizationId}
          templateId={template.id}
          freeText={freeText}
          onShowToast={onShowToast}
          onGenerated={(data) => {
            setFreeText((prev: any) => ({...prev, ...data}))
            setIsDirty(true)
          }}
        />
      )}

      {!isSnapshot && [
        'problem_discovery_workspace', 
        'customer_research_strategy', 
        'customer_research_workspace',
        'problem_definition_workspace', 
        'opportunity_assessment_workspace',
        'product_strategy_document', 
        'prioritization_workspace', 
        'roadmap_workspace',
        'product_roadmap_document',
        'product_roadmap',
        'solution_design_workspace', 
        'solution_validation_workspace', 
        'product_requirements_document'
      ].includes(template.document_type) && (
        <GenericAiChainBanner
          projectId={projectId}
          organizationId={organizationId}
          documentType={template.document_type}
          templateId={template.id}
          onShowToast={onShowToast}
          onGenerated={(data) => {
            if (template.document_type === 'solution_design_workspace') {
              setFreeText(data)
            } else {
              setFreeText((prev: any) => ({...prev, ...data}))
            }
            setIsDirty(true)
            router.refresh()
          }}
          secondaryActions={
            template.document_type === 'product_requirements_document' && !isSnapshot ? [
              {
                label: 'Convert PRD to Product Backlog',
                onClick: handleGenerateBacklog,
                isGenerating: isGeneratingBacklog,
                isDone: isBacklogGenerated,
                doneLabel: 'Backlog Generated',
                icon: <Kanban className="w-4 h-4" />
              }
            ] : template.document_type === 'product_strategy_document' && !isSnapshot ? [
              {
                label: 'Draft Strategy (from Charter)',
                onClick: handleDraftStrategy,
                isGenerating: isDraftingStrategy,
                isDone: isStrategyDone,
                doneLabel: 'Strategy Drafted',
                icon: <FileText className="w-4 h-4" />
              },
              {
                label: 'Generate Roadmap',
                onClick: handleSynthesizeRoadmap,
                isGenerating: isSynthesizingRoadmap,
                isDone: isStrategyDone,
                doneLabel: 'Roadmap Generated',
                icon: <Target className="w-4 h-4" />
              }
            ] : undefined
          }
        />
      )}

      {template.id === 'standard_risk_register' && !isSnapshot && hasEditAccess && (
        <RiskRegisterChainBanner
          projectId={projectId}
          organizationId={organizationId}
          onShowToast={onShowToast}
          onSuccess={onSaveSuccess}
        />
      )}
      
      {template.document_type === 'stakeholder_register' && !isSnapshot && hasEditAccess && (
        <AiStakeholderRegisterBanner
          projectId={projectId}
          organizationId={organizationId}
          template={template}
          onGenerated={(data) => {
            setFreeText((prev: any) => ({...prev, ...data}))
            setIsDirty(true)
          }}
          onShowToast={onShowToast}
        />
      )}

      {template.document_type === 'charter' && !isSnapshot && hasEditAccess && (
        <CharterInitiationBanner
          projectId={projectId}
          organizationId={organizationId}
          template={template}
          onGenerated={(data) => {
            setFreeText((prev: any) => ({...prev, ...data}))
            setIsDirty(true)
          }}
          onShowToast={onShowToast}
        />
      )}

      {template.document_type === 'scope_statement' && !isSnapshot && hasEditAccess && (
        <div className="flex flex-wrap items-center gap-3">
          <ScopeInitiationBanner
            projectId={projectId}
            organizationId={organizationId}
            template={template}
            onGenerated={(data) => {
              setFreeText((prev: any) => ({...prev, ...data}))
              setIsDirty(true)
            }}
            onShowToast={onShowToast}
          />
          <ScopeToRiceAutomationBanner
            projectId={projectId}
            organizationId={organizationId}
            freeText={freeText}
            onShowToast={onShowToast}
            isSnapshot={isSnapshot}
          />
        </div>
      )}

      {(template.document_type === 'budget_baseline' || template.document_type === 'schedule_document') && !isSnapshot && hasEditAccess && (
        <WbsToBaselinesChainBanner
          projectId={projectId}
          organizationId={organizationId}
          onShowToast={onShowToast}
        />
      )}

      {template.document_type === 'project_management_plan' && !isSnapshot && hasEditAccess && (
        <PmPlanSynthesisChainBanner
          projectId={projectId}
          organizationId={organizationId}
          onShowToast={onShowToast}
        />
      )}

      {template.document_type === 'status_report' && !isSnapshot && hasEditAccess && (
        <AiStatusReportBanner
          projectId={projectId}
          organizationId={organizationId}
          onGenerated={(data) => {
            setFreeText((prev: any) => ({ ...prev, ...data }))
            setIsDirty(true)
          }}
          onShowToast={onShowToast}
        />
      )}

      {(template.document_type === 'lessons_learned' || template.document_type === 'post_implementation_review') && !isSnapshot && hasEditAccess && (
        <AiClosureSynthesisBanner
          projectId={projectId}
          organizationId={organizationId}
          docType={template.document_type}
          onGenerated={(data) => {
            setFreeText((prev: any) => ({ ...prev, ...data }))
            setIsDirty(true)
          }}
          onShowToast={onShowToast}
        />
      )}
    </>
  )
}
