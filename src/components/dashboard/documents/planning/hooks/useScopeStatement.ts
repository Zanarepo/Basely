import { useState, useEffect, useCallback } from 'react'
import { getScopeStatement, upsertScopeStatement, ScopeStatement } from '@/lib/planning/actions'

export function useScopeStatement(projectId: string) {
  const [data, setData] = useState<ScopeStatement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getScopeStatement(projectId)
      if (result.error) {
        setError(result.error)
      } else {
        setData(result.data)
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

  const saveData = async (updates: Partial<ScopeStatement>) => {
    setIsSaving(true)
    setError(null)
    try {
      const result = await upsertScopeStatement(projectId, updates)
      if (result.error) {
        setError(result.error)
        return false
      }
      setData(result.data)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    data,
    isLoading,
    isSaving,
    error,
    saveData,
    reload: loadData,
  }
}
