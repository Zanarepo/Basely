'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/types'
import { getDocumentTemplate, getGeneratedDocument } from '@/lib/documents/core-queries'
import { updateDocumentTemplateId } from '@/lib/documents/core-mutations'
import { getSyncDocumentTemplate } from '@/lib/documents/prd-templates'
import { getCustomTemplates, CustomDocumentTemplate } from '@/lib/documents/template-actions'
import { FileText, LayoutTemplate, ArrowRight, Loader2 } from 'lucide-react'

import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'

// Lazy-load heavy components to avoid compiling them all upfront
const DocumentEngine = dynamic(() => import('./DocumentEngine'), { ssr: false })
const PrdTemplateSelectorModal = dynamic(() => import('@/components/dashboard/product/prd/PrdTemplateSelectorModal').then(m => m.PrdTemplateSelectorModal), { ssr: false })
const StrategyTemplateSelectorModal = dynamic(() => import('@/components/dashboard/product/strategy/templates/components/StrategyTemplateSelectorModal').then(m => m.StrategyTemplateSelectorModal), { ssr: false })
const RoadmapTemplateSelectorModal = dynamic(() => import('@/components/dashboard/product/roadmap/templates/components/RoadmapTemplateSelectorModal').then(m => m.RoadmapTemplateSelectorModal), { ssr: false })
const MarketResearchTemplateSelectorModal = dynamic(() => import('@/components/dashboard/product/market-research/templates/components/MarketResearchTemplateSelectorModal').then(m => m.MarketResearchTemplateSelectorModal), { ssr: false })
const CharterTemplateSelectorModal = dynamic(() => import('@/components/dashboard/project/charters/components/CharterTemplateSelectorModal').then(m => m.CharterTemplateSelectorModal), { ssr: false })
const StakeholderTemplateSelectorModal = dynamic(() => import('@/components/dashboard/project/stakeholders/components/StakeholderTemplateSelectorModal').then(m => m.StakeholderTemplateSelectorModal), { ssr: false })
const RiskTemplateSelectorModal = dynamic(() => import('@/components/dashboard/project/risks/components/RiskTemplateSelectorModal').then(m => m.RiskTemplateSelectorModal), { ssr: false })
const ScopeStatementTemplateSelectorModal = dynamic(() => import('@/components/dashboard/documents/components/ScopeStatementTemplateSelectorModal').then(m => m.ScopeStatementTemplateSelectorModal), { ssr: false })
const ChangeManagementTemplateSelectorModal = dynamic(() => import('@/components/dashboard/documents/components/ChangeManagementTemplateSelectorModal').then(m => m.ChangeManagementTemplateSelectorModal), { ssr: false })
const HandoverTemplateSelectorModal = dynamic(() => import('@/components/dashboard/documents/components/HandoverTemplateSelectorModal').then(m => m.HandoverTemplateSelectorModal), { ssr: false })

interface ProjectDocumentProps {
  documentType: string
  projectId: string
  projectContext: any
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
  snapshotId?: string
}

export default function ProjectDocument({
  documentType,
  projectId,
  projectContext,
  hasEditAccess,
  onShowToast,
  isSnapshot = false,
  snapshotId
}: ProjectDocumentProps) {
  // Pre-initialize template synchronously (0ms instant render!)
  const [template, setTemplate] = useState<DocumentTemplate>(() => getSyncDocumentTemplate(documentType))
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Selection state
  const [availableCustomTemplates, setAvailableCustomTemplates] = useState<CustomDocumentTemplate[]>([])
  const [needsTemplateSelection, setNeedsTemplateSelection] = useState(false)
  const [isPrdModalOpen, setIsPrdModalOpen] = useState(false)
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false)
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false)
  const [isMarketResearchModalOpen, setIsMarketResearchModalOpen] = useState(false)
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false)
  const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false)
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [isScopeStatementModalOpen, setIsScopeStatementModalOpen] = useState(false)
  const [isChangeManagementModalOpen, setIsChangeManagementModalOpen] = useState(false)
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false)
  const orgId = projectContext?.organization_id || ''

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    // Resolve template synchronously first so UI appears instantly
    const isMarketResearchType =
      documentType === 'market_research_report' ||
      documentType === 'market_research_workspace' ||
      documentType === 'competitive_analysis_workspace' ||
      documentType === 'competitive_benchmarking_matrix'

    const fallbackTemplateId =
      documentType === 'product_strategy_document' ? 'standard_product_strategy' :
      documentType === 'product_requirements_document' ? 'standard_prd' :
      documentType === 'charter' ? 'enterprise_project_charter' :
      documentType === 'stakeholder_register' ? 'default_stakeholder_register' :
      documentType === 'risk_register' ? 'standard_risk_register' :
      documentType === 'scope_statement' ? 'standard_scope_statement' :
      documentType === 'change_management_plan' ? 'standard_change_management' :
      documentType === 'handover_document' ? 'standard_handover' :
      (documentType === 'roadmap_workspace' || documentType === 'product_roadmap_document' || documentType === 'product_roadmap') ? 'now_next_later' :
      isMarketResearchType ? (documentType === 'competitive_analysis_workspace' || documentType === 'competitive_benchmarking_matrix' ? 'competitive_analysis_matrix' : 'master_market_research') :
      undefined

    // Show the default template immediately while data loads
    const initialTpl = getSyncDocumentTemplate(documentType, fallbackTemplateId)
    setTemplate(initialTpl)

    async function load() {
      try {
        // Fire both calls in parallel instead of sequentially
        const [doc, customTemplates] = await Promise.all([
          getGeneratedDocument(projectId, documentType, isSnapshot, snapshotId),
          (hasEditAccess && !isSnapshot) ? getCustomTemplates(orgId, documentType) : Promise.resolve([])
        ])
        if (!isMounted) return

        // Refine template if the saved doc has a different variant
        const activeTemplateId = doc?.free_text_content?.['__prd_template_variant'] || doc?.custom_template_id || fallbackTemplateId
        if (activeTemplateId !== fallbackTemplateId) {
          const refinedTpl = getSyncDocumentTemplate(documentType, activeTemplateId)
          setTemplate(refinedTpl)
        }

        setGeneratedDoc(doc)

        if (!doc && customTemplates.length > 0) {
          setAvailableCustomTemplates(customTemplates)
        }
      } catch (err) {
        console.error('Error loading document draft:', err)
        if (onShowToast) onShowToast('error', 'Failed to load document')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, projectId, isSnapshot, snapshotId, orgId, hasEditAccess])

  const handleShowSelector = async () => {
    if (availableCustomTemplates.length === 0) {
      const customTemplates = await getCustomTemplates(projectContext.organization_id, documentType)
      setAvailableCustomTemplates(customTemplates)
    }
    setNeedsTemplateSelection(true)
  }

  const handleSelectTemplate = async (templateId?: string) => {
    const tpl = getSyncDocumentTemplate(documentType, templateId)
    setTemplate(tpl)
    setNeedsTemplateSelection(false)
    const res = await updateDocumentTemplateId(projectId, documentType, tpl.id)
    if (res.ok) {
      const refreshed = await getGeneratedDocument(projectId, documentType, isSnapshot, snapshotId)
      setGeneratedDoc(refreshed)
    }
  }

  const handleSelectTemplateVariant = async (variantId: string) => {
    // 0ms instant UI template update!
    const tpl = getSyncDocumentTemplate(documentType, variantId)
    setTemplate(tpl)
    setIsPrdModalOpen(false)
    setIsStrategyModalOpen(false)
    setIsRoadmapModalOpen(false)
    setIsMarketResearchModalOpen(false)
    setIsCharterModalOpen(false)
    setIsStakeholderModalOpen(false)
    setIsRiskModalOpen(false)
    const res = await updateDocumentTemplateId(projectId, documentType, variantId)
    if (res.ok) {
      const refreshed = await getGeneratedDocument(projectId, documentType, isSnapshot, snapshotId)
      setGeneratedDoc(refreshed)
      onShowToast('success', `Swapped to ${tpl.name || 'template'}`)
    } else {
      console.error('[Template Error] Failed to update template in database:', res.error)
      onShowToast('error', res.error || 'Failed to update template in database')
    }
  }

  const handleOpenSelector = () => {
    const isMarketResearchType =
      documentType === 'market_research_report' ||
      documentType === 'market_research_workspace' ||
      documentType === 'competitive_analysis_workspace' ||
      documentType === 'competitive_benchmarking_matrix'

    if (documentType === 'product_requirements_document') {
      setIsPrdModalOpen(true)
    } else if (documentType === 'product_strategy_document') {
      setIsStrategyModalOpen(true)
    } else if (documentType === 'charter') {
      setIsCharterModalOpen(true)
    } else if (documentType === 'stakeholder_register') {
      setIsStakeholderModalOpen(true)
    } else if (documentType === 'risk_register') {
      setIsRiskModalOpen(true)
      return
    }

    if (documentType === 'scope_statement') {
      setIsScopeStatementModalOpen(true)
      return
    }

    if (documentType === 'change_management_plan') {
      setIsChangeManagementModalOpen(true)
      return
    }

    if (documentType === 'handover_document') {
      setIsHandoverModalOpen(true)
      return
    } else if (documentType === 'roadmap_workspace' || documentType === 'product_roadmap_document' || documentType === 'product_roadmap') {
      setIsRoadmapModalOpen(true)
    } else if (isMarketResearchType) {
      setIsMarketResearchModalOpen(true)
    } else {
      handleShowSelector()
    }
  }

  const handleDocumentSaved = async () => {
    const refreshed = await getGeneratedDocument(projectId, documentType, isSnapshot, snapshotId)
    setGeneratedDoc(refreshed)
  }

  if (isLoading) {
    return <DocumentLoader message="Loading document workspace..." />
  }

  if (needsTemplateSelection) {
    return (
      <div className="flex flex-col h-full min-h-[600px] items-center justify-center bg-app-surface border border-app-border rounded-xl shadow-sm p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center mb-6">
          <LayoutTemplate className="w-8 h-8 text-violet-500" />
        </div>
        <h2 className="text-2xl font-bold text-app-fg mb-2">Select a Template</h2>
        <p className="text-app-muted max-w-md mb-8">
          Your organization has custom templates available for {documentType.replace('_', ' ')}. Which one would you like to use for this project?
        </p>

        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Default Template Option */}
          <button
            onClick={() => handleSelectTemplate()}
            className={`flex flex-col p-5 bg-white dark:bg-app-surface border ${template && !template.is_custom ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md' : 'border-app-border hover:border-violet-500 hover:shadow-md'} rounded-2xl transition-all group text-left relative overflow-hidden`}
          >
            {template && !template.is_custom && (
              <div className="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                In Use
              </div>
            )}
            <div className="flex justify-between items-start w-full mb-3">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <ArrowRight className="w-4 h-4 text-app-muted group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
            </div>
            <h3 className="font-semibold text-app-fg mb-1">System Default Template</h3>
            <p className="text-xs text-app-muted">The standard platform structure.</p>
          </button>

          {/* Custom Template Options */}
          {availableCustomTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`flex flex-col p-5 bg-white dark:bg-app-surface border ${template && template.id === t.id ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md' : 'border-app-border hover:border-violet-500 hover:shadow-md'} rounded-2xl transition-all group text-left relative overflow-hidden`}
            >
              {template && template.id === t.id && (
                <div className="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  In Use
                </div>
              )}
              <div className="flex justify-between items-start w-full mb-3">
                <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                  <LayoutTemplate className="w-5 h-5 text-violet-500" />
                </div>
                <ArrowRight className="w-4 h-4 text-app-muted group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
              </div>
              <h3 className="font-semibold text-app-fg mb-1">{t.name}</h3>
              <p className="text-xs text-app-muted line-clamp-1">{t.description || "Organization custom template"}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <DocumentEngine
        key={template.id}
        projectId={projectId}
        projectContext={projectContext}
        template={template}
        generatedDoc={generatedDoc}
        hasEditAccess={hasEditAccess}
        onShowToast={onShowToast}
        isSnapshot={isSnapshot}
        onShowTemplateSelector={!isSnapshot && hasEditAccess ? handleOpenSelector : undefined}
        onSaveSuccess={handleDocumentSaved}
      />

      <PrdTemplateSelectorModal
        isOpen={isPrdModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsPrdModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <StrategyTemplateSelectorModal
        isOpen={isStrategyModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsStrategyModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <RoadmapTemplateSelectorModal
        isOpen={isRoadmapModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsRoadmapModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <MarketResearchTemplateSelectorModal
        isOpen={isMarketResearchModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsMarketResearchModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <CharterTemplateSelectorModal
        isOpen={isCharterModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsCharterModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <StakeholderTemplateSelectorModal
        isOpen={isStakeholderModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsStakeholderModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <RiskTemplateSelectorModal
        isOpen={isRiskModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsRiskModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <ScopeStatementTemplateSelectorModal
        isOpen={isScopeStatementModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsScopeStatementModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <ChangeManagementTemplateSelectorModal
        isOpen={isChangeManagementModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsChangeManagementModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />

      <HandoverTemplateSelectorModal
        isOpen={isHandoverModalOpen}
        currentTemplateId={template.id}
        onClose={() => setIsHandoverModalOpen(false)}
        onSelectTemplate={handleSelectTemplateVariant}
      />
    </>
  )
}
