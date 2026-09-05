'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 4. Generate OKRs from Product Strategy
 */
export async function generateOkrsFromStrategy(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch Strategy
    const { data: strategy, error: stratErr } = await adminSupabase
      .from('product_strategies')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (stratErr || !strategy) return { ok: false, error: 'Product Strategy not found. Please complete the Strategy Canvas first.' }

    // 2. Prepare Context for AI
    const context = `
      Vision: ${strategy.vision_statement}
      Target Market: ${strategy.target_market}
      Goals: ${JSON.stringify(strategy.product_goals || [])}
      Pillars: ${JSON.stringify(strategy.strategic_pillars || [])}
      Bets: ${JSON.stringify(strategy.strategic_bets || [])}
    `

    const systemPrompt = `You are a Chief Strategy Officer. Generate 3-5 high-impact OKRs (Objectives and Key Results) based on the provided Product Strategy context.
    Format your output as a JSON object with a single key "objectives" containing an array of objects:
    {
      "objectives": [
        {
          "title": "Objective Title",
          "description": "Why this matters",
          "timeframe": "Q3 2026",
          "key_results": [
            {
              "title": "Key Result Title",
              "target_value": "Numeric target (e.g., 500000)",
              "unit": "USD, %, Users, etc."
            }
          ]
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      objectives: {
        title: string
        description: string
        timeframe: string
        key_results: { title: string; target_value: string; unit: string }[]
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.objectives || parsedResult.objectives.length === 0) {
      return { ok: false, error: 'Failed to generate objectives' }
    }

    // 3. Insert into DB
    for (const obj of parsedResult.objectives) {
      const { data: insertedObj, error: objErr } = await adminSupabase
        .from('okr_objectives')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          title: obj.title,
          description: obj.description,
          timeframe: obj.timeframe,
          progress: 0,
          status: 'on_track',
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (objErr || !insertedObj) continue

      const krsToInsert = obj.key_results.map(kr => ({
        objective_id: insertedObj.id,
        title: kr.title,
        baseline_value: '0',
        target_value: kr.target_value,
        current_value: '0',
        progress: 0,
        confidence_score: 5,
        unit: kr.unit,
        status: 'on_track',
        created_at: now,
        updated_at: now
      }))

      if (krsToInsert.length > 0) {
        await adminSupabase.from('okr_key_results').insert(krsToInsert)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateOkrsFromStrategy Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate OKRs' }
  }
}

/**
 * 5. Auto Align Roadmap to OKRs
 */
export async function autoAlignRoadmapToOkrs(
  projectId: string
): Promise<{ ok: boolean; alignedCount?: number; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch OKRs
    const { data: okrs } = await adminSupabase
      .from('okr_objectives')
      .select('id, title, description')
      .eq('project_id', projectId)

    if (!okrs || okrs.length === 0) return { ok: false, error: 'No OKRs found to align with.' }

    // 2. Fetch Backlog Items without an OKR
    const { data: backlogItems } = await adminSupabase
      .from('product_backlog_items')
      .select('id, title, description')
      .eq('project_id', projectId)
      .is('primary_okr_id', null)

    if (!backlogItems || backlogItems.length === 0) return { ok: false, error: 'No orphaned roadmap items to align.' }

    const systemPrompt = `You are an AI Product Operations Manager.
    Your job is to match Product Backlog Items to the most appropriate Strategic OKR.
    
    OKRs Available:
    ${JSON.stringify(okrs)}

    Backlog Items to align:
    ${JSON.stringify(backlogItems)}

    Return a JSON object with a single key "alignments" containing an array of mappings:
    {
      "alignments": [
        {
          "backlog_item_id": "item-id",
          "okr_id": "okr-id"
        }
      ]
    }
    CRITICAL: Only match items if there is a reasonable strategic fit. It's okay to omit an item if it doesn't fit any OKR.`

    const parsedResult = await generateStructuredJson<{
      alignments: { backlog_item_id: string; okr_id: string }[]
    }>({
      systemPrompt,
      userPrompt: 'Align these backlog items to the OKRs.',
    })

    if (!parsedResult.alignments || parsedResult.alignments.length === 0) {
      return { ok: true, alignedCount: 0 }
    }

    let count = 0
    // 3. Update DB
    for (const alignment of parsedResult.alignments) {
      if (!alignment.okr_id || !alignment.backlog_item_id) continue
      const { error } = await adminSupabase
        .from('product_backlog_items')
        .update({ primary_okr_id: alignment.okr_id })
        .eq('id', alignment.backlog_item_id)
      
      if (!error) count++
    }

    return { ok: true, alignedCount: count }
  } catch (err: any) {
    console.error('[autoAlignRoadmapToOkrs Error]:', err)
    return { ok: false, error: err.message || 'Failed to auto align roadmap.' }
  }
}


/**
 * 8. Generate OKRs from Project Charter / Scope Statement
 */
export async function generateOkrsFromProject(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch Project Documents (Charter or Scope Statement)
    const { data: projectDocs, error: docErr } = await adminSupabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', ['project_charter', 'scope_statement'])
      .order('created_at', { ascending: false })

    if (docErr || !projectDocs || projectDocs.length === 0) {
      return { ok: false, error: 'No Project Charter or Scope Statement found. Please complete project initiation first.' }
    }

    // Use the most recent/relevant document
    const bestDoc = projectDocs.find(d => d.document_type === 'project_charter') || projectDocs[0]
    const content = bestDoc.free_text_content as Record<string, string> || {}

    // Prepare Context for AI
    const rawText = Object.entries(content)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.replace(/_/g, ' ').toUpperCase()}]\n${v}`)
      .join('\n\n')

    const context = `Source Document: ${bestDoc.document_type === 'project_charter' ? 'Project Charter' : 'Scope Statement'}\n\n${rawText.substring(0, 10000)}`

    const systemPrompt = `You are a Project Management Executive. Generate 3-5 high-impact OKRs (Objectives and Key Results) based on the provided Project Document context (Charter or Scope).
    Focus on project delivery success, budget, timeline, and scope objectives.
    Format your output as a JSON object with a single key "objectives" containing an array of objects:
    {
      "objectives": [
        {
          "title": "Objective Title",
          "description": "Why this matters for the project",
          "timeframe": "Q3 2026",
          "key_results": [
            {
              "title": "Key Result Title",
              "target_value": "Numeric target (e.g., 100, 0, 50000)",
              "unit": "%, Days, USD, etc."
            }
          ]
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      objectives: {
        title: string
        description: string
        timeframe: string
        key_results: { title: string; target_value: string; unit: string }[]
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.objectives || parsedResult.objectives.length === 0) {
      return { ok: false, error: 'Failed to generate project objectives' }
    }

    // 3. Insert into DB
    for (const obj of parsedResult.objectives) {
      const { data: insertedObj, error: objErr } = await adminSupabase
        .from('okr_objectives')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          title: obj.title,
          description: obj.description,
          timeframe: obj.timeframe,
          progress: 0,
          status: 'on_track',
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single()

      if (objErr || !insertedObj) continue

      const krsToInsert = obj.key_results.map(kr => ({
        objective_id: insertedObj.id,
        title: kr.title,
        baseline_value: '0',
        target_value: kr.target_value,
        current_value: '0',
        progress: 0,
        confidence_score: 5,
        unit: kr.unit,
        status: 'on_track',
        created_at: now,
        updated_at: now
      }))

      if (krsToInsert.length > 0) {
        await adminSupabase.from('okr_key_results').insert(krsToInsert)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateOkrsFromProject Error]:', err)
    return { ok: false, error: err.message || 'An unexpected error occurred generating Project OKRs.' }
  }
}

