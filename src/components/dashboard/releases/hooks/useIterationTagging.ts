'use client'

import { useState, useCallback, useEffect } from 'react'
import { tagWorkItemToIteration as serverTagWorkItem } from '@/lib/releases/actions'
import { createClient } from '@/utils/supabase/client'
import type { Iteration } from '@/lib/releases/types'

export function useIterationTagging(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [iterations, setIterations] = useState<Iteration[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchIterations = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('iterations')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true })

      if (err) {
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          setIterations([])
          return
        }
        setError(err.message)
      } else if (data) {
        setIterations(data.map(i => ({
          id: i.id,
          projectId: i.project_id,
          name: i.name,
          sequenceNumber: i.sequence_number,
          startDate: i.start_date,
          endDate: i.end_date,
          labelOverride: i.label_override || null,
          createdAt: i.created_at,
          updatedAt: i.updated_at
        })))
      }
    } catch (e: any) {
      console.error('fetchIterations error:', e)
    }
  }, [projectId])

  useEffect(() => {
    fetchIterations()
  }, [fetchIterations])

  const tagWorkItem = async (
    entityType: 'wbs_element' | 'activity',
    entityId: string,
    iterationId: string | null
  ) => {
    setLoading(true)
    setError(null)
    const res = await serverTagWorkItem(entityType, entityId, iterationId, projectId)
    if (!res.ok) {
      setError(res.error || 'Failed to tag item')
    }
    setLoading(false)
    return res
  }

  return {
    iterations,
    loading,
    error,
    tagWorkItem,
    refetchIterations: fetchIterations
  }
}
