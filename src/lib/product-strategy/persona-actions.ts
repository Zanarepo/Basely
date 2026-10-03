'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { markDocumentsStale } from '../documents/reconcile-actions'
import type { Persona } from './types'

export async function getPersonas(organizationId: string, projectId?: string): Promise<Persona[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('personas')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching personas:', error)
    return []
  }
  return data as Persona[]
}

export async function createPersona(payload: Partial<Persona>): Promise<{ ok: boolean; error?: string; data?: Persona }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('personas')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select()
    .single()

  if (error) {
    console.error('Error creating persona:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'persona' as any, data.id, 'created', { name: data.name, role: data.role_title })
    await markDocumentsStale(payload.project_id, payload.organization_id || '', 'Personas document was manually updated.')
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
    revalidatePath('/dashboard', 'layout')
  }
  
  return { ok: true, data: data as Persona }
}

export async function updatePersona(id: string, payload: Partial<Persona>): Promise<{ ok: boolean; error?: string; data?: Persona }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('personas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating persona:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'persona' as any, data.id, 'updated', { name: data.name })
    await markDocumentsStale(data.project_id, data.organization_id || '', 'Personas document was manually updated.')
    revalidatePath(`/dashboard/projects/${data.project_id}`)
    revalidatePath('/dashboard', 'layout')
  }

  return { ok: true, data: data as Persona }
}

export async function deletePersona(id: string, projectId?: string | null): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting persona:', error)
    return { ok: false, error: error.message }
  }

  if (projectId) {
    await logProjectActivity(projectId, 'persona' as any, id, 'deleted', {})
    await markDocumentsStale(projectId, '', 'A persona was deleted from the document.')
    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard', 'layout')
  }

  return { ok: true }
}

export async function autoEnrichPersonaFromInsights(
  personaId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string; updatedPersona?: Persona }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Fetch the persona
    const { data: persona, error: pErr } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('organization_id', organizationId)
      .single()

    if (pErr || !persona) {
      return { success: false, error: 'Persona not found' }
    }

    // 2. Fetch all linked insights
    const { data: insights, error: iErr } = await supabase
      .from('discovery_insights')
      .select('title, description, severity, source')
      .eq('persona_id', personaId)
      .eq('organization_id', organizationId)

    if (iErr) return { success: false, error: iErr.message }
    if (!insights || insights.length === 0) {
      return { success: false, error: 'No discovery insights are linked to this Persona yet.' }
    }

    // 3. Check for Praz-AI availability
    const hasAiKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.OPENAI_API_KEY)
    if (!hasAiKey) {
      return { success: false, error: 'Praz-AI features are not configured. Please add an API key.' }
    }

    // 4. Generate JSON using Praz-AI
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    console.log(`🤖 [Persona Enrich] Analyzing ${insights.length} insights for ${persona.name}`)
    
    const insightsText = insights.map((i, idx) => 
      `Insight ${idx + 1}:\nTitle: ${i.title}\nDescription: ${i.description || 'N/A'}\nSeverity: ${i.severity}\nSource: ${i.source}`
    ).join('\n\n')

    const result = await generateStructuredJson<{
      jtbd_statement: string
      motivations: string
      pain_points: string
    }>({
      systemPrompt: `You are an expert Product Manager and UX Researcher. 
Your task is to synthesize the provided raw customer discovery insights into an updated Persona profile.
Based on the raw insights, provide a unified summary of the persona's core Jobs To Be Done (JTBD), key motivations, and pain points.
Make the language professional, empathetic, and actionable.

Output exactly this JSON structure:
{
  "jtbd_statement": "When I am [context], I want to [motivation], so I can [expected outcome].",
  "motivations": "3-4 concise sentences summarizing what drives this persona.",
  "pain_points": "3-4 concise sentences summarizing their biggest frustrations and problems."
}`,
      userPrompt: `Persona Name: ${persona.name}\nRole: ${persona.role_title}\n\nRAW INSIGHTS TO ANALYZE:\n${insightsText}`
    })

    // 5. Update the persona
    const { data: updatedPersona, error: uErr } = await supabase
      .from('personas')
      .update({
        jtbd_statement: result.jtbd_statement,
        motivations: result.motivations,
        pain_points: result.pain_points
      })
      .eq('id', personaId)
      .select()
      .single()

    if (uErr) return { success: false, error: uErr.message }

    if (persona.project_id) {
      await logProjectActivity(persona.project_id, 'persona' as any, personaId, 'updated', { name: persona.name, note: 'Enriched via Praz-AI Insights' })
      revalidatePath(`/dashboard/projects/${persona.project_id}`)
    }

    return { success: true, updatedPersona: updatedPersona as Persona }

  } catch (error: any) {
    console.error('❌ [Persona Enrich] Error:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function autoExtractPersonasFromStrategy(
  organizationId: string,
  projectId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Fetch relevant strategy documents
    const { data: docs, error: dErr } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', [
        'product_strategy_document', 
        'market_research_report', 
        'market_research_workspace',
        'customer_research_strategy',
        'problem_discovery_workspace',
        'charter',
        'business_case',
        'feasibility_study'
      ])
      .order('created_at', { ascending: false })

    if (dErr) return { success: false, error: dErr.message }
    if (!docs || docs.length === 0) {
      return { success: false, error: 'No Strategy or Project Initiation documents found. Please generate a Market Research, Project Charter, or Business Case document first.' }
    }

    // Combine contents
    const combinedContent = docs
      .map(d => `[${d.document_type.toUpperCase()}]\n${JSON.stringify(d.free_text_content)}`)
      .join('\n\n')

    // 2. Check for Praz-AI availability
    const hasAiKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.OPENAI_API_KEY)
    if (!hasAiKey) {
      return { success: false, error: 'Praz-AI features are not configured. Please add an API key.' }
    }

    // 3. Generate JSON using Praz-AI
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    console.log(`🤖 [Persona Extract] Analyzing ${docs.length} documents for ${projectId}`)
    
    const result = await generateStructuredJson<{
      personas: Array<{
        name: string
        role_title: string
        jtbd_statement: string
        motivations: string
        pain_points: string
      }>
    }>({
      systemPrompt: `You are an expert Product Manager and UX Researcher. 
Your task is to extract Target Market Segmentation and Persona data from the provided Product Strategy and Market Research documents.
Identify both Primary and Secondary personas mentioned in the text. For each persona, infer or extract their core Jobs To Be Done (JTBD), motivations, and pain points based on the document context.

Output exactly this JSON structure:
{
  "personas": [
    {
      "name": "Persona Name (e.g. Enterprise Executive)",
      "role_title": "Job Role (e.g. VP of Sales)",
      "jtbd_statement": "When I am [context], I want to [motivation], so I can [expected outcome].",
      "motivations": "3-4 concise sentences summarizing what drives this persona.",
      "pain_points": "3-4 concise sentences summarizing their biggest frustrations and problems."
    }
  ]
}`,
      userPrompt: `STRATEGY & RESEARCH DOCUMENTS:\n\n${combinedContent}`
    })

    if (!result.personas || result.personas.length === 0) {
      return { success: false, error: 'No personas could be identified from the provided documents.' }
    }

    // 4. Insert into database
    const insertPayload = result.personas.map(p => ({
      ...p,
      organization_id: organizationId,
      project_id: projectId,
      created_by: user.id
    }))

    const { error: insertErr } = await supabase
      .from('personas')
      .insert(insertPayload)

    if (insertErr) return { success: false, error: insertErr.message }

    await logProjectActivity(projectId, 'persona' as any, 'bulk', 'created', { note: `Auto-extracted ${result.personas.length} personas from strategy docs` })
    await markDocumentsStale(projectId, organizationId, 'Personas were auto-extracted from strategy.')
    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard', 'layout')

    return { success: true, count: result.personas.length }

  } catch (error: any) {
    console.error('❌ [Persona Extract] Error:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
