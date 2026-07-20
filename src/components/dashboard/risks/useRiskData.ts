'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { WbsElement } from '@/lib/wbs/constants'

export type Risk = {
  id: string
  project_id: string
  title: string
  description: string | null
  probability: number
  impact: number
  risk_score: number
  response_strategy: 'Avoid' | 'Mitigate' | 'Transfer' | 'Accept' | null
  status: string
  owner_stakeholder_id: string | null
  allocated_contingency_amount: number | null
  linked_wbs_element_id: string | null
  created_at: string
  updated_at: string
}

export type Issue = {
  id: string
  project_id: string
  title: string
  description: string | null
  raised_date: string
  status: string
  owner_stakeholder_id: string | null
  linked_risk_id: string | null
  created_at: string
  updated_at: string
}

export function useRiskData(projectId: string) {
  const [risks, setRisks] = useState<Risk[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRisksAndIssues = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const [risksRes, issuesRes, stakeholdersRes] = await Promise.all([
        supabase
          .from('risks')
          .select('*')
          .eq('project_id', projectId)
          .order('risk_score', { ascending: false }),
        supabase
          .from('issues')
          .select('*')
          .eq('project_id', projectId)
          .order('raised_date', { ascending: false }),
        supabase
          .from('stakeholders')
          .select('id, name, role_title')
          .eq('project_id', projectId)
          .order('name')
      ])

      if (risksRes.error) throw risksRes.error
      if (issuesRes.error) throw issuesRes.error
      if (stakeholdersRes.error) throw stakeholdersRes.error

      setRisks(risksRes.data || [])
      setIssues(issuesRes.data || [])
      setStakeholders(stakeholdersRes.data || [])
    } catch (err: any) {
      console.error('Error fetching risks and issues:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRisksAndIssues()
  }, [projectId])

  return { risks, issues, stakeholders, loading, error, refresh: fetchRisksAndIssues }
}
