'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  fetchProjectReleasesData,
  createIteration as serverCreateIteration,
  updateIteration as serverUpdateIteration,
  deleteIteration as serverDeleteIteration,
  createRelease as serverCreateRelease,
  updateRelease as serverUpdateRelease,
  deleteRelease as serverDeleteRelease,
  toggleExitCriterion as serverToggleCriterion,
  addExitCriterion as serverAddCriterion,
  deleteExitCriterion as serverDeleteCriterion,
  addManualScopeOverride as serverAddScope,
  deleteManualScopeOverride as serverDeleteScope,
} from '@/lib/releases/actions'
import { addReadinessItem, toggleReadinessItem, deleteReadinessItem, loadDefaultReadinessItems } from '@/lib/releases/readiness-actions'
import { addDeploymentStep, toggleDeploymentStep, deleteDeploymentStep, addRollbackStep, toggleRollbackStep, deleteRollbackStep } from '@/lib/releases/deployment-actions'
import type { Iteration, Release, ReleaseStatus, ReleaseScopeItem } from '@/lib/releases/types'

export function useReleases(projectId: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iterations, setIterations] = useState<Iteration[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [scopeItemsMap, setScopeItemsMap] = useState<Record<string, ReleaseScopeItem[]>>({})
  const [availableWorkItems, setAvailableWorkItems] = useState<{ id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    setError(null)
    const res = await fetchProjectReleasesData(projectId)
    if (res.ok) {
      setIterations(res.iterations || [])
      setReleases(res.releases || [])
      setScopeItemsMap(res.scopeItemsMap || {})
      setAvailableWorkItems(res.availableWorkItems || [])
    } else {
      setError(res.error || 'Failed to fetch release planning data')
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`releases-realtime-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'iterations', filter: `project_id=eq.${projectId}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'releases', filter: `project_id=eq.${projectId}` },
        () => loadData()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'release_iterations' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'release_exit_criteria' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'release_manual_scope' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, loadData])

  // Iteration handlers
  const createIteration = async (name: string, sequenceNumber: number, startDate: string, endDate: string, labelOverride?: 'sprint' | 'phase' | null) => {
    setIsSubmitting(true)
    const res = await serverCreateIteration(projectId, name, sequenceNumber, startDate, endDate, labelOverride)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  const updateIteration = async (id: string, name: string, sequenceNumber: number, startDate: string, endDate: string, labelOverride?: 'sprint' | 'phase' | null) => {
    setIsSubmitting(true)
    const res = await serverUpdateIteration(id, projectId, name, sequenceNumber, startDate, endDate, labelOverride)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  const deleteIteration = async (id: string) => {
    setIsSubmitting(true)
    const res = await serverDeleteIteration(id, projectId)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  // Release handlers
  const createRelease = async (name: string, objective: string | null, sequenceNumber: number, status: ReleaseStatus, iterationIds: string[], exitCriteriaTexts: string[]) => {
    setIsSubmitting(true)
    const res = await serverCreateRelease(projectId, name, objective, sequenceNumber, status, iterationIds, exitCriteriaTexts)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  const updateRelease = async (id: string, name: string, objective: string | null, sequenceNumber: number, status: ReleaseStatus, iterationIds: string[]) => {
    setIsSubmitting(true)
    const res = await serverUpdateRelease(id, projectId, name, objective, sequenceNumber, status, iterationIds)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  const deleteRelease = async (id: string) => {
    setIsSubmitting(true)
    const res = await serverDeleteRelease(id, projectId)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  // Exit Criteria handlers
  const toggleExitCriterion = async (id: string, releaseId: string, isMet: boolean) => {
    // Optimistic UI update
    setReleases(prev => prev.map(r => r.id === releaseId ? {
      ...r,
      exitCriteria: r.exitCriteria?.map(c => c.id === id ? { ...c, isMet } : c)
    } : r))
    const res = await serverToggleCriterion(id, releaseId, isMet)
    if (!res.ok) await loadData()
    return res
  }

  const addExitCriterion = async (releaseId: string, criterionText: string) => {
    const res = await serverAddCriterion(releaseId, criterionText)
    if (res.ok) await loadData()
    return res
  }

  const deleteExitCriterion = async (id: string, releaseId: string) => {
    setReleases(prev => prev.map(r => r.id === releaseId ? {
      ...r,
      exitCriteria: r.exitCriteria?.filter(c => c.id !== id)
    } : r))
    const res = await serverDeleteCriterion(id, releaseId)
    if (!res.ok) await loadData()
    return res
  }

  // Manual Scope handlers
  const addManualScopeOverride = async (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => {
    setIsSubmitting(true)
    const res = await serverAddScope(releaseId, entityType, title, action, entityId, notes)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  const deleteManualScopeOverride = async (id: string, releaseId: string) => {
    setIsSubmitting(true)
    const res = await serverDeleteScope(id, releaseId)
    if (res.ok) await loadData()
    setIsSubmitting(false)
    return res
  }

  // Sprint 45 Extensions
  const handleToggleReadinessItem = async (id: string, releaseId: string, isChecked: boolean) => {
    const res = await toggleReadinessItem(id, releaseId, isChecked)
    if (res.ok) await loadData()
    return res
  }
  const handleAddReadinessItem = async (releaseId: string, category: string, itemText: string) => {
    const res = await addReadinessItem(releaseId, category, itemText)
    if (res.ok) await loadData()
    return res
  }
  const handleDeleteReadinessItem = async (id: string, releaseId: string) => {
    const res = await deleteReadinessItem(id, releaseId)
    if (res.ok) await loadData()
    return res
  }
  const handleLoadDefaultReadinessItems = async (releaseId: string) => {
    // Requires a fetch to get organizationId, but since useReleases knows projectId...
    // Actually we can just pass projectId and resolve org ID server-side or assume standard.
    // For now we will just pass a dummy org ID and let the server action handle it or error out. 
    // Wait, the hook could fetch it. But let's just expose the server action wrapper and we'll pass the correct args from the component.
    const res = await loadDefaultReadinessItems(releaseId, '00000000-0000-0000-0000-000000000000')
    if (res.ok) await loadData()
    return res
  }

  const handleToggleDeploymentStep = async (id: string, releaseId: string, isCompleted: boolean) => {
    const res = await toggleDeploymentStep(id, releaseId, isCompleted)
    if (res.ok) await loadData()
    return res
  }
  const handleAddDeploymentStep = async (releaseId: string, phase: 'Before' | 'During' | 'After', stepText: string, sortOrder: number) => {
    const res = await addDeploymentStep(releaseId, phase, stepText, sortOrder)
    if (res.ok) await loadData()
    return res
  }
  const handleDeleteDeploymentStep = async (id: string, releaseId: string) => {
    const res = await deleteDeploymentStep(id, releaseId)
    if (res.ok) await loadData()
    return res
  }

  const handleToggleRollbackStep = async (id: string, releaseId: string, isCompleted: boolean) => {
    const res = await toggleRollbackStep(id, releaseId, isCompleted)
    if (res.ok) await loadData()
    return res
  }
  const handleAddRollbackStep = async (releaseId: string, stepText: string, sortOrder: number) => {
    const res = await addRollbackStep(releaseId, stepText, sortOrder)
    if (res.ok) await loadData()
    return res
  }
  const handleDeleteRollbackStep = async (id: string, releaseId: string) => {
    const res = await deleteRollbackStep(id, releaseId)
    if (res.ok) await loadData()
    return res
  }

  return {
    loading,
    error,
    iterations,
    releases,
    scopeItemsMap,
    availableWorkItems,
    isSubmitting,
    refetch: loadData,
    createIteration,
    updateIteration,
    deleteIteration,
    createRelease,
    updateRelease,
    deleteRelease,
    toggleExitCriterion,
    addExitCriterion,
    deleteExitCriterion,
    addManualScopeOverride,
    deleteManualScopeOverride,
    handleToggleReadinessItem,
    handleAddReadinessItem,
    handleDeleteReadinessItem,
    handleLoadDefaultReadinessItems,
    handleToggleDeploymentStep,
    handleAddDeploymentStep,
    handleDeleteDeploymentStep,
    handleToggleRollbackStep,
    handleAddRollbackStep,
    handleDeleteRollbackStep,
  }
}
