'use server'

import { createClient } from '@/utils/supabase/server'
import { logGovernanceEvent } from '@/lib/governance/actions'

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}
import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

// Basic CRUD

export async function getBacklogItems(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_backlog_items')
    .select('*')
    .eq('project_id', projectId)
    .order('rice_score', { ascending: false })
  
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function upsertBacklogItem(payload: {
  id?: string
  project_id: string
  organization_id: string
  title: string
  description?: string
  reach?: number
  impact?: number
  confidence?: number
  effort?: number
  moscow_status?: string | null
  kano_category?: string | null
}) {
  const { supabase } = await getAuthenticatedClient()
  const { data, error } = await supabase
    .from('product_backlog_items')
    .upsert({
      id: payload.id,
      project_id: payload.project_id,
      organization_id: payload.organization_id,
      title: payload.title,
      description: payload.description,
      reach: payload.reach ?? 1,
      impact: payload.impact ?? 1,
      confidence: payload.confidence ?? 100,
      effort: payload.effort ?? 1,
      moscow_status: payload.moscow_status,
      kano_category: payload.kano_category,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
    
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function deleteBacklogItem(id: string) {
  const { supabase } = await getAuthenticatedClient()
  const { error } = await supabase.from('product_backlog_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Sprint 51: Project Bridge

const WbsDeconstructionSchema = z.object({
  epic_title: z.string().describe("The high-level title of the epic"),
  epic_description: z.string().describe("The description of the epic"),
  work_packages: z.array(z.object({
    title: z.string().describe("Title of the child work package/task"),
    description: z.string().describe("Description and acceptance criteria"),
    estimated_duration_days: z.number().int().min(1).describe("Estimated duration in days")
  }))
})

export async function convertBacklogItemToExecution(backlogItemId: string) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    
    // 1. Fetch Backlog Item
    const { data: item, error: fetchError } = await supabase
      .from('product_backlog_items')
      .select('*')
      .eq('id', backlogItemId)
      .single()
      
    if (fetchError || !item) {
      return { success: false, error: fetchError?.message || 'Item not found' }
    }
    
    // 2. Check Governance Setting
    const { data: org } = await supabase
      .from('organizations')
      .select('ai_wbs_generation_enabled')
      .eq('id', item.organization_id)
      .single()
      
    const useAi = org?.ai_wbs_generation_enabled === true
    const apiKey = process.env.OPENAI_API_KEY
    
    let rootElementId: string;
    
    if (useAi && apiKey) {
      // ----------------------------------------------------
      // OPTION A: AI AUTO-DECONSTRUCT
      // ----------------------------------------------------
      const openai = new OpenAI({ apiKey })
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert Technical Project Manager. Break down the provided product backlog item into an Epic and a set of actionable child Work Packages (tasks). Provide realistic duration estimates. Output strictly as JSON following the provided schema.' },
          { role: 'user', content: `Title: ${item.title}\nDescription: ${item.description || 'No description provided.'}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "wbs_deconstruction",
            schema: {
              type: "object",
              properties: {
                epic_title: { type: "string" },
                epic_description: { type: "string" },
                work_packages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      estimated_duration_days: { type: "number" }
                    },
                    required: ["title", "description", "estimated_duration_days"],
                    additionalProperties: false
                  }
                }
              },
              required: ["epic_title", "epic_description", "work_packages"],
              additionalProperties: false
            },
            strict: true
          }
        }
      })
      
      const content = completion.choices[0].message.content
      if (!content) throw new Error("AI returned empty response")
      const result = JSON.parse(content)
      
      // A. Create Parent Epic (is_work_package = false)
      const { data: parentWbs, error: epicErr } = await supabase
        .from('wbs_elements')
        .insert({
          project_id: item.project_id,
          name: result.epic_title,
          description: result.epic_description,
          is_work_package: false,
          sort_order: 100, // naive sort
        })
        .select()
        .single()
        
      if (epicErr) throw epicErr
      rootElementId = parentWbs.id
      
      // B. Create Child Work Packages & Activities
      let currentSort = 1
      for (const wp of result.work_packages) {
        const { data: childWbs, error: wpErr } = await supabase
          .from('wbs_elements')
          .insert({
            project_id: item.project_id,
            parent_id: rootElementId,
            name: wp.title,
            description: wp.description,
            is_work_package: true,
            sort_order: currentSort++
          })
          .select()
          .single()
          
        if (wpErr) continue
        
        // C. Create Activity for the Work Package
        await supabase.from('activities').insert({
          project_id: item.project_id,
          wbs_element_id: childWbs.id,
          name: wp.title,
          duration: wp.estimated_duration_days
        })
      }
      
      await logGovernanceEvent(item.organization_id, 'ai_generation', {
        action: 'wbs_auto_deconstruct',
        item_id: item.id
      })
      
    } else {
      // ----------------------------------------------------
      // OPTION B: MANUAL EPIC SHELL
      // ----------------------------------------------------
      const { data: parentWbs, error: epicErr } = await supabase
        .from('wbs_elements')
        .insert({
          project_id: item.project_id,
          name: item.title,
          description: item.description,
          is_work_package: false, // PM will break it down manually
          sort_order: 100,
        })
        .select()
        .single()
        
      if (epicErr) throw epicErr
      rootElementId = parentWbs.id
    }
    
    // 3. Link back to the Product Backlog Item
    const { error: updateErr } = await supabase
      .from('product_backlog_items')
      .update({ wbs_element_id: rootElementId })
      .eq('id', item.id)
      
    if (updateErr) throw updateErr
    
    return { success: true, data: { wbs_element_id: rootElementId, usedAi: useAi && !!apiKey } }
    
  } catch (err: any) {
    console.error("convertBacklogItemToExecution failed:", err)
    return { success: false, error: err.message }
  }
}
