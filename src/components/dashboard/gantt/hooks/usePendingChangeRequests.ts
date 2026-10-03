'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface PendingCR {
  id: string
  description: string
  rationale: string | null
  outcome: string
  created_at: string
}

export function usePendingChangeRequests(projectId: string) {
  const [pendingCRs, setPendingCRs] = useState<PendingCR[]>([])
  const [approvedCRs, setApprovedCRs] = useState<PendingCR[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const fetchCRs = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const { data } = await supabase
        .from('change_request_log_entries')
        .select('id, description, rationale, outcome, created_at')
        .eq('project_id', projectId)
        .in('outcome', ['pending', 'approved'])
        .order('created_at', { ascending: false })

      if (data) {
        setPendingCRs(data.filter((cr) => cr.outcome === 'pending'))
        setApprovedCRs(data.filter((cr) => cr.outcome === 'approved'))
      }
      setIsLoading(false)
    }

    fetchCRs()
  }, [projectId])

  return { pendingCRs, approvedCRs, count: pendingCRs.length, isLoading }
}
