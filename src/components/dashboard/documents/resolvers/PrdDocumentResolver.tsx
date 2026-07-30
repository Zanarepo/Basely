'use client'

import React, { useEffect, useState } from 'react'
import type { ProductRequirementsDoc, DiscoveryInsight, Persona, OkrObjective } from '@/lib/product-strategy/types'
import { createClient } from '@/utils/supabase/client'
import { Loader2, FileText, User, Target, Lightbulb, Shield, Link2, CheckCircle2 } from 'lucide-react'

interface PrdDocumentResolverProps {
  projectId: string
  source: 'prd.objective_overview' | 'prd.discovery_insights'
}

export function PrdDocumentResolver({ projectId, source }: PrdDocumentResolverProps) {
  const [prdMeta, setPrdMeta] = useState<ProductRequirementsDoc | null>(null)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [objective, setOkr] = useState<OkrObjective | null>(null)
  const [insights, setInsights] = useState<DiscoveryInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const supabase = createClient()

      // Fetch PRD metadata for this project
      const { data: prdList } = await supabase
        .from('product_requirements_docs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)

      const prd = prdList && prdList.length > 0 ? (prdList[0] as ProductRequirementsDoc) : null
      setPrdMeta(prd)

      if (source === 'prd.objective_overview' && prd) {
        // Load the associated persona and OKR
        if (prd.target_persona_id) {
          const { data: p } = await supabase
            .from('personas')
            .select('*')
            .eq('id', prd.target_persona_id)
            .single()
          setPersona(p as Persona | null)
        }
        if (prd.primary_okr_id) {
          const { data: o } = await supabase
            .from('okr_objectives')
            .select('*')
            .eq('id', prd.primary_okr_id)
            .single()
          setOkr(o as OkrObjective | null)
        }
      }

      if (source === 'prd.discovery_insights') {
        // Load all discovery insights for this project
        const { data: di } = await supabase
          .from('discovery_insights')
          .select('*, persona:personas(id, name, role_title, avatar_color)')
          .or(`project_id.eq.${projectId},project_id.is.null`)
          .order('severity', { ascending: false })
          .limit(20)
        setInsights((di as DiscoveryInsight[]) || [])
      }

      setLoading(false)
    }
    loadData()
  }, [projectId, source])

  if (loading) {
    return (
      <div className="flex items-center py-4 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-violet-500" />
        Resolving live PRD data...
      </div>
    )
  }

  // ─── Source: prd.objective_overview ───
  if (source === 'prd.objective_overview') {
    if (!prdMeta) {
      return (
        <div className="text-xs text-slate-400 italic py-3">
          No PRD metadata linked to this project yet. Use the PRD Studio metadata ribbon above to set Target Persona, Primary OKR, and Figma URL.
        </div>
      )
    }

    const statusColor = prdMeta.prd_status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
      prdMeta.prd_status === 'in_review' ? 'text-amber-600 bg-amber-50 border-amber-200' :
      prdMeta.prd_status === 'deprecated' ? 'text-red-600 bg-red-50 border-red-200' :
      'text-sky-600 bg-sky-50 border-sky-200'

    return (
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>
            <CheckCircle2 className="w-3 h-3" />
            PRD Status: {prdMeta.prd_status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Linked Entities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {persona && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <User className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Target Persona</div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{persona.name}</div>
                <div className="text-[10px] text-slate-500">{persona.role_title}</div>
              </div>
            </div>
          )}

          {objective && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <Target className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Primary OKR</div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{objective.title}</div>
                <div className="text-[10px] text-slate-500">Progress: {objective.progress}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Figma URL */}
        {prdMeta.figma_url && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Link2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mr-2">Figma:</div>
            <a
              href={prdMeta.figma_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline truncate"
            >
              {prdMeta.figma_url}
            </a>
          </div>
        )}
      </div>
    )
  }

  // ─── Source: prd.discovery_insights ───
  if (source === 'prd.discovery_insights') {
    if (insights.length === 0) {
      return (
        <div className="text-xs text-slate-400 italic py-3">
          No Discovery Insights have been logged for this project yet. Use the VoC Discovery Inbox to log customer feedback.
        </div>
      )
    }

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const sorted = [...insights].sort((a, b) =>
      (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
    )

    return (
      <div className="space-y-2">
        {sorted.map(insight => {
          const sevColor = insight.severity === 'critical' ? 'text-red-600 bg-red-50 border-red-200' :
            insight.severity === 'high' ? 'text-orange-600 bg-orange-50 border-orange-200' :
            insight.severity === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
            'text-emerald-600 bg-emerald-50 border-emerald-200'

          return (
            <div key={insight.id} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{insight.title}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${sevColor}`}>
                    <Shield className="w-2 h-2" />
                    {insight.severity}
                  </span>
                  {insight.persona && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <User className="w-2 h-2" />
                      {insight.persona.name}
                    </span>
                  )}
                </div>
                {insight.description && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{insight.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}
