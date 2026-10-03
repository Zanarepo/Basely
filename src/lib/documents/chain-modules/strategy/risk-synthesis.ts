'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 4. Synthesize Risk Register from Charter and Scope
 */
export async function synthesizeRiskRegisterFromCharterAndScope(
  projectId: string
): Promise<{ ok: boolean; documentId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // Fetch Charter and Scope documents
    const { data: documents } = await adminSupabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .in('document_type', ['charter', 'scope_statement'])
      .eq('is_snapshot', false)

    if (!documents || documents.length === 0) {
      return { ok: false, error: 'Project Charter and Scope Statement are missing.' }
    }

    const charterDoc = documents.find(d => d.document_type === 'charter')
    const scopeDoc = documents.find(d => d.document_type === 'scope_statement')

    let combinedContext = ''
    if (charterDoc?.free_text_content) {
      combinedContext += `--- PROJECT CHARTER ---\n${JSON.stringify(charterDoc.free_text_content)}\n\n`
    }
    if (scopeDoc?.free_text_content) {
      combinedContext += `--- SCOPE STATEMENT ---\n${JSON.stringify(scopeDoc.free_text_content)}\n\n`
    }

    if (combinedContext.length < 100) {
      return { ok: false, error: 'Not enough content in the Charter or Scope Statement.' }
    }

    const systemPrompt = `You are Praz-AI, an expert Risk Manager. Your task is to generate a comprehensive Risk Register document for a project based on its Project Charter and Scope Statement.
Identify potential threats by looking for aggressive timelines, ambiguous scope items, complex deliverables, or external dependencies.

Format your output as a JSON object with ALL of the following exact keys corresponding to the standard risk register sections. Each value must be a rich markdown string:
{
  "purpose": "1 paragraph explaining the purpose of this risk register in the context of the project goals.",
  "risk_management_approach": "Overview of the proactive risk management process steps and methodology.",
  "risk_assessment_matrix": "Markdown table explaining Probability (1-5) and Impact (1-5) scales, and the resulting priority matrix.",
  "risk_register": "A detailed Markdown table of identified risks: | Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |",
  "top_project_risks": "Detailed breakdown of the top 3-5 most critical risks identified, and why they matter.",
  "risk_response_strategies": "Outline of Avoid, Mitigate, Transfer, Accept strategies applied to the top risks.",
  "risk_monitoring": "How risks will be tracked and reviewed throughout the project lifecycle.",
  "risk_escalation_process": "Clear escalation paths and thresholds based on risk priority.",
  "risk_review_schedule": "Frequency and format of risk reviews (e.g., Weekly Project Status Meetings).",
  "approval": "Approval sign-off table: | Role | Name | Date | Status |"
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: `DOCUMENTS TO ANALYZE:\n${combinedContext.substring(0, 20000)}`,
    })

    const templateVariantId = 'standard_risk_register'
    const syncTpl = getSyncDocumentTemplate('risk_register', templateVariantId)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      __prd_template_variant: templateVariantId,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    // Upsert the risk register document
    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'risk_register')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const mergedFreeText = {
        ...(existing.free_text_content as Record<string, string> || {}),
        ...freeTextPayload,
      }
      const { error } = await adminSupabase
        .from('generated_documents')
        .update({
          free_text_content: mergedFreeText,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (error) throw error
      return { ok: true, documentId: existing.id }
    } else {
      const { data: newDoc, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'risk_register',
          document_title: 'Risk Register',
          free_text_content: freeTextPayload,
          is_snapshot: false,
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (error) throw error
      return { ok: true, documentId: newDoc.id }
    }
  } catch (err: any) {
    console.error('[synthesizeRiskRegisterFromCharterAndScope Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize Risk Register.' }
  }
}

