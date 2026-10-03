import { useState, useEffect, useMemo } from 'react'
import type { Release, ReleaseScopeItem } from '@/lib/releases/types'
import { getDualLabels } from '@/lib/releases/epic-link-constants'
import { generateAiReleaseNotesAndChecklist } from '@/lib/releases/ai-actions'

export const isStatusCompleted = (status?: string | null): boolean => {
  if (!status) return false
  const s = status.trim().toLowerCase()
  return s === 'complete' || s === 'completed' || s === 'done' || s === 'closed' || s === 'finished'
}

export const isStatusInProgress = (status?: string | null): boolean => {
  if (!status) return false
  const s = status.trim().toLowerCase()
  return s === 'in progress' || s === 'in_progress' || s === 'active' || s === 'doing' || s === 'started'
}

export const isStatusBlocked = (status?: string | null): boolean => {
  if (!status) return false
  const s = status.trim().toLowerCase()
  return s === 'blocked' || s === 'on hold' || s === 'on_hold'
}

export function useSimplifiedReleasePipeline({
  release,
  projectId,
  methodology = 'Agile',
  scopeItems,
  onToggleCriterion,
  onAddCriterion,
  onDeleteCriterion,
  onToggleReadinessItem,
  onAddReadinessItem,
  onDeleteReadinessItem,
}: {
  release: Release
  projectId: string
  methodology?: string | null
  scopeItems: ReleaseScopeItem[]
  onToggleCriterion: (id: string, releaseId: string, isMet: boolean) => Promise<any>
  onAddCriterion: (releaseId: string, criterionText: string) => Promise<any>
  onDeleteCriterion: (id: string, releaseId: string) => Promise<any>
  onToggleReadinessItem: (id: string, releaseId: string, isChecked: boolean) => Promise<any>
  onAddReadinessItem: (releaseId: string, category: string, itemText: string) => Promise<any>
  onDeleteReadinessItem: (id: string, releaseId: string) => Promise<any>
}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [newCriterion, setNewCriterion] = useState('')
  const [newReadiness, setNewReadiness] = useState('')
  const [addingCriterion, setAddingCriterion] = useState(false)
  const [addingReadiness, setAddingReadiness] = useState(false)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState<string | null>(release.releaseNotes || null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [localExitCriteria, setLocalExitCriteria] = useState(release.exitCriteria || [])
  const [localReadinessItems, setLocalReadinessItems] = useState(release.readinessItems || [])

  useEffect(() => {
    setLocalExitCriteria(release.exitCriteria || [])
  }, [release.exitCriteria])

  useEffect(() => {
    setLocalReadinessItems(release.readinessItems || [])
  }, [release.readinessItems])

  useEffect(() => {
    if (release.releaseNotes) {
      setReleaseNotes(release.releaseNotes)
    }
  }, [release.releaseNotes])

  const labels = getDualLabels(methodology)

  const activeScopeItems = scopeItems.filter((i) => i.source !== 'excluded')

  const completedScopeCount = activeScopeItems.filter((i) => isStatusCompleted(i.status)).length
  const inProgressScopeCount = activeScopeItems.filter((i) => isStatusInProgress(i.status)).length
  const notStartedScopeCount = activeScopeItems.length - completedScopeCount - inProgressScopeCount

  const scopeCompletionPercent =
    activeScopeItems.length > 0 ? Math.round((completedScopeCount / activeScopeItems.length) * 100) : 0

  const scopeByEpic = useMemo(() => {
    const map = new Map<string, { epicName: string; items: ReleaseScopeItem[] }>()
    activeScopeItems.forEach((item) => {
      const epicKey = item.parentEpicId || 'general'
      const epicName = item.parentEpicName || `General / Unassigned ${labels.epicsTerm}`
      if (!map.has(epicKey)) {
        map.set(epicKey, { epicName, items: [] })
      }
      map.get(epicKey)!.items.push(item)
    })
    return Array.from(map.entries())
  }, [activeScopeItems, labels])

  const totalQualityChecks = localExitCriteria.length + localReadinessItems.length
  const completedQualityChecks =
    localExitCriteria.filter((c) => c.isMet).length + localReadinessItems.filter((r) => r.isChecked).length
  const readinessPercent =
    totalQualityChecks > 0 ? Math.round((completedQualityChecks / totalQualityChecks) * 100) : 100

  const isPublishEligible = scopeCompletionPercent >= 90

  const handleToggleCriterionOptimistic = async (id: string, isMet: boolean) => {
    setLocalExitCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, isMet } : c)))
    await onToggleCriterion(id, release.id, isMet)
  }

  const handleDeleteCriterionOptimistic = async (id: string) => {
    setLocalExitCriteria((prev) => prev.filter((c) => c.id !== id))
    await onDeleteCriterion(id, release.id)
  }

  const handleToggleReadinessOptimistic = async (id: string, isChecked: boolean) => {
    setLocalReadinessItems((prev) => prev.map((r) => (r.id === id ? { ...r, isChecked } : r)))
    await onToggleReadinessItem(id, release.id, isChecked)
  }

  const handleDeleteReadinessOptimistic = async (id: string) => {
    setLocalReadinessItems((prev) => prev.filter((r) => r.id !== id))
    await onDeleteReadinessItem(id, release.id)
  }

  const handleAddExitCriterionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newCriterion.trim()
    if (!text || addingCriterion) return

    setAddingCriterion(true)
    try {
      const res = await onAddCriterion(release.id, text)
      if (res.ok) {
        setNewCriterion('')
      }
    } finally {
      setAddingCriterion(false)
    }
  }

  const handleAddReadinessItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newReadiness.trim()
    if (!text || addingReadiness) return

    setAddingReadiness(true)
    try {
      const res = await onAddReadinessItem(release.id, 'General Quality', text)
      if (res.ok) {
        setNewReadiness('')
      }
    } finally {
      setAddingReadiness(false)
    }
  }

  const handleGenerateNotes = async () => {
    if (!isPublishEligible) return
    setGeneratingNotes(true)
    setError(null)
    try {
      const res = await generateAiReleaseNotesAndChecklist(release.id, projectId, methodology || 'Agile')
      if (res.ok && res.releaseNotesHtml) {
        setReleaseNotes(res.releaseNotesHtml)
      } else {
        setError(res.error || 'Failed to generate release notes')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setGeneratingNotes(false)
    }
  }

  const handleCopyNotes = () => {
    if (releaseNotes) {
      navigator.clipboard.writeText(releaseNotes)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return {
    currentStep, setCurrentStep,
    newCriterion, setNewCriterion,
    newReadiness, setNewReadiness,
    addingCriterion,
    addingReadiness,
    generatingNotes,
    releaseNotes,
    copied,
    error,
    localExitCriteria,
    localReadinessItems,
    labels,
    activeScopeItems,
    completedScopeCount,
    inProgressScopeCount,
    notStartedScopeCount,
    scopeCompletionPercent,
    scopeByEpic,
    totalQualityChecks,
    completedQualityChecks,
    readinessPercent,
    isPublishEligible,
    handleToggleCriterionOptimistic,
    handleDeleteCriterionOptimistic,
    handleToggleReadinessOptimistic,
    handleDeleteReadinessOptimistic,
    handleAddExitCriterionSubmit,
    handleAddReadinessItemSubmit,
    handleGenerateNotes,
    handleCopyNotes
  }
}
