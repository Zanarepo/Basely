import { useState, useEffect, useCallback } from 'react'
import { 
  getCommunicationPlanEntries, 
  upsertCommunicationPlanEntry, 
  deleteCommunicationPlanEntry,
  autoPopulateCommunicationPlan,
  CommunicationPlanEntry 
} from '@/lib/planning/actions'
import { getAvailableDocumentTypes } from '@/lib/documents/actions'

export function useCommunicationPlan(projectId: string) {
  const [entries, setEntries] = useState<CommunicationPlanEntry[]>([])
  const [availableDocs, setAvailableDocs] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [entriesResult, docsResult] = await Promise.all([
        getCommunicationPlanEntries(projectId),
        getAvailableDocumentTypes()
      ])

      if (entriesResult.error) {
        setError(entriesResult.error)
      } else {
        setEntries(entriesResult.data || [])
      }

      if (docsResult && Array.isArray(docsResult)) {
        setAvailableDocs(docsResult.map(t => ({ id: t.id, name: t.name })))
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveEntry = async (data: Partial<CommunicationPlanEntry>) => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await upsertCommunicationPlanEntry(projectId, data)
      if (result.error) {
        setError(result.error)
        return false
      }
      if (result.data) {
        setEntries(prev => {
          const exists = prev.findIndex(e => e.id === result.data.id)
          if (exists >= 0) {
            const next = [...prev]
            next[exists] = result.data
            return next
          }
          return [...prev, result.data]
        })
      }
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await deleteCommunicationPlanEntry(id)
      if (result.error) {
        setError(result.error)
        return false
      }
      setEntries(prev => prev.filter(e => e.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const prepopulate = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await autoPopulateCommunicationPlan(projectId)
      if (result.error) {
        setError(result.error)
        return false
      }
      await loadData()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    entries,
    availableDocs,
    isLoading,
    isSaving,
    error,
    saveEntry,
    deleteEntry,
    prepopulate,
    reload: loadData,
  }
}
