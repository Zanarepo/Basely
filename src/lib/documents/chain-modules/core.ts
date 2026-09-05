
'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../prd-templates'
import { STATIC_TEMPLATES } from '../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'


export async function chainDocumentGeneration(
  projectId: string,
  targetDocumentType: string,
  upstreamDocumentType: string,
  personaRole: string = 'Senior Product Manager',
  actionInstruction: string = 'Synthesize the upstream document into the target document format.',
  uiTemplateId?: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch Upstream Document
    // 1. Fetch Upstream Document Content with lifecycle fallbacks
    let upstreamDocContent: Record<string, string> | null = null
    let resolvedUpstreamType = upstreamDocumentType

    const { data: primaryDoc } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', upstreamDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (primaryDoc?.free_text_content && Object.keys(primaryDoc.free_text_content).length > 0) {
      upstreamDocContent = primaryDoc.free_text_content as Record<string, string>
    } else {
      // Upstream fallbacks based on product lifecycle
      const fallbacks: Record<string, string[]> = {
        'prioritization_workspace': ['product_strategy_document', 'opportunity_assessment_workspace'],
        'opportunity_assessment_workspace': ['problem_definition_workspace', 'customer_research_workspace', 'customer_research_strategy'],
        'roadmap_workspace': ['prioritization_workspace', 'product_strategy_document', 'opportunity_assessment_workspace'],
        'product_roadmap_document': ['prioritization_workspace', 'product_strategy_document', 'opportunity_assessment_workspace'],
        'product_roadmap': ['prioritization_workspace', 'product_strategy_document', 'opportunity_assessment_workspace'],
        'solution_design_workspace': ['roadmap_workspace', 'product_roadmap_document', 'prioritization_workspace', 'product_strategy_document'],
        'solution_validation_workspace': ['solution_design_workspace', 'roadmap_workspace', 'product_roadmap_document'],
        'product_requirements_document': ['solution_validation_workspace', 'solution_design_workspace', 'roadmap_workspace', 'product_roadmap_document'],
      }

      const potentialFallbacks = fallbacks[upstreamDocumentType] || []
      for (const fallbackType of potentialFallbacks) {
        const { data: fallbackDoc } = await adminSupabase
          .from('generated_documents')
          .select('free_text_content')
          .eq('project_id', projectId)
          .eq('document_type', fallbackType)
          .eq('is_snapshot', false)
          .maybeSingle()

        if (fallbackDoc?.free_text_content && Object.keys(fallbackDoc.free_text_content).length > 0) {
          upstreamDocContent = fallbackDoc.free_text_content as Record<string, string>
          resolvedUpstreamType = fallbackType
          break
        }
      }
    }

    if (!upstreamDocContent) {
      return { ok: false, error: `Required upstream document (${upstreamDocumentType}) is missing or empty. Please generate it first.` }
    }

    // 2. Format Upstream Context
    const upstreamText = Object.entries(upstreamDocContent)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
      .join('\n\n')
      
    const rawContext = `
[UPSTREAM CONTEXT: ${resolvedUpstreamType.toUpperCase()}]
${upstreamText}
`

    // 3. Construct JSON Schema from Target Template
    // First, try to see what template the target document is actually using
    const { data: targetDoc } = await adminSupabase
      .from('generated_documents')
      .select('id, template_id, section_definitions, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', targetDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    let template: any = null
    let sectionDefs: any[] = []

    if (targetDoc?.section_definitions && Array.isArray(targetDoc.section_definitions)) {
       sectionDefs = targetDoc.section_definitions
    } else {
       template = STATIC_TEMPLATES[targetDocumentType]
       if (!template) {
          const finalTemplateId = uiTemplateId || targetDoc?.template_id || undefined
          template = getSyncDocumentTemplate(targetDocumentType, finalTemplateId)
       }
       if (template && template.section_definitions) {
          sectionDefs = template.section_definitions
       }
    }
    
    // Filter to only free_text sections — data_bound sections are auto-populated elsewhere
    const freeTextSections = sectionDefs.filter((s: any) => s.type !== 'data_bound')
    
    if (!freeTextSections || freeTextSections.length === 0) {
       return { ok: false, error: `No free-text sections found in template for ${targetDocumentType}.` }
    }
    
    let schemaObj: Record<string, string> = {}
    for (const section of freeTextSections) {
       let desc = `Markdown string for: ${section.title}`
       if (section.placeholder) {
         desc += `. Format exactly like this placeholder structure: ${section.placeholder.replace(/\n/g, ' ')}`
       }
       schemaObj[section.key] = desc
    }
    
    const schemaString = JSON.stringify(schemaObj, null, 2)

    // 4. Construct Prompt
    const systemPrompt = `You are Praz-AI, a ${personaRole}. ${actionInstruction}

CRITICAL CITATION & EVIDENCE REQUIREMENT:
For EVERY section you generate that includes claims, statistics, market data, competitor information, methodologies, or factual statements, you MUST provide verifiable citations within the markdown text. 
Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST generate valid Google Search URLs that the user can click to instantly verify your claim. Format: [Search Term](https://www.google.com/search?q=search+term+here).
Example format: "The market is expected to reach $100B by 2025 ([Verify on Google](https://www.google.com/search?q=global+market+report+2025+size))."
If referencing the provided upstream context, cite it explicitly (e.g., "As established in the upstream document...").

Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
${schemaString}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    // 5. Merge with any existing free_text_content so data_bound sections are preserved
    const existingContent = targetDoc?.free_text_content as Record<string, string> || {}
    const mergedPayload: Record<string, string> = {
      ...existingContent,
      ...parsedResult,
    }

    // 6. Persist directly to the database — avoids client-side state race conditions
    const now = new Date().toISOString()
    if (targetDoc?.id) {
      await adminSupabase
        .from('generated_documents')
        .update({ free_text_content: mergedPayload, updated_at: now })
        .eq('id', targetDoc.id)
    } else {
      await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: targetDocumentType,
          template_id: uiTemplateId || targetDoc?.template_id || null,
          free_text_content: mergedPayload,
          is_snapshot: false,
          created_at: now,
          updated_at: now,
        })
    }

    // Invalidate the page so Next.js re-fetches the updated document
    revalidatePath(`/dashboard/projects/${projectId}`)

    return { ok: true, data: mergedPayload }

  } catch (err: any) {
    console.error(`[chainDocumentGeneration Error for ${targetDocumentType}]:`, err)
    return { ok: false, error: err.message || 'Failed to generate document' }
  }
}
