'use client'

import React, { useEffect, useState } from 'react'
import { UserCheck, Loader2, AlertCircle } from 'lucide-react'
import { resolveHandoverData } from '@/lib/documents/resolvers/handover-and-pir-resolver'
import type { HandoverData } from '@/lib/documents/resolvers/handover-and-pir-resolver'

interface HandoverOwnersResolverProps {
  projectId: string
  sectionKey: string
  frozenData?: any
}

export function HandoverOwnersResolver({ projectId, frozenData }: HandoverOwnersResolverProps) {
  const [data, setData] = useState<HandoverData | null>(null)
  const [loading, setLoading] = useState(!frozenData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (frozenData) {
      setData({ ongoingOwners: frozenData } as any)
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
        console.error('Failed to load handover owners', err)
        if (isMounted) setError('Failed to load team data.')
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
        <span className="ml-3 text-sm text-app-muted">Loading ownership matrix...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Data Fetch Error</h4>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error || 'Could not load ownership data.'}</p>
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
              <th className="py-2 px-3">Team Member</th>
              <th className="py-2 px-3">Project Role</th>
              <th className="py-2 px-3">Ongoing / Maintenance Responsibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/40">
            {data.ongoingOwners.map((m: any, idx: number) => (
              <tr key={idx} className="hover:bg-app-hover/50 transition-colors">
                <td className="py-3 px-3 font-semibold text-app-fg">{m.name}</td>
                <td className="py-3 px-3 text-app-muted">{m.role}</td>
                <td className="py-3 px-3 text-app-subtle italic">
                  {m.responsibility}
                </td>
              </tr>
            ))}
            {data.ongoingOwners.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-app-muted text-sm italic">
                  No active team members mapped for ongoing support.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
