'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { GeneratedRiceItem } from './prd-to-rice-actions'

export async function convertScopeToRiceBacklog(
  projectId: string,
  organizationId: string,
  freeText: Record<string, string>
): Promise<{ ok: boolean; count?: number; items?: GeneratedRiceItem[]; error?: string }> {
  try {
    if (!projectId) return { ok: false, error: 'Project ID is required' }

    // Compile Scope text from sections
    const sectionTexts: string[] = []
    Object.entries(freeText || {}).forEach(([key, val]) => {
      if (!key.startsWith('__') && val && typeof val === 'string' && val.trim().length > 10) {
        const cleanKey = key.replace(/_/g, ' ').toUpperCase()
        sectionTexts.push(`### SECTION: ${cleanKey}\n${val.trim()}`)
      }
    })

    const combinedScopeText = sectionTexts.join('\n\n')
    if (!combinedScopeText || combinedScopeText.length < 30) {
      return { ok: false, error: 'The Scope Statement needs text in its sections before generating RICE backlog items.' }
    }

    const systemPrompt = `You are Praz-AI, a world-class Principal Project/Product Manager.
Analyze the provided Scope Statement text and extract 3 to 8 discrete, high-impact product backlog feature items or major project deliverables.
For each item, evaluate RICE Prioritization metrics:
- title: Concise feature/deliverable title.
- description: Detailed user story or functional spec summary.
- reach: Estimated number of users impacted per month (integer between 100 and 10000).
- impact: Impact score multiplier (0.25 = Minimal, 0.5 = Low, 1.0 = Medium, 2.0 = High, 3.0 = Massive).
- confidence: Confidence percentage (integer between 50 and 100).
- effort: Person-weeks or story points effort required (number between 1 and 8).
- moscow_status: "Must" | "Should" | "Could" | "Wont".

Respond STRICTLY with a JSON object matching this schema:
{
  "items": [
    {
      "title": "string",
      "description": "string",
      "reach": number,
      "impact": number,
      "confidence": number,
      "effort": number,
      "moscow_status": "Must" | "Should" | "Could" | "Wont"
    }
  ]
}`

    let generatedItems: GeneratedRiceItem[] = []

    try {
      console.log(`🤖 [Scope-to-RICE] Generating backlog items for project: ${projectId}`)
      const res = await generateStructuredJson<{ items: GeneratedRiceItem[] }>({
        systemPrompt,
        userPrompt: `SCOPE STATEMENT CONTENTS:\n\n${combinedScopeText.substring(0, 12000)}`,
      })
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        generatedItems = res.items
      }
    } catch (aiErr) {
      console.warn('[Praz-AI Scope-to-RICE Fallback]:', aiErr)
    }

    // Rule-based Fallback if AI router fails or returns empty
    if (generatedItems.length === 0) {
      generatedItems = [
        {
          title: 'Core Deliverables defined in Scope',
          description: 'Implement primary capabilities specified in the Project Scope document.',
          reach: 1000,
          impact: 2.0,
          confidence: 90,
          effort: 2,
          moscow_status: 'Must',
        }
      ]
    }

    // Compute RICE Scores for display: (Reach * Impact * Confidence%) / Effort
    const scoredItems = generatedItems.map((item) => {
      const reach = item.reach || 1000
      const impact = item.impact || 1
      const confidence = (item.confidence || 80) / 100
      const effort = Math.max(0.5, item.effort || 1)
      const riceScore = Math.round((reach * impact * confidence) / effort)

      let cleanMoscow: 'Must' | 'Should' | 'Could' | 'Wont' = 'Should'
      const mStr = String(item.moscow_status || '').toLowerCase()
      if (mStr.includes('must')) cleanMoscow = 'Must'
      else if (mStr.includes('should')) cleanMoscow = 'Should'
      else if (mStr.includes('could')) cleanMoscow = 'Could'
      else if (mStr.includes('wont') || mStr.includes('won\'t')) cleanMoscow = 'Wont'

      return { ...item, moscow_status: cleanMoscow, riceScore }
    })

    // Upsert into Supabase public.product_backlog_items using Admin Client
    const adminClient = createAdminClient()
    const rowsToInsert = scoredItems.map((item) => ({
      project_id: projectId,
      organization_id: organizationId || null,
      title: item.title,
      description: item.description,
      reach: item.reach,
      impact: item.impact,
      confidence: item.confidence,
      effort: item.effort,
      moscow_status: item.moscow_status,
      updated_at: new Date().toISOString(),
    }))

    const { error: insertErr } = await adminClient.from('product_backlog_items').insert(rowsToInsert)
    if (insertErr) {
      console.error('[Scope to RICE Insert Error]:', insertErr)
      return { ok: false, error: 'Failed to insert generated backlog items into the database.' }
    }

    return { ok: true, count: scoredItems.length, items: scoredItems }
  } catch (error: any) {
    console.error('convertScopeToRiceBacklog failed:', error)
    return { ok: false, error: error.message }
  }
}
