import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ActivityEntityType, ActivityActionType } from '@/lib/projects/activity-actions'

export type ProjectActivityLog = {
  id: string
  project_id: string
  actor_user_id: string
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityActionType
  detail: any
  created_at: string
  profiles?: {
    full_name: string | null
    email: string
  }
}

export function useProjectActivity(
  projectId: string, 
  options: {
    page?: number
    pageSize?: number
    searchQuery?: string
    entityFilter?: ActivityEntityType | 'all'
    actionFilter?: ActivityActionType | 'all'
  } = {}
) {
  const {
    page = 1,
    pageSize = 20,
    searchQuery = '',
    entityFilter = 'all',
    actionFilter = 'all'
  } = options

  const [logs, setLogs] = useState<ProjectActivityLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('project_activity_logs')
        .select(`
          *,
          profiles:actor_user_id(full_name, email)
        `, { count: 'exact' })
        .eq('project_id', projectId)

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter)
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      if (searchQuery.trim() !== '') {
        // Search by detail->>name, detail->>title, or entity_id using .or()
        const term = `%${searchQuery.trim()}%`
        query = query.or(`entity_id.ilike.${term},detail->>name.ilike.${term},detail->>title.ilike.${term}`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setLogs(data as any as ProjectActivityLog[])
      if (count !== null) {
        setTotalCount(count)
      }
    } catch (err: any) {
      console.error('Failed to fetch project activity logs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, page, pageSize, searchQuery, entityFilter, actionFilter])

  useEffect(() => {
    fetchLogs()

    // Optionally set up real-time subscription here
    // Note: real-time works best for the first page without filters. 
    const supabase = createClient()
    const channel = supabase.channel(`activity_${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_activity_logs', filter: `project_id=eq.${projectId}` },
        () => {
          // Only auto-refresh if on the first page to avoid jumping
          if (page === 1) {
            fetchLogs()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLogs, projectId, page])

  return { 
    logs, 
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    loading, 
    error, 
    refresh: fetchLogs 
  }
}
