import { useState, useCallback } from 'react'
import { tagWorkItemToIteration, tagEpicToIteration } from '@/lib/releases/actions'

export interface UseEpicIterationTaggingProps {
  projectId: string
  onSuccess?: () => void
}

export function useEpicIterationTagging({ projectId, onSuccess }: UseEpicIterationTaggingProps) {
  const [isTagging, setIsTagging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tagStory = useCallback(
    async (entityType: 'wbs_element' | 'activity', entityId: string, iterationId: string | null) => {
      setIsTagging(true)
      setError(null)
      try {
        const res = await tagWorkItemToIteration(entityType, entityId, iterationId, projectId)
        if (!res.ok) {
          setError(res.error || 'Failed to tag work item')
          return false
        }
        onSuccess?.()
        return true
      } catch (err: any) {
        setError(err.message || 'An error occurred during tagging')
        return false
      } finally {
        setIsTagging(false)
      }
    },
    [projectId, onSuccess]
  )

  const tagEpic = useCallback(
    async (epicId: string, iterationId: string | null) => {
      setIsTagging(true)
      setError(null)
      try {
        const res = await tagEpicToIteration(epicId, iterationId, projectId)
        if (!res.ok) {
          setError(res.error || 'Failed to tag epic and child items')
          return false
        }
        onSuccess?.()
        return true
      } catch (err: any) {
        setError(err.message || 'An error occurred during epic tagging')
        return false
      } finally {
        setIsTagging(false)
      }
    },
    [projectId, onSuccess]
  )

  return {
    tagStory,
    tagEpic,
    isTagging,
    error,
  }
}
