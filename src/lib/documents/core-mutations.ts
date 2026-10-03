'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { checkProjectFeatureAccess } from '@/lib/organizations/tier-logic'
import { PRD_TEMPLATE_VARIANTS } from './prd-templates'
import { STRATEGY_TEMPLATE_VARIANTS } from './strategy-templates'
import { ROADMAP_TEMPLATE_VARIANTS } from './roadmap-templates'
import { MARKET_RESEARCH_TEMPLATE_VARIANTS } from './market-research-templates'
import { CHARTER_TEMPLATE_VARIANTS } from './charter-templates'
import { STAKEHOLDER_TEMPLATE_VARIANTS } from './stakeholder-templates'
import { RISK_TEMPLATE_VARIANTS } from './risk-templates'
import { SCOPE_STATEMENT_TEMPLATE_VARIANTS } from './scope-statement-templates'

function isUuid(val?: string | null): boolean {
  if (!val) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(val)
}

export async function saveGeneratedDocument(
  projectId: string,
  documentType: string,
  freeTextPayload: Record<string, string>,
  isSnapshot = false,
  frozenData?: any,
  periodEnd?: string,
  templateId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
    if (!access.allowed) {
      const err = `Feature locked: Requires ${access.requiredTier} tier`
      console.error(`[Document Action Error] saveGeneratedDocument locked: ${err}`)
      return { ok: false, error: err }
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()
    const validUuid = isUuid(templateId) ? templateId : null
    let docId = ''

    if (isSnapshot) {
      const { data: newDoc, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          custom_template_id: validUuid,
          free_text_content: freeTextPayload,
          is_snapshot: true,
          frozen_data: frozenData,
          period_end: periodEnd,
          generated_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Document Action Error] Failed to insert snapshot document:', error)
        return { ok: false, error: error.message }
      }
      docId = newDoc?.id || projectId
      await logProjectActivity(projectId, 'document', docId, 'published', { period_end: periodEnd, document_type: documentType })
    } else {
      const { data: existing } = await adminSupabase
        .from('generated_documents')
        .select('id, free_text_content')
        .eq('project_id', projectId)
        .eq('document_type', documentType)
        .eq('is_snapshot', false)
        .maybeSingle()

      if (existing) {
        docId = existing.id
        const existingFreeText = (existing.free_text_content as Record<string, string>) || {}
        const mergedFreeText = { ...freeTextPayload }

        if (existingFreeText['__prd_template_variant'] && !mergedFreeText['__prd_template_variant']) {
          mergedFreeText['__prd_template_variant'] = existingFreeText['__prd_template_variant']
        }
        if (existingFreeText['__section_order'] && !mergedFreeText['__section_order']) {
          mergedFreeText['__section_order'] = existingFreeText['__section_order']
        }

        const { error } = await adminSupabase
          .from('generated_documents')
          .update({
            custom_template_id: validUuid,
            free_text_content: mergedFreeText,
            updated_at: now,
          })
          .eq('id', existing.id)

        if (error) {
          console.error('[Document Action Error] Failed to update draft document:', error)
          return { ok: false, error: error.message }
        }
        await logProjectActivity(projectId, 'document', existing.id, 'updated', { document_type: documentType })
      } else {
        const { data: newDoc, error } = await adminSupabase
          .from('generated_documents')
          .insert({
            project_id: projectId,
            document_type: documentType,
            custom_template_id: validUuid,
            free_text_content: freeTextPayload,
            is_snapshot: false,
            generated_at: now,
            updated_at: now,
          })
          .select('id')
          .single()

        if (error) {
          console.error('[Document Action Error] Failed to insert draft document:', error)
          return { ok: false, error: error.message }
        }
        docId = newDoc?.id || projectId
        await logProjectActivity(projectId, 'document', docId, 'created', { document_type: documentType })
      }
    }

    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user?.id) {
      dispatchNotification({
        userId: authData.user.id,
        projectId,
        triggerType: isSnapshot ? 'status_report' : 'document_change',
        referenceEntityType: 'document',
        referenceEntityId: docId || projectId,
        contentSummary: isSnapshot
          ? `Published status report snapshot for period ending ${periodEnd || 'now'}`
          : `Generated/updated ${documentType} document draft`
      }).catch(err => console.error('Webhook notification failed:', err))
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[Document Action Exception] saveGeneratedDocument failed:', err)
    return { ok: false, error: err?.message || 'Failed to save document' }
  }
}

export async function updateDocumentTemplateId(
  projectId: string,
  documentType: string,
  templateId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
    if (!access.allowed) {
      const err = `Feature locked: Requires ${access.requiredTier} tier`
      console.error(`[Document Action Error] updateDocumentTemplateId locked: ${err}`)
      return { ok: false, error: err }
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()
    const validUuid = isUuid(templateId) ? templateId : null
    
    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', documentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const freeText = (existing.free_text_content as Record<string, string>) || {}
      const selectedVariant = templateId
        ? (PRD_TEMPLATE_VARIANTS[templateId] || STRATEGY_TEMPLATE_VARIANTS[templateId] || ROADMAP_TEMPLATE_VARIANTS[templateId] || MARKET_RESEARCH_TEMPLATE_VARIANTS[templateId] || CHARTER_TEMPLATE_VARIANTS[templateId] || STAKEHOLDER_TEMPLATE_VARIANTS[templateId] || RISK_TEMPLATE_VARIANTS[templateId] || SCOPE_STATEMENT_TEMPLATE_VARIANTS[templateId] || null)
        : null

      if (selectedVariant) {
        freeText['__prd_template_variant'] = selectedVariant.id
        freeText['__section_order'] = JSON.stringify(selectedVariant.section_definitions.map((s: any) => s.key))
        delete freeText['__custom_sections']
        delete freeText['__deleted_section_keys']
        delete freeText['__removed_sections_meta']
      } else if (!templateId) {
        delete freeText['__prd_template_variant']
        delete freeText['__section_order']
        delete freeText['__custom_sections']
        delete freeText['__deleted_section_keys']
        delete freeText['__removed_sections_meta']
      }

      const { error } = await adminSupabase
        .from('generated_documents')
        .update({
          custom_template_id: validUuid,
          free_text_content: freeText,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('[Document Action Error] Failed to update document template ID:', error)
        return { ok: false, error: error.message }
      }
    } else {
      const freeText: Record<string, string> = {}
      const selectedVariant = templateId
        ? (PRD_TEMPLATE_VARIANTS[templateId] || STRATEGY_TEMPLATE_VARIANTS[templateId] || ROADMAP_TEMPLATE_VARIANTS[templateId] || MARKET_RESEARCH_TEMPLATE_VARIANTS[templateId] || CHARTER_TEMPLATE_VARIANTS[templateId] || STAKEHOLDER_TEMPLATE_VARIANTS[templateId] || RISK_TEMPLATE_VARIANTS[templateId] || SCOPE_STATEMENT_TEMPLATE_VARIANTS[templateId] || null)
        : null

      if (selectedVariant) {
        freeText['__prd_template_variant'] = selectedVariant.id
        freeText['__section_order'] = JSON.stringify(selectedVariant.section_definitions.map((s: any) => s.key))
      }

      const { error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          custom_template_id: validUuid,
          free_text_content: freeText,
          is_snapshot: false,
          generated_at: now,
          updated_at: now,
        })

      if (error) {
        console.error('[Document Action Error] Failed to insert document with template ID:', error)
        return { ok: false, error: error.message }
      }
    }
    
    return { ok: true }
  } catch (err: any) {
    console.error('[Document Action Exception] updateDocumentTemplateId failed:', err)
    return { ok: false, error: err?.message || 'Failed to update template ID' }
  }
}

export async function regenerateDocument(
  projectId: string,
  documentType: string,
  isSnapshot = false
): Promise<{ ok: boolean; error?: string }> {
  const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
  if (!access.allowed) return { ok: false, error: `Feature locked: Requires ${access.requiredTier} tier` }

  const adminSupabase = createAdminClient()
  const now = new Date().toISOString()

  if (isSnapshot) {
    return { ok: false, error: 'Cannot regenerate a snapshot directly this way' }
  }
  
  const { data: existing } = await adminSupabase
    .from('generated_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', false)
    .maybeSingle()

  if (existing) {
    const { error } = await adminSupabase
      .from('generated_documents')
      .update({ generated_at: now, updated_at: now })
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await adminSupabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        free_text_content: {},
        is_snapshot: false,
        generated_at: now,
        updated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
