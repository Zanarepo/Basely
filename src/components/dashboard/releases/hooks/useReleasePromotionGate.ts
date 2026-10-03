import { useState } from 'react'
import { promoteRelease } from '@/lib/releases/gate-actions'

interface UseReleasePromotionGateProps {
  releaseId: string
  projectId: string
  unmetCriteriaCount: number
  onSuccess: () => void
}

export function useReleasePromotionGate({
  releaseId,
  projectId,
  unmetCriteriaCount,
  onSuccess
}: UseReleasePromotionGateProps) {
  const [rationale, setRationale] = useState('')
  const [targetStatus, setTargetStatus] = useState<'in_progress' | 'released'>('in_progress')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvalRequested, setApprovalRequested] = useState(false)

  const isBlocked = targetStatus === 'released' && unmetCriteriaCount > 0

  const handlePromote = async () => {
    if (isBlocked) return
    if (!rationale.trim()) {
      setError('A rationale is required for release promotion.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await promoteRelease(releaseId, projectId, targetStatus, rationale)
    if (!res.ok) {
      setError(res.error || 'Failed to promote release.')
      setLoading(false)
    } else {
      setApprovalRequested(res.approvalRequested || false)
      setLoading(false)
      if (!res.approvalRequested) {
        onSuccess()
      }
    }
  }

  return {
    rationale,
    setRationale,
    targetStatus,
    setTargetStatus,
    loading,
    error,
    approvalRequested,
    setApprovalRequested,
    isBlocked,
    handlePromote
  }
}
