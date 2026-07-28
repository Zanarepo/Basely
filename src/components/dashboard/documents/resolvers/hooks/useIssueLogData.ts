'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface IssueItem {
  id: string
  title: string
  description?: string
  raised_date: string
  status: string
  owner_stakeholder_id?: string
  owner_name?: string
  owner_role?: string
  linked_risk_id?: string
  linked_risk_title?: string
  created_at: string
}

export interface IssueLogData {
  issues: IssueItem[]
  loading: boolean
  error?: string
  refetch: () => Promise<void>
}

export function useIssueLogData(projectId: string, periodEnd?: Date, frozenData?: any): IssueLogData {
  const [loading, setLoading] = useState(!frozenData)
  const [issues, setIssues] = useState<IssueItem[]>(frozenData || [])
  const [error, setError] = useState<string>()

  const loadData = useCallback(async () => {
    if (frozenData) {
      setIssues(frozenData || [])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      let query = supabase
        .from('issues')
        .select('*')
        .eq('project_id', projectId)
        .order('raised_date', { ascending: false })

      if (periodEnd) {
        const periodEndDate = periodEnd.toISOString().split('T')[0]
        query = query.lte('raised_date', periodEndDate + 'T23:59:59Z')
      }

      const [issuesRes, stakeholdersRes, risksRes] = await Promise.all([
        query,
        supabase.from('stakeholders').select('id, name, role_title').eq('project_id', projectId),
        supabase.from('risks').select('id, title').eq('project_id', projectId)
      ])

      if (issuesRes.error) throw issuesRes.error

      const rawIssues = issuesRes.data || []
      const stakeholders = stakeholdersRes.data || []
      const risks = risksRes.data || []

      const mapped: IssueItem[] = rawIssues.map(issue => {
        const owner = stakeholders.find(s => s.id === issue.owner_stakeholder_id)
        const risk = risks.find(r => r.id === issue.linked_risk_id)
        return {
          ...issue,
          owner_name: owner?.name || 'Unassigned',
          owner_role: owner?.role_title || 'N/A',
          linked_risk_title: risk?.title || 'No Linked Risk'
        }
      })

      setIssues(mapped)
    } catch (err: any) {
      console.error('Error loading issue log data:', err)
      setError('Failed to load issue log data.')
      setIssues([])
    } finally {
      setLoading(false)
    }
  }, [projectId, periodEnd, frozenData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    issues,
    loading,
    error,
    refetch: loadData
  }
}
