'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  updateProjectLifecycleStatus, 
  getProjectLifecycleHistory,
} from '@/lib/projects/lifecycle-actions'
import type { ProjectLifecycleStatus, LifecycleTransitionLog } from '@/lib/projects/lifecycle-types'
import { isValidStandardTransition } from '@/lib/projects/lifecycle-types'

export interface UseProjectLifecycleReturn {
  currentStatus: ProjectLifecycleStatus
  history: LifecycleTransitionLog[]
  loadingHistory: boolean
  isTransitioning: boolean
  error: string | null
  setError: (err: string | null) => void
  refreshHistory: () => Promise<void>
  transitionStage: (newStatus: ProjectLifecycleStatus, reason?: string, isOverride?: boolean) => Promise<boolean>
  checkRequiresReason: (newStatus: ProjectLifecycleStatus) => boolean
}

export function useProjectLifecycle(
  projectId: string, 
  initialStatus: ProjectLifecycleStatus = 'Executing',
  onStatusChange?: (newStatus: ProjectLifecycleStatus) => void
): UseProjectLifecycleReturn {
  const [currentStatus, setCurrentStatus] = useState<ProjectLifecycleStatus>(initialStatus)
  const [history, setHistory] = useState<LifecycleTransitionLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentStatus(initialStatus)
  }, [initialStatus])

  const refreshHistory = useCallback(async () => {
    if (!projectId) return
    setLoadingHistory(true)
    try {
      const logs = await getProjectLifecycleHistory(projectId)
      setHistory(logs)
    } catch (err: any) {
      console.error('Failed to load lifecycle history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [projectId])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  const checkRequiresReason = useCallback((newStatus: ProjectLifecycleStatus): boolean => {
    const isStandard = isValidStandardTransition(currentStatus, newStatus)
    const isTerminal = newStatus === 'Closing' || newStatus === 'Closed'
    return !isStandard || isTerminal
  }, [currentStatus])

  const transitionStage = useCallback(async (
    newStatus: ProjectLifecycleStatus, 
    reason?: string, 
    isOverride: boolean = false
  ): Promise<boolean> => {
    setIsTransitioning(true)
    setError(null)

    try {
      const res = await updateProjectLifecycleStatus(projectId, newStatus, reason, isOverride)
      if (!res.ok) {
        setError(res.error || 'Failed to update lifecycle stage.')
        return false
      }
      setCurrentStatus(newStatus)
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      await refreshHistory()
      return true
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during phase transition.')
      return false
    } finally {
      setIsTransitioning(false)
    }
  }, [projectId, onStatusChange, refreshHistory])

  return {
    currentStatus,
    history,
    loadingHistory,
    isTransitioning,
    error,
    setError,
    refreshHistory,
    transitionStage,
    checkRequiresReason
  }
}
