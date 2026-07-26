'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, UserIcon, Mail } from 'lucide-react'

interface StakeholderRegisterResolverProps {
  projectId: string
  periodEnd?: Date
  frozenData?: any
}

export default function StakeholderRegisterResolver({ projectId, periodEnd, frozenData }: StakeholderRegisterResolverProps) {
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

      const { data: stakeholders, error } = await supabase
        .from('stakeholders')
        .select('*')
        .eq('project_id', projectId)
        .order('influence', { ascending: false })

      if (error || !stakeholders) {
        console.error("Stakeholders fetch error:", error)
        setData([])
        setLoading(false)
        return
      }

      setData(stakeholders)
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
          <Users className="w-8 h-8 text-app-muted" />
          <p className="text-sm text-app-muted font-medium text-center">No stakeholders found.</p>
        </div>
      </div>
    )
  }

  // Group by internal / external
  const internalStakeholders = data.filter((s: any) => s.type === 'Internal')
  const externalStakeholders = data.filter((s: any) => s.type !== 'Internal')

  const renderSection = (title: string, stakeholders: any[]) => {
    if (stakeholders.length === 0) return null

    return (
      <div className="mb-8">
        <h4 className="text-sm font-bold text-app-fg mb-4 uppercase tracking-wider">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-app-bg border-b border-app-border">
                <th className="px-4 py-3 font-semibold text-app-fg">Name</th>
                <th className="px-4 py-3 font-semibold text-app-fg">Role</th>
                <th className="px-4 py-3 font-semibold text-app-fg">Influence / Interest</th>
                <th className="px-4 py-3 font-semibold text-app-fg">Requirements / Expectations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {stakeholders.map((s: any) => (
                <tr key={s.id} className="hover:bg-app-hover/50 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-app-fg">{s.name}</div>
                    {s.email && (
                      <div className="flex items-center gap-1 text-xs text-app-muted mt-1">
                        <Mail className="w-3 h-3" />
                        {s.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-app-muted">{s.role_title || '-'}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-400">
                        Inf: {s.influence || 3}/5
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-400">
                        Int: {s.interest || 3}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-xs text-app-muted line-clamp-3">
                      {s.requirements || '-'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm">
      {renderSection('Internal Stakeholders', internalStakeholders)}
      {renderSection('External Stakeholders', externalStakeholders)}
    </div>
  )
}
