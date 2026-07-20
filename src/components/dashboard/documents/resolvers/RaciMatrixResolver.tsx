'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Check, Info } from 'lucide-react'

interface RaciMatrixResolverProps {
  projectId: string
}

export default function RaciMatrixResolver({ projectId }: RaciMatrixResolverProps) {
  const [elements, setElements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('wbs_elements')
        .select(`
          id,
          name,
          code,
          is_work_package,
          sort_order,
          raci_assignments (
            role_type,
            stakeholder_id,
            stakeholders (
              id,
              name
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('is_work_package', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching RACI Matrix data:', error)
      }

      if (!error && data) {
        setElements(data)
      }
      setLoading(false)
    }
    
    loadData()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center bg-app-surface border border-app-border rounded-xl mt-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-sm text-app-muted font-medium">Loading RACI Matrix data...</p>
        </div>
      </div>
    )
  }

  if (elements.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center bg-app-surface border border-app-border rounded-xl mt-4">
        <p className="text-sm text-app-muted">No Work Packages found for RACI matrix.</p>
      </div>
    )
  }

  const getStakeholderNames = (assignments: any[], roleType: string) => {
    const roleAssignments = assignments.filter(a => a.role_type === roleType)
    if (roleAssignments.length === 0) return null
    return roleAssignments.map(a => a.stakeholders?.name).join(', ')
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Legend / Info */}
      <div className="bg-app-bg border border-app-border rounded-lg p-4 flex gap-4 text-sm text-app-fg">
        <Info className="w-5 h-5 text-indigo-500 shrink-0" />
        <p>
          This RACI matrix defines clear roles and responsibilities for all Work Packages. 
          Each package must have at least one <strong>Responsible</strong> (who does the work) and exactly one <strong>Accountable</strong> (who signs off).
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-app-border shadow-sm">
        <table className="w-full text-left border-collapse text-sm bg-app-surface">
          <thead>
            <tr className="bg-app-bg border-b border-app-border uppercase tracking-wider text-xs text-app-muted">
              <th className="px-6 py-4 font-bold border-r border-app-border w-1/3">Work Package</th>
              <th className="px-6 py-4 font-bold border-r border-app-border w-1/6">Responsible</th>
              <th className="px-6 py-4 font-bold border-r border-app-border w-1/6">Accountable</th>
              <th className="px-6 py-4 font-bold border-r border-app-border w-1/6">Consulted</th>
              <th className="px-6 py-4 font-bold w-1/6">Informed</th>
            </tr>
          </thead>
          <tbody>
            {elements.map((el) => {
              const assignments = el.raci_assignments || []
              const responsible = getStakeholderNames(assignments, 'Responsible')
              const accountable = getStakeholderNames(assignments, 'Accountable')
              const consulted = getStakeholderNames(assignments, 'Consulted')
              const informed = getStakeholderNames(assignments, 'Informed')
              
              // Unowned work detection (Sprint 10 logic reused)
              const isMissingRaci = !responsible || !accountable

              return (
                <tr key={el.id} className="border-b border-app-border last:border-b-0 hover:bg-app-hover transition-colors">
                  <td className="px-6 py-4 font-medium text-app-fg border-r border-app-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-indigo-500 font-bold">{el.code}</span>
                      <span>{el.name}</span>
                      {isMissingRaci && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-sm mt-1 w-fit">
                          ⚠️ Unowned Work
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-app-border align-top">
                    {responsible ? <span className="text-app-fg">{responsible}</span> : <span className="text-app-muted/40 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 border-r border-app-border align-top">
                    {accountable ? <span className="text-app-fg">{accountable}</span> : <span className="text-app-muted/40 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 border-r border-app-border align-top">
                    {consulted ? <span className="text-app-fg">{consulted}</span> : <span className="text-app-muted/40 italic">—</span>}
                  </td>
                  <td className="px-6 py-4 align-top">
                    {informed ? <span className="text-app-fg">{informed}</span> : <span className="text-app-muted/40 italic">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
