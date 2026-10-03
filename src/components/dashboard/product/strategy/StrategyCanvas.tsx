'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { ProductStrategy, StrategicPillar, CompetitiveMoat } from '@/lib/product-strategy/types'
import { getProductStrategy, saveProductStrategy } from '@/lib/product-strategy/strategy-actions'
import { PillarEditor } from './PillarEditor'
import { MoatMatrix } from './MoatMatrix'
import { DifferentiationEditor } from './DifferentiationEditor'
import { StrategicBetsEditor } from './StrategicBetsEditor'
import { ProductPrinciplesEditor } from './ProductPrinciplesEditor'
import { ProductGoalsEditor } from './ProductGoalsEditor'
import { StrategyHeader } from './components/StrategyHeader'
import { CoreStrategyFields } from './components/CoreStrategyFields'
import { AiInsightsPanel } from './components/AiInsightsPanel'
import { CustomDimensionsPanel } from './components/CustomDimensionsPanel'
import { createClient } from '@/utils/supabase/client'
import { Compass, Save, CheckCircle2, Loader2, Globe, Sparkles, Zap, Plus, Trash2, Layers, AlertTriangle, ShieldCheck } from 'lucide-react'
import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'

interface StrategyCanvasProps {
  projectId: string
  organizationId: string
  hasEditAccess?: boolean
}

export function StrategyCanvas({ projectId, organizationId, hasEditAccess = true }: StrategyCanvasProps) {
  const [strategy, setStrategy] = useState<ProductStrategy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fetchStrategy = useCallback(async () => {
    setLoading(true)
    const data = await getProductStrategy(projectId, organizationId)
    if (data) {
      setStrategy(data)
      setLastSaved(new Date(data.updated_at))
    }
    setLoading(false)
  }, [projectId, organizationId])

  useEffect(() => {
    fetchStrategy()
  }, [fetchStrategy])

  // Realtime subscription using synchronous client import and unique channel topic hash
  useEffect(() => {
    const supabase = createClient()
    const topicHash = Math.random().toString(36).substring(2, 8)
    const channel = supabase
      .channel(`strategy_sync:${projectId}_${topicHash}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'product_strategies',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Automatically sync collaborative remote edits if user is not currently composing unsaved changes
        if (!isDirty && payload.new) {
          setStrategy(payload.new as ProductStrategy)
          setLastSaved(new Date((payload.new as any).updated_at))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, isDirty])

  const handleFieldChange = (field: keyof ProductStrategy, value: any) => {
    if (!strategy) return
    setStrategy({ ...strategy, [field]: value })
    setIsDirty(true)
  }

  // Auto-Save Debounce Effect
  useEffect(() => {
    if (!isDirty || !strategy || !hasEditAccess || saving) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // 2 seconds debounce

    return () => clearTimeout(timer)
  }, [strategy, isDirty, hasEditAccess, saving])

  const handleSave = async () => {
    if (!strategy || !hasEditAccess) return
    setSaving(true)
    setSaveError(null)

    const res = await saveProductStrategy(projectId, organizationId, {
      vision_statement: strategy.vision_statement,
      target_market: strategy.target_market,
      value_proposition: strategy.value_proposition,
      strategic_pillars: strategy.strategic_pillars,
      competitive_moats: strategy.competitive_moats,
      differentiation: strategy.differentiation,
      strategic_bets: strategy.strategic_bets,
      product_principles: strategy.product_principles,
      product_goals: strategy.product_goals,
      custom_attributes: strategy.custom_attributes
    })

    setSaving(false)
    if (res.ok && res.data) {
      setStrategy(res.data)
      setIsDirty(false)
      setLastSaved(new Date(res.data.updated_at))
    } else {
      setSaveError(res.error || 'Failed to save strategy changes.')
    }
  }

  if (loading) {
    return <DocumentLoader message="Loading Product Strategy & Vision Canvas..." />
  }

  if (!strategy) {
    return (
      <div className="p-6 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">
        Failed to initialize Product Strategy Canvas for this workspace.
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Action Controls */}
      <StrategyHeader 
        lastSaved={lastSaved}
        isDirty={isDirty}
        saving={saving}
        hasEditAccess={hasEditAccess}
        handleSave={handleSave}
        saveError={saveError}
      />

      {/* Core Strategy Fields */}
      <CoreStrategyFields 
        strategy={strategy}
        handleFieldChange={handleFieldChange}
        hasEditAccess={hasEditAccess}
      />

      {/* Strategic Pillars Module */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <PillarEditor
          pillars={strategy.strategic_pillars || []}
          onChange={(pillars: StrategicPillar[]) => handleFieldChange('strategic_pillars', pillars)}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Competitive Moats Module */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <MoatMatrix
          moats={strategy.competitive_moats || []}
          onChange={(moats: CompetitiveMoat[]) => handleFieldChange('competitive_moats', moats)}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Competitive Differentiation (Section 11) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <DifferentiationEditor
          items={strategy.differentiation || []}
          onChange={(items) => handleFieldChange('differentiation', items)}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Strategic Bets (Section 12) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <StrategicBetsEditor
          bets={strategy.strategic_bets || []}
          onChange={(bets) => handleFieldChange('strategic_bets', bets)}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Product Principles (Section 14) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <ProductPrinciplesEditor
          principles={strategy.product_principles || []}
          onChange={(principles) => handleFieldChange('product_principles', principles)}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Product Goals (Section 15) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <ProductGoalsEditor
          goals={strategy.product_goals || []}
          onChange={(goals) => handleFieldChange('product_goals', goals)}
          hasEditAccess={hasEditAccess}
        />
      </div>


      {/* AI-Synthesized Insights */}
      <AiInsightsPanel strategy={strategy} />

      {/* Custom Dimensions */}
      <CustomDimensionsPanel 
        strategy={strategy}
        handleFieldChange={handleFieldChange}
        hasEditAccess={hasEditAccess}
      />
    </div>
  )
}
