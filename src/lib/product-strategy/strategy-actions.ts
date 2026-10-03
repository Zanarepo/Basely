'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import type { ProductStrategy, StrategicPillar, StrategicBet, ProductPrinciple, ProductGoal, DifferentiationItem } from './types'

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

  if (data?.custom_attributes) {
    Object.assign(data, data.custom_attributes)
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

  // Fetch existing first to preserve other custom_attributes
  const { data: existing } = await supabase
    .from('product_strategies')
    .select('custom_attributes')
    .eq('project_id', projectId)
    .single()

  const existingAttrs = existing?.custom_attributes || {}

  // Merge payload keys that are not native columns into custom_attributes
  const {
    competitor_a_name,
    competitor_b_name,
    competitive_features,
    custom_attributes,
    ...nativePayload
  } = payload as any

  const mergedAttrs = {
    ...existingAttrs,
    ...(custom_attributes || {}),
  }

  if (competitor_a_name !== undefined) mergedAttrs.competitor_a_name = competitor_a_name
  if (competitor_b_name !== undefined) mergedAttrs.competitor_b_name = competitor_b_name
  if (competitive_features !== undefined) mergedAttrs.competitive_features = competitive_features

  const { data, error } = await supabase
    .from('product_strategies')
    .upsert({
      project_id: projectId,
      organization_id: organizationId,
      ...nativePayload,
      custom_attributes: mergedAttrs,
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

export async function upsertStrategyCanvasFromAI(
  projectId: string,
  parsedDoc: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    if (projErr || !project) {
      console.error('Project not found for strategy canvas sync:', projErr)
      return { ok: false, error: projErr?.message || 'Project not found' }
    }

    const orgId = project.organization_id

    // Parse Strategic Pillars (Section 13)
    const rawPillars = parsedDoc.strategic_pillars || ''
    const pillarBlocks = rawPillars.split(/###\s*Pillar\s*\d*:?/i).filter(Boolean)
    const strategic_pillars: StrategicPillar[] = pillarBlocks.map((block, idx) => {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean)
      const firstLine = lines[0] || `Pillar ${idx + 1}`
      const title = firstLine.replace(/^[#*\s-]+/, '').trim()
      
      const objLine = lines.find(l => l.toLowerCase().includes('objective')) || ''
      const metricsLine = lines.find(l => l.toLowerCase().includes('metric')) || ''
      const initLines = lines.filter(l => l.startsWith('-') || l.startsWith('*'))
      
      const initiatives = initLines.map(l => l.replace(/^[-*\s]+/, '').trim())
      
      return {
        id: `pillar-${idx + 1}-${Date.now().toString(36)}`,
        title: title || `Pillar ${idx + 1}`,
        description: objLine ? objLine.replace(/.*objective:?\s*/i, '').trim() : block.substring(0, 150),
        target_metric: metricsLine ? metricsLine.replace(/.*metric:?\s*/i, '').trim() : undefined,
        key_initiatives: initiatives.length > 0 ? initiatives : undefined,
      }
    })

    if (strategic_pillars.length === 0 && rawPillars) {
      strategic_pillars.push({
        id: `pillar-1-${Date.now().toString(36)}`,
        title: 'Core Pillar',
        description: rawPillars.substring(0, 200),
      })
    }

    // Parse Strategic Bets (Section 12)
    const rawBets = parsedDoc.strategic_bets || ''
    const betLines = rawBets.split('\n').filter(l => (l.includes('|') || l.trim().startsWith('-') || l.trim().startsWith('*')) && !l.includes('---') && !l.toLowerCase().includes('strategic bet'))
    const strategic_bets: StrategicBet[] = betLines.map((line, idx) => {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean)
        return {
          id: `bet-${idx + 1}-${Date.now().toString(36)}`,
          bet: parts[1] || parts[0] || `Strategic Bet ${idx + 1}`,
          why_it_matters: parts[2] || '',
          expected_outcome: parts[3] || '',
          confidence: (parts[4]?.toLowerCase().includes('high') ? 'high' : parts[4]?.toLowerCase().includes('low') ? 'low' : 'medium') as any,
        }
      } else {
        const clean = line.replace(/^[-*\s]+/, '').trim()
        const [betName, ...rest] = clean.split(':')
        return {
          id: `bet-${idx + 1}-${Date.now().toString(36)}`,
          bet: betName || `Strategic Bet ${idx + 1}`,
          why_it_matters: rest.join(':').trim() || clean.substring(0, 100),
          expected_outcome: '',
          confidence: 'medium',
        }
      }
    }).filter(b => b.bet)

    // Parse Product Principles (Section 14)
    const rawPrinciples = parsedDoc.product_principles || ''
    const principleBlocks = rawPrinciples.split(/(?:\n\d+\.|\bPrinciple\s*\d*:?|\n- |\n\* )/i).filter(Boolean)
    const product_principles: ProductPrinciple[] = principleBlocks.map((block, idx) => {
      const lines = block.trim().split('\n').filter(Boolean)
      let title = lines[0]?.replace(/^[#*\s:-]+/, '').trim() || `Principle ${idx + 1}`
      let desc = lines.slice(1).join(' ').trim()
      
      // If the AI used bolding for title: "**Title:** Description"
      if (title.includes('**')) {
        const parts = title.split('**').filter(Boolean)
        if (parts.length > 1) {
          title = parts[0].replace(/[:*]/g, '').trim()
          desc = parts[1].replace(/[:*]/g, '').trim() + ' ' + desc
        }
      }

      return {
        id: `principle-${idx + 1}-${Date.now().toString(36)}`,
        title,
        description: desc.substring(0, 300) || block.trim().substring(0, 300),
      }
    }).filter(p => p.title)

    // Parse Product Goals (Section 15)
    const rawGoals = parsedDoc.product_goals || ''
    const goalLines = rawGoals.split('\n').filter(l => (l.includes('|') || l.trim().startsWith('-') || l.trim().startsWith('*')) && !l.includes('---') && !l.toLowerCase().includes('baseline'))
    const product_goals: ProductGoal[] = goalLines.map((line, idx) => {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean)
        const catStr = (parts[0] || 'business').toLowerCase()
        const category = (catStr.includes('customer') ? 'customer' : catStr.includes('product') ? 'product' : 'business') as any
        return {
          id: `goal-${idx + 1}-${Date.now().toString(36)}`,
          category,
          goal: parts[1] || parts[0] || `Goal ${idx + 1}`,
          baseline: parts[2] || '',
          target: parts[3] || '',
          timeframe: parts[4] || '',
        }
      } else {
        const clean = line.replace(/^[-*\s]+/, '').trim()
        const [goalName, ...rest] = clean.split(':')
        const catStr = (goalName || 'business').toLowerCase()
        const category = (catStr.includes('customer') ? 'customer' : catStr.includes('product') ? 'product' : 'business') as any
        return {
          id: `goal-${idx + 1}-${Date.now().toString(36)}`,
          category,
          goal: goalName || `Goal ${idx + 1}`,
          baseline: '',
          target: rest.join(':').trim() || '',
          timeframe: '',
        }
      }
    }).filter(g => g.goal)

    // Parse Differentiation (Section 11)
    const rawDiff = parsedDoc.product_differentiation || ''
    const diffBlocks = rawDiff.split(/(?:\d+\.|\bDifferentiator\s*\d*:?)/i).filter(Boolean)
    const differentiation: DifferentiationItem[] = diffBlocks.map((block, idx) => {
      const lines = block.trim().split('\n').filter(Boolean)
      const title = lines[0]?.replace(/^[#*\s:-]+/, '').trim() || `Differentiator ${idx + 1}`
      const desc = lines.slice(1).join(' ').trim() || block.trim()
      return {
        id: `diff-${idx + 1}-${Date.now().toString(36)}`,
        title,
        description: desc.substring(0, 300),
      }
    }).filter(d => d.title)

    const { error: upsertErr } = await supabase
      .from('product_strategies')
      .upsert({
        project_id: projectId,
        organization_id: orgId,
        vision_statement: parsedDoc.product_vision || '',
        target_market: parsedDoc.target_customers || parsedDoc.market_opportunity || '',
        value_proposition: parsedDoc.value_proposition || '',
        strategic_pillars: strategic_pillars.length > 0 ? strategic_pillars : [],
        differentiation: differentiation.length > 0 ? differentiation : [],
        strategic_bets: strategic_bets.length > 0 ? strategic_bets : [],
        product_principles: product_principles.length > 0 ? product_principles : [],
        product_goals: product_goals.length > 0 ? product_goals : [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id' })

    if (upsertErr) {
      console.error('Error upserting Strategy Canvas from AI:', upsertErr)
      return { ok: false, error: upsertErr.message }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { ok: true }
  } catch (err: any) {
    console.error('Failed to sync Strategy Canvas from AI:', err)
    return { ok: false, error: err.message }
  }
}
