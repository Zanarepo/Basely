'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { WbsElement } from '@/lib/wbs/constants'

interface WbsDictionaryResolverProps {
  projectId: string
}

export default function WbsDictionaryResolver({ projectId }: WbsDictionaryResolverProps) {
  const [elements, setElements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Fetch all WBS elements and their RACI assignments
      const { data, error } = await supabase
        .from('wbs_elements')
        .select(`
          id,
          project_id,
          name,
          code,
          description,
          deliverables,
          deliverables_data,
          acceptance_criteria,
          acceptance_criteria_data,
          parent_id,
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
        .order('sort_order', { ascending: true })

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
          <p className="text-sm text-app-muted font-medium">Loading WBS Dictionary data...</p>
        </div>
      </div>
    )
  }

  if (elements.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center bg-app-surface border border-app-border rounded-xl mt-4">
        <p className="text-sm text-app-muted">No WBS elements found in this project.</p>
      </div>
    )
  }

  // Format elements hierarchically
  return (
    <div className="flex flex-col gap-6 mt-4">
      {elements.map((el) => {
        const isParent = !el.is_work_package
        
        // Find Accountable stakeholder(s)
        const accountableAssignments = el.raci_assignments?.filter((a: any) => a.role_type === 'Accountable') || []
        const accountableNames = accountableAssignments.length > 0 
          ? accountableAssignments.map((a: any) => a.stakeholders?.name).join(', ')
          : 'None'

        if (isParent) {
          // Render as a section header
          return (
            <div key={el.id} className="pt-6 pb-2 border-b border-app-border mt-4">
              <h3 className="text-lg font-bold text-app-fg">
                <span className="text-app-muted mr-3">{el.code}</span>
                {el.name}
              </h3>
            </div>
          )
        }

        // Render as a Work Package dictionary entry
        return (
          <div key={el.id} className="bg-app-surface border border-app-border rounded-xl p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h4 className="text-base font-bold text-app-fg">
                <span className="text-indigo-500 mr-2">{el.code}</span>
                {el.name}
              </h4>
              <div className="flex items-center gap-2 text-sm bg-app-bg border border-app-border px-3 py-1.5 rounded-full">
                <span className="text-app-muted font-medium">Accountable:</span>
                <span className={`font-semibold ${accountableNames === 'None' ? 'text-amber-500' : 'text-app-fg'}`}>
                  {accountableNames}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <h5 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Description</h5>
                <p className="text-sm text-app-fg leading-relaxed">
                  {el.description || <span className="text-app-muted italic">No description provided</span>}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-app-border">
                <div>
                  <h5 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Deliverables</h5>
                  {el.deliverables_data && el.deliverables_data.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-sm text-app-fg">
                      {el.deliverables_data.map((item: any) => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-app-fg leading-relaxed whitespace-pre-wrap">
                      {el.deliverables || <span className="text-app-muted italic">No deliverables defined</span>}
                    </p>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Acceptance Criteria</h5>
                  {el.acceptance_criteria_data && el.acceptance_criteria_data.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-sm text-app-fg">
                      {el.acceptance_criteria_data.map((item: any) => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-app-fg leading-relaxed whitespace-pre-wrap">
                      {el.acceptance_criteria || <span className="text-app-muted italic">No acceptance criteria defined</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
