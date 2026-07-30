'use client'

import React, { useEffect, useState } from 'react'
import type { ProductStrategy, Persona } from '@/lib/product-strategy/types'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Sparkles, Users, Globe, ShieldCheck, Award } from 'lucide-react'

interface ProductStrategyResolverProps {
  projectId: string
  source: 'product.strategy_canvas' | 'product.target_market' | 'product.competitive_moats' | 'product.personas'
}

export function ProductStrategyResolver({ projectId, source }: ProductStrategyResolverProps) {
  const [strategy, setStrategy] = useState<ProductStrategy | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const supabase = createClient()

      if (source === 'product.personas') {
        const { data } = await supabase
          .from('personas')
          .select('*')
          .or(`project_id.eq.${projectId},project_id.is.null`)
          .order('created_at', { ascending: false })
        setPersonas((data as Persona[]) || [])
      } else {
        const { data } = await supabase
          .from('product_strategies')
          .select('*')
          .eq('project_id', projectId)
          .single()
        setStrategy(data as ProductStrategy | null)
      }
      setLoading(false)
    }
    loadData()
  }, [projectId, source])

  if (loading) {
    return (
      <div className="flex items-center py-4 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-500" />
        Resolving live product strategy records...
      </div>
    )
  }

  if (source === 'product.personas') {
    if (personas.length === 0) {
      return <p className="text-slate-500 dark:text-slate-400 italic text-sm">No customer personas registered for this workspace yet.</p>
    }

    return (
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 shadow-2xs">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: persona.avatar_color || '#6366f1' }}
                >
                  {persona.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{persona.name}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{persona.role_title}</span>
                </div>
              </div>

              {persona.jtbd_statement && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 my-2 text-xs italic text-slate-700 dark:text-slate-300">
                  <span className="block font-semibold not-italic text-[10px] text-blue-600 dark:text-blue-400 uppercase mb-0.5">Jobs-To-Be-Done</span>
                  "{persona.jtbd_statement}"
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
                  <strong className="block text-[10px] uppercase text-emerald-600 mb-1">Motivations</strong>
                  {persona.motivations || 'N/A'}
                </div>
                <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30">
                  <strong className="block text-[10px] uppercase text-rose-600 mb-1">Pain Points</strong>
                  {persona.pain_points || 'N/A'}
                </div>
              </div>

              {persona.custom_attributes && Object.keys(persona.custom_attributes).length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                  {Object.entries(persona.custom_attributes).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!strategy) {
    return <p className="text-slate-500 dark:text-slate-400 italic text-sm">No Product Strategy & Vision Canvas defined for this project workspace.</p>
  }

  if (source === 'product.target_market') {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {strategy.target_market || 'No Target Market segmentation documented yet.'}
      </div>
    )
  }

  if (source === 'product.competitive_moats') {
    const moats = strategy.competitive_moats || []
    if (moats.length === 0) return <p className="text-slate-400 italic text-sm">No competitive moats charted yet.</p>

    return (
      <div className="space-y-3 pt-2">
        {moats.map((moat) => (
          <div key={moat.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Award className="w-3 h-3 mr-1" />
                {moat.category.replace('_', ' ')}
              </span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{moat.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">{moat.description}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 shrink-0 ml-4">
              {moat.strength} defensibility
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Fallback / Main canvas resolution for product.strategy_canvas
  return (
    <div className="space-y-6 pt-2">
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          North Star Vision
        </span>
        <p className="font-serif text-base text-slate-900 dark:text-white leading-relaxed">
          {strategy.vision_statement || 'No Vision Statement drafted.'}
        </p>
      </div>

      {strategy.value_proposition && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Core Value Proposition</span>
          <p className="text-sm text-slate-800 dark:text-slate-200">{strategy.value_proposition}</p>
        </div>
      )}

      {/* Strategic Pillars Roster */}
      {strategy.strategic_pillars && strategy.strategic_pillars.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Strategic Pillars</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strategy.strategic_pillars.map(pillar => (
              <div key={pillar.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  {pillar.title}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{pillar.description}</p>
                {pillar.target_metric && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900">
                    Target KPI: {pillar.target_metric}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Custom Strategy Dimensions */}
      {strategy.custom_attributes && Object.keys(strategy.custom_attributes).length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Additional Custom Dimensions & Columns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(strategy.custom_attributes).map(([k, v]) => (
              <div key={k} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-xs text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">{k}</h5>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
