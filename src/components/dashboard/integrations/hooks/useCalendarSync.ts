import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export type CalendarConnection = {
  id: string
  provider: string
  synced_project_ids: string[]
  created_at: string
}

export function useCalendarSync() {
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const loadConnections = useCallback(async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('calendar_connections')
      .select('id, provider, synced_project_ids, created_at')
      .eq('user_id', user.id)

    if (data) {
      setConnections(data)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const toggleProjectSync = async (connectionId: string, projectId: string, sync: boolean) => {
    setIsSaving(true)
    const connection = connections.find(c => c.id === connectionId)
    if (!connection) return

    let updatedProjects = [...(connection.synced_project_ids || [])]
    
    if (sync) {
      if (!updatedProjects.includes(projectId)) updatedProjects.push(projectId)
    } else {
      updatedProjects = updatedProjects.filter(id => id !== projectId)
    }

    const { error } = await supabase
      .from('calendar_connections')
      .update({ synced_project_ids: updatedProjects })
      .eq('id', connectionId)

    if (!error) {
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, synced_project_ids: updatedProjects } : c
      ))
    } else {
      console.error('Failed to update sync preferences:', error)
    }
    
    setIsSaving(false)
  }

  const disconnectCalendar = async (connectionId: string) => {
    setIsSaving(true)
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', connectionId)

    if (!error) {
      setConnections(prev => prev.filter(c => c.id !== connectionId))
    } else {
      console.error('Failed to disconnect calendar:', error)
    }
    setIsSaving(false)
  }

  return {
    connections,
    isLoading,
    isSaving,
    toggleProjectSync,
    disconnectCalendar,
    refresh: loadConnections
  }
}
