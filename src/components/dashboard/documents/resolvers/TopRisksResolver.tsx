'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, TrendingUp, ShieldAlert, AlertCircle } from 'lucide-react'

interface TopRisksResolverProps {
  projectId: string
  periodEnd: Date
  frozenData?: any
}

export default function TopRisksResolver({ projectId, periodEnd, frozenData }: TopRisksResolverProps) {
  const [data, setData] = useState<any>(frozenData)
  const [loading, setLoading] = useState(!frozenData)

  useEffect(() => {
    if (frozenData) {
      setData(frozenData)
      setLoading(false)
      return
    }

    async function loadData() {
      const supabase = createClient()
      
      const periodEndDate = periodEnd.toISOString().split('T')[0]

      // Fetch risks for the project. For historical accuracy, we theoretically need a risk snapshot.
      // Since we don't have a snapshot table for risks, we will fetch currently open risks
      // or risks that were created before periodEnd. For launch simplicity (per PRD),
      // we'll fetch the top risks by score that are currently open and created before the periodEnd.
      const { data: risks, error } = await supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'Closed')
        .lte('created_at', periodEndDate + 'T23:59:59Z')
        .order('risk_score', { ascending: false })
        .limit(5)

      if (error || !risks) {
        console.error("Top risks fetch error:", error)
        setData([])
        setLoading(false)
        return
      }

      setData(risks)
      setLoading(false)
    }
    
    loadData()
  }, [projectId, periodEnd, frozenData])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center bg-app-surface border border-app-border rounded-xl p-6">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-app-muted" />
          <p className="text-sm text-app-muted font-medium text-center">No open risks found for this period.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((risk: any) => {
        // Determine risk level badge color
        const score = risk.score || 0
        let badgeColor = 'bg-slate-500/10 text-slate-500'
        let levelLabel = 'Unknown'

        if (score >= 15) {
          badgeColor = 'bg-rose-500/10 text-rose-500'
          levelLabel = 'Critical'
        } else if (score >= 8) {
          badgeColor = 'bg-amber-500/10 text-amber-500'
          levelLabel = 'High'
        } else if (score >= 4) {
          badgeColor = 'bg-yellow-500/10 text-yellow-600'
          levelLabel = 'Medium'
        } else {
          badgeColor = 'bg-emerald-500/10 text-emerald-500'
          levelLabel = 'Low'
        }

        return (
          <div key={risk.id} className="bg-app-surface border border-app-border rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-indigo-500/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-base font-bold text-app-fg flex-1">
                {risk.title}
              </h4>
              <div className="flex items-center gap-3 shrink-0">
                <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeColor}`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {levelLabel} ({score})
                </div>
              </div>
            </div>
            
            <p className="text-sm text-app-muted leading-relaxed line-clamp-2">
              {risk.description}
            </p>
            
            {(risk.mitigation_plan || risk.contingency_plan) && (
              <div className="mt-2 pt-3 border-t border-app-border grid grid-cols-1 md:grid-cols-2 gap-4">
                {risk.mitigation_plan && (
                  <div>
                    <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Mitigation Plan</h5>
                    <p className="text-xs text-app-fg line-clamp-1">{risk.mitigation_plan}</p>
                  </div>
                )}
                {risk.contingency_plan && (
                  <div>
                    <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Contingency Plan</h5>
                    <p className="text-xs text-app-fg line-clamp-1">{risk.contingency_plan}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
