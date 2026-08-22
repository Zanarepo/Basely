import type { DocumentSectionDef } from './types'
import { PRD_TEMPLATE_VARIANTS } from './prd-variants'
import { STRATEGY_TEMPLATE_VARIANTS } from './strategy-templates'
import { ROADMAP_TEMPLATE_VARIANTS } from './roadmap-templates'
import { MARKET_RESEARCH_TEMPLATE_VARIANTS } from './market-research-templates'
import { CHARTER_TEMPLATE_VARIANTS } from './charter-templates'
import { STAKEHOLDER_TEMPLATE_VARIANTS } from './stakeholder-templates'
import { RISK_TEMPLATE_VARIANTS } from './risk-templates'
import { SCOPE_STATEMENT_TEMPLATE_VARIANTS } from './scope-statement-templates'
import { CHANGE_MANAGEMENT_TEMPLATE_VARIANTS } from './change-management-templates'
import { HANDOVER_TEMPLATE_VARIANTS } from './handover-templates'
import { STATIC_TEMPLATES } from './static-templates'

export function getSyncDocumentTemplate(documentType: string, templateId?: string): any {
  // 1. If a specific template ID is requested and it's a dynamic variant, resolve it
  if (templateId) {
    const variant = 
      PRD_TEMPLATE_VARIANTS[templateId] || 
      STRATEGY_TEMPLATE_VARIANTS[templateId] || 
      ROADMAP_TEMPLATE_VARIANTS[templateId] || 
      MARKET_RESEARCH_TEMPLATE_VARIANTS[templateId] || 
      CHARTER_TEMPLATE_VARIANTS[templateId] || 
      STAKEHOLDER_TEMPLATE_VARIANTS[templateId] || 
      RISK_TEMPLATE_VARIANTS[templateId] || 
      SCOPE_STATEMENT_TEMPLATE_VARIANTS[templateId] ||
      CHANGE_MANAGEMENT_TEMPLATE_VARIANTS[templateId] ||
      HANDOVER_TEMPLATE_VARIANTS[templateId]

    if (variant) {
      return {
        id: variant.id,
        name: variant.name,
        document_type: documentType || 'product_requirements_document',
        is_custom: true, // It's explicitly selected
        created_at: new Date().toISOString(),
        section_definitions: variant.section_definitions,
      }
    }
  }

  // 2. Check Static Templates (the hardcoded 1-format docs)
  if (STATIC_TEMPLATES[documentType]) {
    return {
      ...STATIC_TEMPLATES[documentType],
      created_at: new Date().toISOString()
    }
  }

  // 3. Fallback logic for dynamic types when no templateId is provided (or if provided id wasn't found)
  
  if (documentType === 'charter') {
    const charterVariant = templateId
      ? CHARTER_TEMPLATE_VARIANTS[templateId] || CHARTER_TEMPLATE_VARIANTS['enterprise_project_charter']
      : CHARTER_TEMPLATE_VARIANTS['enterprise_project_charter']
    return {
      id: charterVariant.id,
      name: charterVariant.name,
      document_type: 'charter',
      is_custom: charterVariant.id !== 'enterprise_project_charter',
      created_at: new Date().toISOString(),
      section_definitions: charterVariant.section_definitions,
    }
  }

  if (documentType === 'stakeholder_register') {
    const stakeholderVariant = templateId
      ? STAKEHOLDER_TEMPLATE_VARIANTS[templateId] || STAKEHOLDER_TEMPLATE_VARIANTS['standard_stakeholder_register']
      : STAKEHOLDER_TEMPLATE_VARIANTS['standard_stakeholder_register']
    return {
      id: stakeholderVariant.id,
      name: stakeholderVariant.name,
      document_type: 'stakeholder_register',
      is_custom: stakeholderVariant.id !== 'standard_stakeholder_register',
      created_at: new Date().toISOString(),
      section_definitions: stakeholderVariant.section_definitions,
    }
  }

  if (documentType === 'risk_register') {
    const riskVariant = templateId
      ? RISK_TEMPLATE_VARIANTS[templateId] || RISK_TEMPLATE_VARIANTS['standard_risk_register']
      : RISK_TEMPLATE_VARIANTS['standard_risk_register']
    return {
      id: riskVariant.id,
      name: riskVariant.name,
      document_type: 'risk_register',
      is_custom: riskVariant.id !== 'standard_risk_register',
      created_at: new Date().toISOString(),
      section_definitions: riskVariant.section_definitions,
    }
  }

  if (documentType === 'scope_statement') {
    const scopeVariant = templateId
      ? SCOPE_STATEMENT_TEMPLATE_VARIANTS[templateId] || SCOPE_STATEMENT_TEMPLATE_VARIANTS['standard_scope_statement']
      : SCOPE_STATEMENT_TEMPLATE_VARIANTS['standard_scope_statement']
    return {
      id: scopeVariant.id,
      name: scopeVariant.name,
      document_type: 'scope_statement',
      is_custom: scopeVariant.id !== 'standard_scope_statement',
      created_at: new Date().toISOString(),
      section_definitions: scopeVariant.section_definitions,
    }
  }

  if (documentType === 'change_management_plan') {
    const changeVariant = templateId
      ? CHANGE_MANAGEMENT_TEMPLATE_VARIANTS[templateId] || CHANGE_MANAGEMENT_TEMPLATE_VARIANTS['standard_change_management']
      : CHANGE_MANAGEMENT_TEMPLATE_VARIANTS['standard_change_management']
    return {
      id: changeVariant.id,
      name: changeVariant.name,
      document_type: 'change_management_plan',
      is_custom: changeVariant.id !== 'standard_change_management',
      created_at: new Date().toISOString(),
      section_definitions: changeVariant.section_definitions,
    }
  }

  if (documentType === 'handover_document') {
    const handoverVariant = templateId
      ? HANDOVER_TEMPLATE_VARIANTS[templateId] || HANDOVER_TEMPLATE_VARIANTS['standard_handover']
      : HANDOVER_TEMPLATE_VARIANTS['standard_handover']
    return {
      id: handoverVariant.id,
      name: handoverVariant.name,
      document_type: 'handover_document',
      is_custom: handoverVariant.id !== 'standard_handover',
      created_at: new Date().toISOString(),
      section_definitions: handoverVariant.section_definitions,
    }
  }

  if (documentType === 'product_strategy_document') {
    const stratVariant = templateId
      ? STRATEGY_TEMPLATE_VARIANTS[templateId] || STRATEGY_TEMPLATE_VARIANTS['standard_product_strategy']
      : STRATEGY_TEMPLATE_VARIANTS['standard_product_strategy']
    return {
      id: stratVariant.id,
      name: stratVariant.name,
      document_type: 'product_strategy_document',
      is_custom: stratVariant.id !== 'standard_product_strategy',
      created_at: new Date().toISOString(),
      section_definitions: stratVariant.section_definitions,
    }
  }

  if (documentType === 'roadmap_workspace' || documentType === 'product_roadmap_document' || documentType === 'product_roadmap') {
    const roadmapVariant = templateId
      ? ROADMAP_TEMPLATE_VARIANTS[templateId] || ROADMAP_TEMPLATE_VARIANTS['now_next_later']
      : ROADMAP_TEMPLATE_VARIANTS['now_next_later']
    return {
      id: roadmapVariant.id,
      name: roadmapVariant.name,
      document_type: documentType,
      is_custom: roadmapVariant.id !== 'now_next_later',
      created_at: new Date().toISOString(),
      section_definitions: roadmapVariant.section_definitions,
    }
  }

  if (
    documentType === 'market_research_report' ||
    documentType === 'market_research_workspace' ||
    documentType === 'competitive_analysis_workspace' ||
    documentType === 'competitive_benchmarking_matrix' // handled above by static templates if it matches exactly, but kept here for fallback safety if market research variants handle it differently
  ) {
    // If it was exactly competitive_benchmarking_matrix, it was caught by STATIC_TEMPLATES.
    // So this primarily catches the others.
    const defaultVariantKey =
      documentType === 'competitive_analysis_workspace' || documentType === 'competitive_benchmarking_matrix'
        ? 'competitive_analysis_matrix'
        : 'master_market_research'

    const researchVariant = templateId
      ? MARKET_RESEARCH_TEMPLATE_VARIANTS[templateId] || MARKET_RESEARCH_TEMPLATE_VARIANTS[defaultVariantKey]
      : MARKET_RESEARCH_TEMPLATE_VARIANTS[defaultVariantKey]

    return {
      id: researchVariant.id,
      name: researchVariant.name,
      document_type: documentType,
      is_custom: researchVariant.id !== defaultVariantKey,
      created_at: new Date().toISOString(),
      section_definitions: researchVariant.section_definitions,
    }
  }

  // Fallback for PRD (default)
  const defaultSectionDefs: DocumentSectionDef[] = [
    { key: 'prd_objective', title: 'Objective & Business Value', type: 'data_bound', source: 'prd.objective_overview' },
    { key: 'prd_scope_in', title: 'In Scope', type: 'free_text' },
    { key: 'prd_scope_out', title: 'Out of Scope', type: 'free_text' },
    { key: 'prd_acceptance_criteria', title: 'Acceptance Criteria', type: 'free_text' },
    { 
      key: 'prd_telemetry', 
      title: 'Tracking & Metrics', 
      type: 'free_text',
      placeholder: 'Example:\n- Click rate on the "Checkout" button\n- Time spent on the new form (Goal: < 30s)\n- Daily Active Users (DAU) interacting with the feature'
    },
    { key: 'prd_discovery_insights', title: 'Linked Discovery Insights (VoC Evidence)', type: 'data_bound', source: 'prd.discovery_insights' },
    { key: 'prd_wireframes', title: 'UX Wireframes & Visual Specifications', type: 'free_text' }
  ]

  // selectedVariant might be a PRD or Strategy variant if we somehow reached here with an invalid templateId
  const selectedVariant = templateId ? (PRD_TEMPLATE_VARIANTS[templateId] || null) : null
  
  return {
    id: selectedVariant ? selectedVariant.id : 'product_requirements_document_template',
    document_type: documentType || 'product_requirements_document',
    is_custom: !!selectedVariant,
    created_at: new Date().toISOString(),
    section_definitions: selectedVariant ? selectedVariant.section_definitions : defaultSectionDefs
  }
}
