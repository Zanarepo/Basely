'use client'

import React, { useEffect, useState } from 'react'
import { getCommunicationPlanEntries, CommunicationPlanEntry } from '@/lib/planning/actions'
import { getAvailableDocumentTypes } from '@/lib/documents/actions'
import { Loader2 } from 'lucide-react'

interface CommunicationPlanResolverProps {
  projectId: string
  sectionKey?: string
}

export function CommunicationPlanResolver({ projectId, sectionKey }: CommunicationPlanResolverProps) {
  const [entries, setEntries] = useState<CommunicationPlanEntry[]>([])
  const [docTypes, setDocTypes] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [entriesRes, docsRes] = await Promise.all([
        getCommunicationPlanEntries(projectId),
        getAvailableDocumentTypes()
      ])
      
      if (!entriesRes.error && entriesRes.data) {
        setEntries(entriesRes.data)
      }
      if (docsRes) {
        setDocTypes(docsRes)
      }
      setIsLoading(false)
    }
    
    fetchData()
  }, [projectId])

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-app-muted" /></div>
  }

  if (entries.length === 0) {
    return <div className="p-4 text-sm text-app-muted">No communication plan mapped for this project.</div>
  }

  return (
    <div className="w-full overflow-x-auto border border-app-border rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-app-border bg-app-surface">
            <th className="px-4 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Stakeholder</th>
            <th className="px-4 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Document Type</th>
            <th className="px-4 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Cadence</th>
            <th className="px-4 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Channel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-app-surface/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-semibold text-app-fg text-sm">{entry.stakeholders?.name || 'Unknown'}</div>
                <div className="text-xs text-app-muted">{entry.stakeholders?.role_title || ''}</div>
              </td>
              <td className="px-4 py-3 text-sm text-app-fg">
                {docTypes.find(d => d.id === entry.document_type)?.name || entry.document_type}
              </td>
              <td className="px-4 py-3 text-sm text-app-fg">{entry.cadence || '—'}</td>
              <td className="px-4 py-3 text-sm text-app-fg">{entry.channel || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
