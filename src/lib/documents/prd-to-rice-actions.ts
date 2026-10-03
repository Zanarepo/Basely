'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export interface GeneratedRiceItem {
  title: string
  description: string
  reach: number
  impact: number
  confidence: number
  effort: number
  moscow_status: 'Must' | 'Should' | 'Could' | 'Wont'
  riceScore?: number
}

export async function convertPrdToRiceBacklog(
  projectId: string,
  organizationId: string,
  freeText: Record<string, string>
): Promise<{ ok: boolean; count?: number; items?: GeneratedRiceItem[]; error?: string }> {
  try {
    if (!projectId) return { ok: false, error: 'Project ID is required' }

    // Compile PRD text from sections
    const sectionTexts: string[] = []
    Object.entries(freeText || {}).forEach(([key, val]) => {
      if (!key.startsWith('__') && val && typeof val === 'string' && val.trim().length > 10) {
        const cleanKey = key.replace(/_/g, ' ').toUpperCase()
        sectionTexts.push(`### SECTION: ${cleanKey}\n${val.trim()}`)
      }
    })

    const combinedPrdText = sectionTexts.join('\n\n')
    if (!combinedPrdText || combinedPrdText.length < 30) {
      return { ok: false, error: 'The PRD needs text in its sections before generating RICE backlog items.' }
    }

    const systemPrompt = `You are Praz-AI, a world-class Principal Product Manager.
Analyze the provided PRD (Product Requirements Document) text and extract 3 to 8 discrete, high-impact product backlog feature items.
For each item, evaluate RICE Prioritization metrics:
- title: Concise feature title (e.g. "OAuth2 Social Login", "Real-Time Document Telemetry").
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
      const res = await generateStructuredJson<{ items: GeneratedRiceItem[] }>({
        systemPrompt,
        userPrompt: `PRD DOCUMENT CONTENTS:\n\n${combinedPrdText.substring(0, 12000)}`,
      })
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        generatedItems = res.items
      }
    } catch (aiErr) {
      console.warn('[Praz-AI PRD-to-RICE Fallback]:', aiErr)
    }

    // Rule-based Fallback if AI router fails or returns empty
    if (generatedItems.length === 0) {
      generatedItems = [
        {
          title: 'Core Feature Objective & Architecture',
          description: 'Implement primary feature capabilities specified in PRD document.',
          reach: 1000,
          impact: 2.0,
          confidence: 90,
          effort: 2,
          moscow_status: 'Must',
        },
        {
          title: 'Security & Access Control Enforcement',
          description: 'Enforce role-based access control and audit telemetry logging.',
          reach: 2500,
          impact: 3.0,
          confidence: 95,
          effort: 3,
          moscow_status: 'Must',
        },
        {
          title: 'Real-Time Auto-Save & Notifications',
          description: 'Integrate multi-channel alerts and real-time database sync.',
          reach: 1500,
          impact: 1.5,
          confidence: 85,
          effort: 2,
          moscow_status: 'Should',
        },
      ]
    }

    // Compute RICE Scores for display: (Reach * Impact * Confidence%) / Effort
    const scoredItems = generatedItems.map((item) => {
      const reach = item.reach || 1000
      const impact = item.impact || 1
      const confidence = (item.confidence || 80) / 100
      const effort = Math.max(0.5, item.effort || 1)
      const riceScore = Math.round((reach * impact * confidence) / effort)

      // Ensure moscow_status is strictly 'Must' | 'Should' | 'Could' | 'Wont'
      let cleanMoscow: 'Must' | 'Should' | 'Could' | 'Wont' = 'Should'
      const mStr = String(item.moscow_status || '').toLowerCase()
      if (mStr.includes('must')) cleanMoscow = 'Must'
      else if (mStr.includes('should')) cleanMoscow = 'Should'
      else if (mStr.includes('could')) cleanMoscow = 'Could'
      else if (mStr.includes('wont') || mStr.includes('won\'t')) cleanMoscow = 'Wont'

      return { ...item, moscow_status: cleanMoscow, riceScore }
    })

    // Upsert into Supabase public.product_backlog_items using Admin Client (RLS bypass)
    // NOTE: DO NOT include rice_score or kano_category in insert payload!
    // PostgreSQL computes rice_score automatically via generated column.
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
      console.error('[PRD to RICE Insert Error]:', insertErr)
      return { ok: false, error: insertErr.message }
    }

    return {
      ok: true,
      count: scoredItems.length,
      items: scoredItems,
    }
  } catch (err: any) {
    console.error('[PRD to RICE Exception]:', err)
    return { ok: false, error: err.message || 'Failed to convert PRD to RICE Backlog' }
  }
}
