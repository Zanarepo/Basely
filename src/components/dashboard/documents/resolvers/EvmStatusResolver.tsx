'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TrendingUp, TrendingDown, DollarSign, Activity, Lock } from 'lucide-react'

interface EvmStatusResolverProps {
  projectId: string
  periodEnd: Date
  frozenData?: any
}

export default function EvmStatusResolver({ projectId, periodEnd, frozenData }: EvmStatusResolverProps) {
  const [data, setData] = useState<any>(frozenData)
  const [loading, setLoading] = useState(!frozenData)
  const [isRestricted, setIsRestricted] = useState(false)

  useEffect(() => {
    if (frozenData) {
      setData(frozenData)
      setLoading(false)
      return
    }

    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: proj } = await supabase
          .from('projects')
          .select('organization_id, created_by')
          .eq('id', projectId)
          .single()

        if (proj && proj.created_by !== user.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', proj.organization_id)
            .eq('user_id', user.id)
            .maybeSingle()

          if (member && member.role === 'Team Member') {
            setIsRestricted(true)
            setLoading(false)
            return
          }
        }
      }
      
      const periodEndDate = periodEnd.toISOString().split('T')[0]

      // Query EVM snapshot nearest to (on or before) the period end
      const { data: snapshots, error } = await supabase
        .from('evm_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .is('wbs_element_id', null)
        .lte('snapshot_date', periodEndDate)
        .order('snapshot_date', { ascending: false })
        .limit(1)

      if (error || !snapshots || snapshots.length === 0) {
        setData(null)
        setLoading(false)
        return
      }

      setData(snapshots[0])
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

  if (isRestricted) {
    return (
      <div className="flex h-32 items-center justify-center bg-app-surface border border-app-border rounded-xl p-4 text-center">
        <div className="flex items-center gap-2 text-sm text-app-muted font-medium">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Cost & EVM metrics are restricted to Project Managers and Admins.</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-32 items-center justify-center bg-app-surface border border-app-border rounded-xl">
        <p className="text-sm text-app-muted">No EVM data recorded for this period.</p>
      </div>
    )
  }

  const { pv, ev, ac, cpi, spi, eac, vac, bac } = data

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)
  
  const formatIndex = (val: number) => (val || 0).toFixed(2)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CPI */}
        <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center justify-between">
            CPI
            {cpi >= 1 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <div className={`text-2xl font-bold ${cpi >= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {formatIndex(cpi)}
          </div>
          <div className="text-xs text-app-muted mt-1">{cpi >= 1 ? 'Under budget' : 'Over budget'}</div>
        </div>

        {/* SPI */}
        <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center justify-between">
            SPI
            {spi >= 1 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <div className={`text-2xl font-bold ${spi >= 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {formatIndex(spi)}
          </div>
          <div className="text-xs text-app-muted mt-1">{spi >= 1 ? 'Ahead of schedule' : 'Behind schedule'}</div>
        </div>

        {/* EAC */}
        <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center justify-between">
            EAC
            <DollarSign className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div className="text-2xl font-bold text-app-fg">
            {formatCurrency(eac)}
          </div>
          <div className="text-xs text-app-muted mt-1">vs BAC <span className="font-semibold">{formatCurrency(bac)}</span></div>
        </div>

        {/* VAC */}
        <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 flex items-center justify-between">
            VAC
            <Activity className="w-3.5 h-3.5 text-app-muted" />
          </div>
          <div className={`text-2xl font-bold ${vac >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatCurrency(vac)}
          </div>
          <div className="text-xs text-app-muted mt-1">{vac >= 0 ? 'Projected Surplus' : 'Projected Deficit'}</div>
        </div>
      </div>

      {/* Primary EVM Triad: PV, EV, AC */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
        <div>
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Planned Value (PV)</div>
          <div className="text-xl font-bold text-app-fg">{formatCurrency(pv)}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-app-border" />
        <div>
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Earned Value (EV)</div>
          <div className="text-xl font-bold text-indigo-500">{formatCurrency(ev)}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-app-border" />
        <div>
          <div className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Actual Cost (AC)</div>
          <div className="text-xl font-bold text-amber-500">{formatCurrency(ac)}</div>
        </div>
      </div>
    </div>
  )
}
