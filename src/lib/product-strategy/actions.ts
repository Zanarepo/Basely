'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/actions'
import type { Persona, ProductStrategy, ProductKpi, OkrObjective, OkrKeyResult } from './types'

// ---------------------------
// Persona Server Actions
// ---------------------------

export async function getPersonas(organizationId: string, projectId?: string): Promise<Persona[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('personas')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    // Return personas specifically scoped to this project or shared organization-wide (project_id is null)
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
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
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
    revalidatePath(`/dashboard/projects/${data.project_id}`)
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
    revalidatePath(`/dashboard/projects/${projectId}`)
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

// ---------------------------
// Product Strategy Actions
// ---------------------------

export async function getProductStrategy(projectId: string, organizationId: string): Promise<ProductStrategy | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('product_strategies')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error || !data) {
    // If none exists, create a default empty strategy canvas for this workspace
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newStrategy, error: insertError } = await supabase
      .from('product_strategies')
      .insert([
        {
          project_id: projectId,
          organization_id: organizationId,
          vision_statement: '',
          target_market: '',
          value_proposition: '',
          strategic_pillars: [],
          competitive_moats: [],
          created_by: user?.id || null
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error initializing product strategy:', insertError)
      return null
    }
    return newStrategy as ProductStrategy
  }

  return data as ProductStrategy
}

export async function saveProductStrategy(
  projectId: string,
  organizationId: string,
  payload: Partial<ProductStrategy>
): Promise<{ ok: boolean; error?: string; data?: ProductStrategy }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('product_strategies')
    .upsert({
      project_id: projectId,
      organization_id: organizationId,
      ...payload,
      created_by: user?.id || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'project_id' })
    .select()
    .single()

  if (error) {
    console.error('Error saving product strategy:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'product_strategy' as any, data.id, 'updated', {
    vision: data.vision_statement?.substring(0, 50)
  })

  if (user) {
    await dispatchNotification({
      userId: user.id,
      triggerType: 'strategy_update' as any,
      referenceEntityType: 'product_strategy',
      referenceEntityId: data.id,
      projectId,
      contentSummary: `Product Strategy & Vision Canvas updated for project`
    })
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true, data: data as ProductStrategy }
}

// ---------------------------
// Product KPI Server Actions (North Star & Growth Levers)
// ---------------------------

export async function getProductKpis(organizationId: string, projectId?: string): Promise<ProductKpi[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('product_kpis')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching product KPIs:', error)
    return []
  }
  return data as ProductKpi[]
}

export async function createProductKpi(payload: Partial<ProductKpi>): Promise<{ ok: boolean; error?: string; data?: ProductKpi }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('product_kpis')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select()
    .single()

  if (error) {
    console.error('Error creating product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'kpi' as any, data.id, 'created', { name: data.name, value: data.current_value })
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
  }
  
  return { ok: true, data: data as ProductKpi }
}

export async function updateProductKpi(id: string, payload: Partial<ProductKpi>): Promise<{ ok: boolean; error?: string; data?: ProductKpi }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('product_kpis')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'kpi' as any, data.id, 'updated', { name: data.name, value: data.current_value })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as ProductKpi }
}

export async function deleteProductKpi(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('product_kpis').select('project_id, name').eq('id', id).single()
  const { error } = await supabase.from('product_kpis').delete().eq('id', id)

  if (error) {
    console.error('Error deleting product KPI:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'kpi' as any, id, 'deleted', { name: data.name })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true }
}

// ---------------------------
// OKR Objectives & Key Results Server Actions
// ---------------------------

async function syncObjectiveProgress(objectiveId: string) {
  const supabase = await createClient()
  const { data: krs } = await supabase.from('okr_key_results').select('progress').eq('objective_id', objectiveId)
  if (krs && krs.length > 0) {
    const total = krs.reduce((sum, item) => sum + (item.progress || 0), 0)
    const avg = Math.round(total / krs.length)
    let status = 'on_track'
    if (avg < 40) status = 'behind'
    else if (avg < 75) status = 'at_risk'
    await supabase.from('okr_objectives').update({ progress: avg, status, updated_at: new Date().toISOString() }).eq('id', objectiveId)
  }
}

export async function getOkrObjectives(organizationId: string, projectId?: string): Promise<OkrObjective[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('okr_objectives')
    .select('*, key_results:okr_key_results(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching OKRs:', error)
    return []
  }
  return data as OkrObjective[]
}

export async function createOkrObjective(payload: Partial<OkrObjective>): Promise<{ ok: boolean; error?: string; data?: OkrObjective }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('okr_objectives')
    .insert([{ ...payload, created_by: user?.id || null }])
    .select('*, key_results:okr_key_results(*)')
    .single()

  if (error) {
    console.error('Error creating OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (payload.project_id) {
    await logProjectActivity(payload.project_id, 'okr_objective' as any, data.id, 'created', { title: data.title })
    revalidatePath(`/dashboard/projects/${payload.project_id}`)
  }
  
  return { ok: true, data: data as OkrObjective }
}

export async function updateOkrObjective(id: string, payload: Partial<OkrObjective>): Promise<{ ok: boolean; error?: string; data?: OkrObjective }> {
  const supabase = await createClient()
  
  // Strip nested relations before updating table
  const updateData = { ...payload }
  delete (updateData as any).key_results

  const { data, error } = await supabase
    .from('okr_objectives')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, key_results:okr_key_results(*)')
    .single()

  if (error) {
    console.error('Error updating OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'okr_objective' as any, data.id, 'updated', { title: data.title })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true, data: data as OkrObjective }
}

export async function deleteOkrObjective(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('okr_objectives').select('project_id, title').eq('id', id).single()
  const { error } = await supabase.from('okr_objectives').delete().eq('id', id)

  if (error) {
    console.error('Error deleting OKR Objective:', error)
    return { ok: false, error: error.message }
  }

  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'okr_objective' as any, id, 'deleted', { title: data.title })
    revalidatePath(`/dashboard/projects/${data.project_id}`)
  }

  return { ok: true }
}

export async function createOkrKeyResult(payload: Partial<OkrKeyResult>): Promise<{ ok: boolean; error?: string; data?: OkrKeyResult }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('okr_key_results')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (payload.objective_id) {
    await syncObjectiveProgress(payload.objective_id)
  }
  
  return { ok: true, data: data as OkrKeyResult }
}

export async function updateOkrKeyResult(id: string, payload: Partial<OkrKeyResult>): Promise<{ ok: boolean; error?: string; data?: OkrKeyResult }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('okr_key_results')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (data?.objective_id) {
    await syncObjectiveProgress(data.objective_id)
  }

  return { ok: true, data: data as OkrKeyResult }
}

export async function deleteOkrKeyResult(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data } = await supabase.from('okr_key_results').select('objective_id, title').eq('id', id).single()
  const { error } = await supabase.from('okr_key_results').delete().eq('id', id)

  if (error) {
    console.error('Error deleting Key Result:', error)
    return { ok: false, error: error.message }
  }

  if (data?.objective_id) {
    await syncObjectiveProgress(data.objective_id)
  }

  return { ok: true }
}
