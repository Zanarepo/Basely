import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { GovernanceEventType } from '@/lib/governance/actions'

export interface GovernanceAuditLogEntry {
  id: string
  organization_id: string
  event_type: GovernanceEventType
  actor_user_id: string
  detail: any
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

export function useGovernanceAuditLog(organizationId: string) {
  const [logs, setLogs] = useState<GovernanceAuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<GovernanceEventType | 'all'>('all')

  const fetchLogs = useCallback(async () => {
    if (!organizationId) return

    try {
      setIsLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('governance_audit_log_entries')
        .select('*, profiles:actor_user_id(full_name, email)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (filterType !== 'all') {
        query = query.eq('event_type', filterType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching governance audit logs:', error)
        // Fallback without joining profiles if FK fails
        const fallbackQuery = supabase
          .from('governance_audit_log_entries')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          
        const fbData = filterType !== 'all' ? await fallbackQuery.eq('event_type', filterType) : await fallbackQuery
        if (!fbData.error && fbData.data) {
           setLogs(fbData.data as any)
        }
        return
      }

      setLogs(data as any)
    } catch (err) {
      console.error('Error in fetchLogs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, filterType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const downloadCsv = () => {
    if (logs.length === 0) return

    const headers = ['Timestamp', 'Event Type', 'Actor ID', 'Actor Name', 'Actor Email', 'Details']
    const csvRows = [headers.join(',')]

    for (const log of logs) {
      const actorName = log.profiles?.full_name || 'Unknown'
      const actorEmail = log.profiles?.email || 'Unknown'
      const detailStr = JSON.stringify(log.detail).replace(/"/g, '""')
      
      const row = [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.actor_user_id,
        `"${actorName}"`,
        `"${actorEmail}"`,
        `"${detailStr}"`
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `governance_audit_log_${organizationId}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    logs,
    isLoading,
    filterType,
    setFilterType,
    downloadCsv,
    refresh: fetchLogs
  }
}
