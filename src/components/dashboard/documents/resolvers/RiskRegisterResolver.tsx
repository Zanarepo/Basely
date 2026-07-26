'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ShieldAlert, AlertCircle } from 'lucide-react'

interface RiskRegisterResolverProps {
  projectId: string
  periodEnd?: Date
  frozenData?: any
}

export default function RiskRegisterResolver({ projectId, periodEnd, frozenData }: RiskRegisterResolverProps) {
  const [data, setData] = useState<any>(frozenData)
  const [loading, setLoading] = useState(!frozenData)
  const [stakeholders, setStakeholders] = useState<any[]>([])

  useEffect(() => {
    if (frozenData) {
      setData(frozenData.risks)
      if (frozenData.stakeholders) setStakeholders(frozenData.stakeholders)
      setLoading(false)
      return
    }

    async function loadData() {
      const supabase = createClient()

      let query = supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId)
        .order('risk_score', { ascending: false })
      
      if (periodEnd) {
        const periodEndDate = periodEnd.toISOString().split('T')[0]
        query = query.lte('created_at', periodEndDate + 'T23:59:59Z')
      }

      const [risksRes, stakeholdersRes] = await Promise.all([
        query,
        supabase.from('stakeholders').select('id, name, role_title').eq('project_id', projectId)
      ])

      if (risksRes.error || !risksRes.data) {
        console.error("Risks fetch error:", risksRes.error)
        setData([])
      } else {
        setData(risksRes.data)
      }

      if (stakeholdersRes.data) {
        setStakeholders(stakeholdersRes.data)
      }

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
          <p className="text-sm text-app-muted font-medium text-center">No risks logged in this project yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {data.map((risk: any) => {
        const owner = stakeholders.find(s => s.id === risk.owner_stakeholder_id)
        const score = risk.risk_score || 0
        let badgeColor = 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        let levelLabel = 'Unknown'

        if (score >= 15) {
          badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          levelLabel = 'Critical'
        } else if (score >= 8) {
          badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          levelLabel = 'High'
        } else if (score >= 4) {
          badgeColor = 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
          levelLabel = 'Medium'
        } else {
          badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          levelLabel = 'Low'
        }

        return (
          <div key={risk.id} className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${badgeColor}`}>
                    Score: {score} ({levelLabel})
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-app-hover rounded-md text-app-muted border border-app-border">
                    {risk.status}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-app-fg">{risk.title}</h4>
              </div>
            </div>

            {risk.description && (
              <p className="text-sm text-app-muted leading-relaxed">
                {risk.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-app-border">
              <div>
                <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Probability</h5>
                <p className="text-sm font-semibold text-app-fg">{risk.probability} / 5</p>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Impact</h5>
                <p className="text-sm font-semibold text-app-fg">{risk.impact} / 5</p>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Strategy</h5>
                <p className="text-sm font-semibold text-app-fg">{risk.response_strategy || '-'}</p>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1">Owner</h5>
                <p className="text-sm font-semibold text-app-fg">{owner?.name || 'Unassigned'}</p>
              </div>
            </div>

            {risk.mitigation_plan && (
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4 mt-2">
                <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mitigation Strategy
                </h5>
                <p className="text-sm text-app-fg whitespace-pre-wrap leading-relaxed">
                  {risk.mitigation_plan}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
