'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 7. Synthesize Lessons Learned (Retrospective)
 */
export async function synthesizeLessonsLearned(
  projectId: string,
  releaseId: string | null,
  rawNotes: string
): Promise<{ ok: boolean; insights?: any[]; id?: string; error?: string }> {
  try {
    const systemPrompt = `You are a Continuous Improvement Engine.
    Analyze the provided raw Post-Implementation Review (Retrospective) notes from a recent software release.
    Synthesize these notes into actionable, systemic insights (both positive 'moats/advantages' and negative 'risks/issues').
    
    Format your output as JSON:
    {
      "insights": [
        {
          "category": "risk | moat | process_improvement",
          "summary": "Brief summary of the insight",
          "description": "Detailed explanation",
          "action_item": "What should be done differently next time or added to strategy?"
        }
      ]
    }`

    const parsedResult = await generateStructuredJson<{
      insights: { category: string; summary: string; description: string; action_item: string }[]
    }>({
      systemPrompt,
      userPrompt: `Raw Retro Notes:\n${rawNotes}`
    })

    if (!parsedResult.insights) return { ok: false, error: 'Failed to synthesize insights' }

    const adminSupabase = createAdminClient()
    
    let lessonId = ''
    
    if (releaseId) {
      const { data: existing } = await adminSupabase
        .from('product_lessons_learned')
        .select('id')
        .eq('release_id', releaseId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
        
      if (existing) {
        await adminSupabase.from('product_lessons_learned').update({
          raw_notes: rawNotes,
          synthesized_insights: parsedResult.insights,
          status: 'synthesized',
          updated_at: new Date().toISOString()
        }).eq('id', existing.id)
        lessonId = existing.id
      } else {
        const { data: inserted } = await adminSupabase.from('product_lessons_learned').insert({
          project_id: projectId,
          release_id: releaseId,
          raw_notes: rawNotes,
          synthesized_insights: parsedResult.insights,
          status: 'synthesized'
        }).select('id').single()
        lessonId = inserted?.id || ''
      }
    } else {
       const { data: existing } = await adminSupabase
         .from('product_lessons_learned')
         .select('id')
         .eq('project_id', projectId)
         .is('release_id', null)
         .order('created_at', { ascending: false }).limit(1).maybeSingle()

       if (existing) {
         await adminSupabase.from('product_lessons_learned').update({
           raw_notes: rawNotes,
           synthesized_insights: parsedResult.insights,
           status: 'synthesized',
           updated_at: new Date().toISOString()
         }).eq('id', existing.id)
         lessonId = existing.id
       } else {
         const { data: inserted } = await adminSupabase.from('product_lessons_learned').insert({
            project_id: projectId,
            raw_notes: rawNotes,
            synthesized_insights: parsedResult.insights,
            status: 'synthesized'
          }).select('id').single()
          lessonId = inserted?.id || ''
       }
    }

    return { ok: true, insights: parsedResult.insights, id: lessonId }
  } catch (err: any) {
    console.error('[synthesizeLessonsLearned Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize lessons.' }
  }
}

/**
 * 8. Propose Strategy Updates from Lessons
 */
export async function proposeStrategyUpdates(
  projectId: string,
  lessonsLearnedId: string,
  insights?: any[]
): Promise<{ ok: boolean; proposedRisks?: any[]; proposedMoats?: any[]; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    
    let fetchedInsights = insights
    
    if (!fetchedInsights && lessonsLearnedId && lessonsLearnedId !== 'temp') {
      const { data: lesson } = await adminSupabase
        .from('product_lessons_learned')
        .select('synthesized_insights')
        .eq('id', lessonsLearnedId)
        .single()
      fetchedInsights = lesson?.synthesized_insights
    }
    
    if (!fetchedInsights || !fetchedInsights.length) return { ok: false, error: 'No insights found to propose updates from.' }
    
    const { data: strategy } = await adminSupabase
      .from('product_strategies')
      .select('strategic_risks, execution_moats')
      .eq('project_id', projectId)
      .single()
      
    const currentRisks = strategy?.strategic_risks || []
    const currentMoats = strategy?.execution_moats || []

    const systemPrompt = `You are a Chief Strategy Officer.
    Review the synthesized Retrospective insights and the CURRENT Product Strategy Risks and Moats.
    Propose NEW strategic risks and execution moats to append to the Strategy based ONLY on the new insights.
    Do not duplicate existing risks/moats. If an insight doesn't warrant a strategy update, ignore it.
    
    Format your output as JSON:
    {
      "proposed_risks": [
        { "title": "...", "description": "...", "mitigation_strategy": "..." }
      ],
      "proposed_moats": [
        { "title": "...", "description": "...", "impact": "..." }
      ]
    }`

    const parsedResult = await generateStructuredJson<{
      proposed_risks: any[];
      proposed_moats: any[];
    }>({
      systemPrompt,
      userPrompt: `CURRENT RISKS:\n${JSON.stringify(currentRisks)}\n\nCURRENT MOATS:\n${JSON.stringify(currentMoats)}\n\nNEW INSIGHTS:\n${JSON.stringify(fetchedInsights)}`
    })

    return { 
      ok: true, 
      proposedRisks: parsedResult.proposed_risks || [], 
      proposedMoats: parsedResult.proposed_moats || [] 
    }
  } catch (err: any) {
    console.error('[proposeStrategyUpdates Error]:', err)
    return { ok: false, error: err.message || 'Failed to propose updates.' }
  }
}

