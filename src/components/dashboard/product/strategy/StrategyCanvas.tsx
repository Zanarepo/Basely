'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { ProductStrategy, StrategicPillar, CompetitiveMoat } from '@/lib/product-strategy/types'
import { getProductStrategy, saveProductStrategy } from '@/lib/product-strategy/actions'
import { PillarEditor } from './PillarEditor'
import { MoatMatrix } from './MoatMatrix'
import { createClient } from '@/utils/supabase/client'
import { Compass, Save, CheckCircle2, Loader2, Globe, Sparkles, Zap, Plus, Trash2, Layers } from 'lucide-react'

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
  const [newDimTitle, setNewDimTitle] = useState('')
  const [newDimDesc, setNewDimDesc] = useState('')

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
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-500" />
        <span className="text-sm font-medium">Loading Product Strategy & Vision Canvas...</span>
      </div>
    )
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Product Strategy & Vision Canvas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Live Strategic Record
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Unify executive vision, customer market segments, defensibility moats, and operational pillars into an immutable source of truth.
            </p>
          </div>
        </div>

        {/* Save Status & Button */}
        <div className="flex items-center justify-end space-x-3 shrink-0">
          {lastSaved && !isDirty && !saving && (
            <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Synced {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isDirty && !saving && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
              Unsaved changes
            </span>
          )}

          {hasEditAccess && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-[#6b4eff] hover:bg-[#5839ec] rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Canvas
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 rounded-lg">
          {saveError}
        </div>
      )}

      {/* Primary Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* North Star Vision (Full or 2 Col) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>North Star Vision Statement</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              What transformative future are we engineering over the next 3 to 5 years?
            </p>
            <textarea
              rows={4}
              disabled={!hasEditAccess}
              value={strategy.vision_statement || ''}
              onChange={(e) => handleFieldChange('vision_statement', e.target.value)}
              placeholder="e.g. To revolutionize Enterprise delivery by creating an AI-agentic ecosystem where product strategy and engineering execution merge effortlessly..."
              className="w-full mt-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-serif text-base leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
            />
          </div>
        </div>

        {/* Target Market Segmentation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Target Market Segmentation</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Which high-value customer tiers (TAM/SAM) are we aggressively serving?
            </p>
            <textarea
              rows={4}
              disabled={!hasEditAccess}
              value={strategy.target_market || ''}
              onChange={(e) => handleFieldChange('target_market', e.target.value)}
              placeholder="e.g. Enterprise PMOs and SaaS technology firms managing cross-functional technical teams..."
              className="w-full mt-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* Value Proposition Band */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
          <span>Core Value Proposition & Differentiating Advantage</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Why do customers choose this solution over established market alternatives? What is our unmatched competitive leverage?
        </p>
        <textarea
          rows={3}
          disabled={!hasEditAccess}
          value={strategy.value_proposition || ''}
          onChange={(e) => handleFieldChange('value_proposition', e.target.value)}
          placeholder="e.g. Traditional project software separates product strategy from engineering tasks. Our solution unifies discovery and execution into a live relational database with real-time generative documentation."
          className="w-full mt-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y shadow-inner"
        />
      </div>

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

      {/* Dynamic Custom Strategy Dimensions & Document Columns */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
              Dynamic Custom Strategy Dimensions & Additional Columns
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Add extra custom sections for document auto-filling</span>
        </div>

        {strategy.custom_attributes && Object.keys(strategy.custom_attributes).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(strategy.custom_attributes).map(([key, value]) => (
              <div key={key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between group relative transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {key}
                    </span>
                    {hasEditAccess && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const updated = { ...(strategy.custom_attributes || {}) }
                          delete updated[key]
                          handleFieldChange('custom_attributes', updated)
                        }}
                        style={{ cursor: 'pointer' }}
                        className="text-slate-400 hover:text-red-500 transition-opacity duration-200 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Custom Dimension"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-2 whitespace-pre-wrap">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            No custom strategic dimensions added yet. Add custom analytical columns (e.g. Go-to-Market Channels, Regulatory Risk, Unit Economics) below.
          </p>
        )}

        {hasEditAccess && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newDimTitle}
                onChange={(e) => setNewDimTitle(e.target.value)}
                placeholder="Column / Dimension Name (e.g. GTM Strategy)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex items-center space-x-2">
              <input
                type="text"
                value={newDimDesc}
                onChange={(e) => setNewDimDesc(e.target.value)}
                placeholder="Content description or strategic values..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (!newDimTitle.trim() || !newDimDesc.trim()) return
                  const updated = { ...(strategy.custom_attributes || {}), [newDimTitle.trim()]: newDimDesc.trim() }
                  handleFieldChange('custom_attributes', updated)
                  setNewDimTitle('')
                  setNewDimDesc('')
                }}
                style={{ cursor: 'pointer' }}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Dimension
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
