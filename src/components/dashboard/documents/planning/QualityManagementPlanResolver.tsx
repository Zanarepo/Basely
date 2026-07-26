'use client'

import React, { useEffect, useState } from 'react'
import { getQualityManagementPlan, QualityManagementPlan, QualityStandard } from '@/lib/planning/quality-actions'
import { CheckSquare, FileText } from 'lucide-react'

export function QualityManagementPlanResolver({ projectId }: { projectId: string }) {
  const [plan, setPlan] = useState<QualityManagementPlan | null>(null)
  const [standards, setStandards] = useState<QualityStandard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      const res = await getQualityManagementPlan(projectId)
      if (!res.error) {
        if (res.plan) setPlan(res.plan)
        if (res.standards) setStandards(res.standards)
      }
      setIsLoading(false)
    }
    fetchPlan()
  }, [projectId])

  if (isLoading) return <div className="p-4 text-sm text-app-muted">Loading quality plan...</div>

  return (
    <div className="space-y-6">
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-surface/50">
          <h3 className="text-sm font-semibold text-app-fg">Quality Review Cadence</h3>
        </div>
        <div className="p-4 text-sm text-app-fg">
          {plan?.review_cadence || <span className="text-app-muted italic">No cadence defined</span>}
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-surface/50">
          <h3 className="text-sm font-semibold text-app-fg">Quality Standards</h3>
        </div>
        <div className="divide-y divide-app-border">
          {standards.length === 0 ? (
            <div className="p-4 text-sm text-app-muted italic">No quality standards defined.</div>
          ) : (
            standards.map(std => (
              <div key={std.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {std.is_checklist_item ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckSquare className="w-3 h-3" /> Checklist
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <FileText className="w-3 h-3" /> Prose Standard
                    </span>
                  )}
                </div>
                <div className="text-sm text-app-fg whitespace-pre-wrap">{std.criterion_text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
