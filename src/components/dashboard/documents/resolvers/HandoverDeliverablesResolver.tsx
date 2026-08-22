'use client'

import React, { useEffect, useState } from 'react'
import { FileCheck2, Loader2, AlertCircle } from 'lucide-react'
import { resolveHandoverData } from '@/lib/documents/resolvers/handover-and-pir-resolver'
import type { HandoverData } from '@/lib/documents/resolvers/handover-and-pir-resolver'

interface HandoverDeliverablesResolverProps {
  projectId: string
  sectionKey: string
  frozenData?: any
}

export function HandoverDeliverablesResolver({ projectId, frozenData }: HandoverDeliverablesResolverProps) {
  const [data, setData] = useState<HandoverData | null>(null)
  const [loading, setLoading] = useState(!frozenData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (frozenData) {
      // If we're looking at a snapshot, we just use the frozen data directly
      // Assuming frozenData structure aligns roughly with the HandoverData deliverables array
      setData({ deliverables: frozenData } as any)
      setLoading(false)
      return
    }

    async function load() {
      try {
        const result = await resolveHandoverData(projectId)
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        console.error('Failed to load handover deliverables', err)
        if (isMounted) setError('Failed to load deliverables data.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()

    return () => { isMounted = false }
  }, [projectId, frozenData])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-app-surface border border-app-border rounded-xl">
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
        <span className="ml-3 text-sm text-app-muted">Loading WBS deliverables...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Data Fetch Error</h4>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error || 'Could not load deliverables data.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-app-border text-app-muted text-[11px] uppercase font-bold">
              <th className="py-2 px-3">Package Code</th>
              <th className="py-2 px-3">Deliverable Name</th>
              <th className="py-2 px-3">Original Engineering Lead</th>
              <th className="py-2 px-3 text-right">Handoff Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/40">
            {data.deliverables.map((d: any, idx: number) => (
              <tr key={d.code || idx} className="hover:bg-app-hover/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-app-subtle">{d.code || 'N/A'}</td>
                <td className="py-3 px-3 font-semibold text-app-fg">{d.name}</td>
                <td className="py-3 px-3 text-app-muted">{d.assignedOwner || 'Unassigned'}</td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    d.status === 'Completed' 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {d.status === 'Completed' ? 'Transferred' : 'Pending Handoff'}
                  </span>
                </td>
              </tr>
            ))}
            {data.deliverables.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-app-muted text-sm italic">
                  No deliverables found in the WBS dictionary for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
