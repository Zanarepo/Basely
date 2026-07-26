'use client'

import React, { useEffect, useState } from 'react'
import { getScopeStatement, ScopeStatement } from '@/lib/planning/actions'
import { Loader2 } from 'lucide-react'
import { getWbsElements } from '@/lib/wbs/actions'
import { WbsElement } from '@/lib/wbs/constants'

interface ScopeStatementResolverProps {
  projectId: string
  sectionKey?: string
}

export function ScopeStatementResolver({ projectId, sectionKey }: ScopeStatementResolverProps) {
  const [data, setData] = useState<ScopeStatement | null>(null)
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [scopeRes, wbsRes] = await Promise.all([
        getScopeStatement(projectId),
        getWbsElements(projectId)
      ])
      
      if (!scopeRes.error && scopeRes.data) {
        setData(scopeRes.data)
      }
      if (wbsRes.ok && wbsRes.data) {
        setWbsElements(wbsRes.data)
      }
      setIsLoading(false)
    }
    
    fetchData()
  }, [projectId])

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-app-muted" /></div>
  }

  if (!data) {
    return <div className="p-4 text-sm text-app-muted">No Scope Statement data available.</div>
  }

  const anchoredWbs = wbsElements.filter(w => data.anchored_wbs_element_ids?.includes(w.id))

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-app-fg text-sm mb-2">In-Scope</h4>
        <p className="text-sm text-app-muted whitespace-pre-wrap">{data.in_scope_summary || 'Not specified'}</p>
      </div>

      {anchoredWbs.length > 0 && (
        <div>
          <h4 className="font-semibold text-app-fg text-sm mb-2">Anchored WBS Deliverables</h4>
          <ul className="list-disc pl-5 text-sm text-app-muted space-y-1">
            {anchoredWbs.map(w => (
              <li key={w.id}>
                <span className="font-medium text-app-fg">{w.code}</span> - {w.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-app-fg text-sm mb-2">Out of Scope</h4>
        <p className="text-sm text-app-muted whitespace-pre-wrap">{data.out_of_scope || 'Not specified'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-app-fg text-sm mb-2">Assumptions</h4>
          <p className="text-sm text-app-muted whitespace-pre-wrap">{data.assumptions || 'None'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-app-fg text-sm mb-2">Constraints</h4>
          <p className="text-sm text-app-muted whitespace-pre-wrap">{data.constraints || 'None'}</p>
        </div>
      </div>
    </div>
  )
}
