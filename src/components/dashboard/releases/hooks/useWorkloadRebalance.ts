import { useState } from 'react'
import { generateRebalanceSuggestions, applyRebalanceSuggestion } from '@/lib/schedule/rebalance-actions'
import type { ReassignmentOption, RebalanceSuggestionResult } from '@/lib/schedule/rebalance-types'

export function useWorkloadRebalance(projectId: string, organizationId: string, iterationId: string) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [suggestions, setSuggestions] = useState<ReassignmentOption[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeWorkload = async () => {
    setIsAnalyzing(true)
    setError(null)
    setSuggestions([])
    setMessage(null)

    try {
      const res = await generateRebalanceSuggestions(projectId, organizationId, iterationId)
      if (res.ok && res.data) {
        setSuggestions(res.data.suggestions || [])
        setMessage(res.data.message || null)
      } else {
        setError(res.error || 'Failed to analyze workload')
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const acceptSuggestion = async (suggestion: ReassignmentOption) => {
    setIsApplying(true)
    setError(null)
    try {
      const res = await applyRebalanceSuggestion(suggestion.wbsElementId, suggestion.suggestedStakeholderId, projectId)
      if (res.ok) {
        // Remove from suggestions array
        setSuggestions(prev => prev.filter(s => s.wbsElementId !== suggestion.wbsElementId))
      } else {
        setError(res.error || 'Failed to apply rebalance suggestion')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to apply rebalance suggestion')
    } finally {
      setIsApplying(false)
    }
  }

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.wbsElementId !== suggestionId))
  }

  const clearSuggestions = () => {
    setSuggestions([])
    setMessage(null)
  }

  return {
    isAnalyzing,
    isApplying,
    suggestions,
    message,
    error,
    analyzeWorkload,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions
  }
}
