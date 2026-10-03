'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { CHARTER_TEMPLATE_VARIANTS } from '@/lib/documents/charter-templates'

export async function generateCharterFromInitiation(
  projectId: string,
  organizationId: string,
  templateVariantId: string
): Promise<{ success: boolean; data?: Record<string, string>; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Fetch Business Case
    const { data: bcs, error: bcError } = await supabase
      .from('business_cases')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    // 2. Fetch Feasibility Study
    const { data: fss, error: fsError } = await supabase
      .from('feasibility_studies')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (bcError || fsError) {
      throw new Error('Failed to fetch initiation context.')
    }

    const bc = bcs && bcs.length > 0 ? bcs[0] : null
    const fs = fss && fss.length > 0 ? fss[0] : null

    if (!bc && !fs) {
      return { success: false, error: 'No Business Case or Feasibility Study found linked to this project. Please link them in the Initiation phase first.' }
    }

    // 3. Get the template schema
    const variant = CHARTER_TEMPLATE_VARIANTS[templateVariantId] || CHARTER_TEMPLATE_VARIANTS['enterprise_project_charter']
    
    const schemaKeys = variant.section_definitions.map(s => `"${s.key}": "string (Markdown formatted: ${s.title} - ${s.placeholder})"`)
    
    // 4. Build AI Prompt
    const systemPrompt = `You are Praz-AI, an expert Enterprise Project Manager. Your task is to draft a formal Project Charter based on the provided Business Case and Feasibility Study.
You must output strictly a JSON object with the exact keys requested. Each value must be a rich markdown string suitable for a professional document. Use professional, authoritative tone.
Be highly detailed, synthesize the inputs, and expand logically where necessary (e.g. inventing reasonable assumptions if not explicitly stated, but keeping it grounded in the context provided).

Output JSON Schema:
{
  ${schemaKeys.join(',\n  ')}
}
CRITICAL: Return ONLY strictly valid JSON. Escape all newlines as \\n inside string values.`

    const userPrompt = `Project Context:
--- BUSINESS CASE ---
Name: ${bc?.name || 'N/A'}
Problem: ${bc?.problem_statement || 'N/A'}
Proposed Solution: ${bc?.proposed_solution || 'N/A'}
Cost: ${bc?.estimated_cost ? '$' + bc.estimated_cost : 'N/A'}
Benefit: ${bc?.estimated_benefit || 'N/A'}
Recommendation: ${bc?.recommendation || 'N/A'}

--- FEASIBILITY STUDY ---
Name: ${fs?.name || 'N/A'}
Technical: ${fs?.technical_assessment || 'N/A'}
Financial: ${fs?.financial_assessment || 'N/A'}
Operational: ${fs?.operational_assessment || 'N/A'}
Recommendation: ${fs?.overall_recommendation || 'N/A'}
`

    // 5. Generate JSON via AI
    console.log(`🤖 [Charter AI] Generating charter for project: ${projectId} using template ${templateVariantId}`)
    const result = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt
    })

    // 6. Save directly to generated_documents to persist the state immediately
    const { data: existingDoc } = await supabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'charter')
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
        document_type: 'charter',
        free_text_content: newFreeText,
        template_id: templateVariantId,
        is_snapshot: false
      })
    }

    // 7. Log Governance
    await logGovernanceEvent(organizationId, 'ai_generation', {
      action: 'project_charter_generation',
      project_id: projectId,
      template_id: templateVariantId
    }).catch(console.error)

    return { success: true, data: result }
  } catch (err: any) {
    console.error('generateCharterFromInitiation failed:', err)
    return { success: false, error: err.message }
  }
}
