'use server'
import { chainDocumentGeneration } from '../core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../../prd-templates'
import { STATIC_TEMPLATES } from '../../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'

/**
 * 6. Generate North Star & Growth Levers from Strategy
 */
export async function generateNorthStarFromStrategy(
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

    const systemPrompt = `You are a Chief Strategy Officer and Growth Expert.
    Based on the provided Product Strategy context, define ONE primary "North Star" quantitative metric, and 3-4 supporting "Growth Levers" (e.g. acquisition, activation, retention, revenue, efficiency).
    
    Format your output as a JSON object with a single key "metrics" containing an array of objects. The first object MUST be the North Star.
    {
      "metrics": [
        {
          "name": "Metric Name",
          "category": "north_star | acquisition | activation | retention | revenue | efficiency",
          "current_value": "Current numeric string (e.g. '0')",
          "target_value": "Target numeric string (e.g. '10000')",
          "unit": "percentage | currency | number",
          "frequency": "daily | weekly | monthly | quarterly | yearly"
        }
      ]
    }
    CRITICAL: Return ONLY strictly valid JSON.`

    const parsedResult = await generateStructuredJson<{
      metrics: {
        name: string
        category: 'north_star' | 'acquisition' | 'activation' | 'retention' | 'revenue' | 'efficiency'
        current_value: string
        target_value: string
        unit: 'percentage' | 'currency' | 'number'
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      }[]
    }>({
      systemPrompt,
      userPrompt: context,
    })

    if (!parsedResult.metrics || parsedResult.metrics.length === 0) {
      return { ok: false, error: 'Failed to generate metrics' }
    }

    // 3. Insert into DB
    const kpisToInsert = parsedResult.metrics.map(m => ({
      organization_id: organizationId,
      project_id: projectId,
      name: m.name,
      category: m.category,
      current_value: m.current_value,
      target_value: m.target_value,
      unit: m.unit,
      frequency: m.frequency,
      status: 'on_track',
      trend_direction: 'stable',
      created_at: now,
      updated_at: now
    }))

    const { error: insertErr } = await adminSupabase.from('product_kpis').insert(kpisToInsert)
    if (insertErr) return { ok: false, error: insertErr.message }

    return { ok: true }
  } catch (err: any) {
    console.error('[generateNorthStarFromStrategy Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate North Star metrics' }
  }
}

