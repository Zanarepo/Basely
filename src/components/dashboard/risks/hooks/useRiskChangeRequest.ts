import { useState } from 'react'
import { escalateRiskToChangeRequest } from '@/lib/documents/change-request-actions'

export function useRiskChangeRequest(projectId: string, onShowToast?: (type: 'success' | 'error', msg: string) => void) {
  const [isEscalating, setIsEscalating] = useState(false)

  const escalateRisk = async (riskId: string, riskTitle: string, riskMitigation: string) => {
    setIsEscalating(true)
    try {
      const res = await escalateRiskToChangeRequest(projectId, riskId, riskTitle, riskMitigation)
      if (res.success) {
        onShowToast?.('success', 'Risk successfully escalated to Change Request.')
      } else {
        onShowToast?.('error', res.error || 'Failed to escalate risk to Change Request.')
      }
      return res
    } catch (err: any) {
      onShowToast?.('error', err.message || 'An unexpected error occurred.')
      return { success: false, error: err.message }
    } finally {
      setIsEscalating(false)
    }
  }

  return {
    escalateRisk,
    isEscalating
  }
}
