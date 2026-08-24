'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { revalidatePath } from 'next/cache'

/**
 * Marks relevant documents as stale when underlying interactive data changes.
 */
export async function markDocumentsStale(projectId: string, organizationId: string, reason: string) {
  if (!projectId || !organizationId) return { success: false, error: 'Missing required parameters' }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('generated_documents')
    .update({ 
      is_stale: true,
      stale_reason: reason
    })
    .eq('project_id', projectId)
    // We target Strategy docs and Charters which heavily rely on Personas
    .in('document_type', ['product_strategy_document', 'charter'])
    .eq('is_snapshot', false)

  if (error) {
    console.error('Failed to mark documents stale:', error)
    return { success: false, error: error.message }
  }

  // Optionally revalidate any paths
  return { success: true }
}

/**
 * AI-driven auto-reconciliation of a stale document.
 */
export async function reconcileDocument(documentId: string, projectId: string) {
  if (!documentId || !projectId) {
    return { success: false, error: 'Missing parameters' }
  }

  try {
    const supabaseAdmin = createAdminClient()
    // 1. Fetch the document
    const { data: doc, error: docError } = await supabaseAdmin
      .from('generated_documents')
      .select('id, document_type, free_text_content')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return { success: false, error: docError?.message || 'Document not found' }
    }

    // 2. Fetch the latest personas for the project
    const { data: personas, error: pErr } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('project_id', projectId)

    if (pErr) {
      return { success: false, error: pErr.message }
    }

    // 3. Format Personas context
    const personaContext = personas && personas.length > 0 
      ? personas.map((p: any) => `
        - Name/Role: ${p.role_name}
        - Job to be Done: ${p.jtbd_statement}
        - Motivations: ${p.motivations || 'None'}
        - Pain Points: ${p.pain_points || 'None'}
      `).join('\n')
      : 'No personas defined.'

    // 4. Generate updated text using AI
    const systemPrompt = `You are a Principal Product Manager. You are reconciling an existing document with a newly updated Personas Database.
    
Your task is to rewrite the provided document content so that its "Target Audience", "Target Customers", or "Market" sections perfectly reflect the updated personas provided below.
DO NOT change the structure of the JSON object. Keep all existing sections that are unrelated to the target audience EXACTLY as they are.

LATEST PERSONAS DATABASE CONTEXT:
${personaContext}`

    const userPrompt = `Here is the current document content (JSON representation of sections):
${JSON.stringify(doc.free_text_content, null, 2)}

Please return the fully updated JSON object containing all sections.`

    const result = await generateStructuredJson({
      systemPrompt,
      userPrompt
    })

    if (!result) {
      return { success: false, error: 'AI failed to generate a response.' }
    }

    // 5. Save back to DB and clear stale flag
    const { error: updateError } = await supabaseAdmin
      .from('generated_documents')
      .update({
        free_text_content: result,
        is_stale: false,
        stale_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }

  } catch (error: any) {
    console.error('Reconciliation error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
