'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DiscoveryInsight } from '@/lib/product-strategy/types'
import {
  getDiscoveryInsights,
  createDiscoveryInsight,
  updateDiscoveryInsight,
  deleteDiscoveryInsight,
  convertInsightToChangeRequest
} from '@/lib/product-discovery/actions'

const MIN_LOADING_MS = 3000

function enforceMinLoading(startTime: number): Promise<void> {
  const elapsed = Date.now() - startTime
  const remaining = MIN_LOADING_MS - elapsed
  return remaining > 0 ? new Promise(r => setTimeout(r, remaining)) : Promise.resolve()
}

export function useDiscoveryInsights(organizationId: string, projectId?: string) {
  const [insights, setInsights] = useState<DiscoveryInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    if (!organizationId) return
    const start = Date.now()
    setLoading(true)
    setError(null)
    try {
      const data = await getDiscoveryInsights(organizationId, projectId)
      await enforceMinLoading(start)
      setInsights(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights')
    } finally {
      setLoading(false)
    }
  }, [organizationId, projectId])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const addInsight = useCallback(async (payload: Partial<DiscoveryInsight>) => {
    setSaving(true)
    setError(null)
    const start = Date.now()
    try {
      const result = await createDiscoveryInsight(payload)
      await enforceMinLoading(start)
      if (result.ok && result.data) {
        setInsights(prev => [result.data!, ...prev])
      }
      return result
    } catch (err: any) {
      setError(err.message)
      return { ok: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [])

  const editInsight = useCallback(async (id: string, payload: Partial<DiscoveryInsight>) => {
    setSaving(true)
    setError(null)
    const start = Date.now()
    try {
      const result = await updateDiscoveryInsight(id, payload)
      await enforceMinLoading(start)
      if (result.ok && result.data) {
        setInsights(prev => prev.map(i => i.id === id ? result.data! : i))
      }
      return result
    } catch (err: any) {
      setError(err.message)
      return { ok: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [])

  const removeInsight = useCallback(async (id: string) => {
    setSaving(true)
    setError(null)
    const start = Date.now()
    try {
      const result = await deleteDiscoveryInsight(id, projectId)
      await enforceMinLoading(start)
      if (result.ok) {
        setInsights(prev => prev.filter(i => i.id !== id))
      }
      return result
    } catch (err: any) {
      setError(err.message)
      return { ok: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [projectId])

  const convertToChangeRequest = useCallback(async (insightId: string) => {
    if (!projectId || !organizationId) return { ok: false, error: 'Missing project context' }
    setSaving(true)
    setError(null)
    const start = Date.now()
    try {
      const result = await convertInsightToChangeRequest(insightId, projectId, organizationId)
      await enforceMinLoading(start)
      if (result.ok) {
        setInsights(prev => prev.map(i => i.id === insightId ? { ...i, status: 'converted' as const } : i))
      }
      return result
    } catch (err: any) {
      setError(err.message)
      return { ok: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [projectId, organizationId])

  return {
    insights,
    loading,
    saving,
    error,
    fetchInsights,
    addInsight,
    editInsight,
    removeInsight,
    convertToChangeRequest
  }
}
