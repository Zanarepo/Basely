'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { SCOPE_STATEMENT_TEMPLATE_VARIANTS } from '@/lib/documents/scope-statement-templates'

export async function generateScopeFromCharter(
  projectId: string,
  organizationId: string,
  templateVariantId: string
): Promise<{ success: boolean; data?: Record<string, string>; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch Charter Document
    const { data: charterDoc, error: charterError } = await supabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'charter')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (charterError) {
      throw new Error('Failed to fetch Project Charter.')
    }

    if (!charterDoc || !charterDoc.free_text_content || Object.keys(charterDoc.free_text_content).length === 0) {
      return { success: false, error: 'No Project Charter found for this project, or the Charter is empty. Please complete the Project Charter first.' }
    }

    // Combine charter text
    const charterText = Object.entries(charterDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.replace(/_/g, ' ').toUpperCase()}]\n${v}`)
      .join('\n\n')

    if (charterText.length < 50) {
      return { success: false, error: 'The Project Charter does not have enough content to generate a Scope Statement.' }
    }

    // 2. Get the template schema
    const variant = SCOPE_STATEMENT_TEMPLATE_VARIANTS[templateVariantId] || SCOPE_STATEMENT_TEMPLATE_VARIANTS['standard_scope_statement']
    
    const schemaKeys = variant.section_definitions.map(s => `"${s.key}": "string (Markdown formatted: ${s.title} - ${s.placeholder})"`)
    
    // 3. Build AI Prompt
    const systemPrompt = `You are Praz-AI, an expert Project Manager. Your task is to draft a comprehensive Project Scope Statement based on the provided Project Charter.
You must output strictly a JSON object with the exact keys requested. Each value must be a rich markdown string suitable for a professional document.
Expand logically on the Charter to define clear boundaries, deliverables, and exclusions.

Output JSON Schema:
{
  ${schemaKeys.join(',\n  ')}
}
CRITICAL: Return ONLY strictly valid JSON. Escape all newlines as \\n inside string values.`

    // 4. Generate JSON via AI
    console.log(`🤖 [Scope AI] Generating Scope Statement for project: ${projectId} using template ${templateVariantId}`)
    const result = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: `--- APPROVED PROJECT CHARTER ---\n\n${charterText.substring(0, 15000)}`
    })

    // 5. Save directly to generated_documents to persist the state immediately
    const { data: existingDoc } = await supabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'scope_statement')
      .eq('is_snapshot', false)
      .maybeSingle()

    const newFreeText = {
      ...(existingDoc?.free_text_content as Record<string, string> || {}),
      ...result
    }

    if (existingDoc) {
      await supabase.from('generated_documents').update({ free_text_content: newFreeText }).eq('id', existingDoc.id)
    } else {
      await supabase.from('generated_documents').insert({
        project_id: projectId,
        document_type: 'scope_statement',
        free_text_content: newFreeText,
        template_id: templateVariantId,
        is_snapshot: false
      })
    }

    // 6. Log Governance
    await logGovernanceEvent(organizationId, 'ai_generation', {
      action: 'scope_statement_generation',
      project_id: projectId,
      template_id: templateVariantId
    }).catch(console.error)

    return { success: true, data: result }
  } catch (err: any) {
    console.error('generateScopeFromCharter failed:', err)
    return { success: false, error: err.message }
  }
}
