import { useState, useEffect } from 'react'
import { getChangeRequests, createStandaloneChangeRequest, updateStandaloneChangeRequest, deleteStandaloneChangeRequest, ChangeRequestEntry } from '@/lib/documents/change-requests'

export function useChangeRequests(projectId: string) {
  const [logs, setLogs] = useState<ChangeRequestEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getChangeRequests(projectId)
      setLogs(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load change requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchLogs()
    }
  }, [projectId])

  const createLog = async (description: string, rationale: string) => {
    const res = await createStandaloneChangeRequest(projectId, description, rationale)
    if (!res.success) {
      throw new Error(res.error)
    }
    await fetchLogs()
  }

  const updateLogStatus = async (id: string, outcome: 'pending' | 'approved' | 'rejected' | 'withdrawn') => {
    // Optimistic update
    setLogs(currentLogs => 
      currentLogs.map(log => log.id === id ? { ...log, outcome } : log)
    )

    const res = await updateStandaloneChangeRequest(id, { outcome })
    if (!res.success) {
      // Revert if failed
      await fetchLogs()
      throw new Error(res.error)
    }
    // We don't need to fetch logs again since optimistic update worked,
    // but we can refresh in background to ensure sync.
    fetchLogs()
  }

  const deleteLog = async (id: string) => {
    // Optimistic update
    setLogs(currentLogs => currentLogs.filter(log => log.id !== id))
    
    const res = await deleteStandaloneChangeRequest(id)
    if (!res.success) {
      await fetchLogs()
      throw new Error(res.error)
    }
    fetchLogs()
  }

  return {
    logs,
    loading,
    error,
    createLog,
    updateLogStatus,
    deleteLog,
    refresh: fetchLogs
  }
}
