import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface ApprovalPolicy {
  id?: string
  organization_id: string
  action_type: 'budget_baseline' | 'schedule_baseline'
  approver_definition: string
  enabled: boolean
}

export function useApprovalPolicies(organizationId: string) {
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchPolicies = useCallback(async () => {
    if (!organizationId) return

    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('approval_policies')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching approval policies:', error)
        return
      }

      setPolicies(data || [])
    } catch (err) {
      console.error('Error in fetchPolicies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const togglePolicy = async (actionType: 'budget_baseline' | 'schedule_baseline', enabled: boolean) => {
    if (!organizationId) return { success: false, error: 'Organization ID missing' }

    try {
      setIsSaving(true)
      const supabase = createClient()

      const existing = policies.find((p) => p.action_type === actionType)

      let response
      if (existing?.id) {
        response = await supabase
          .from('approval_policies')
          .update({ enabled })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        response = await supabase
          .from('approval_policies')
          .insert({
            organization_id: organizationId,
            action_type: actionType,
            enabled,
            approver_definition: 'Role:Admin',
          })
          .select()
          .single()
      }

      if (response.error) {
        console.error('Error saving policy:', response.error)
        return { success: false, error: 'Failed to update policy' }
      }

      setPolicies((prev) => {
        const filtered = prev.filter((p) => p.action_type !== actionType)
        return [...filtered, response.data]
      })

      return { success: true, error: null }
    } catch (err) {
      console.error('Error in togglePolicy:', err)
      return { success: false, error: 'An unexpected error occurred while saving' }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  return {
    policies,
    isLoading,
    isSaving,
    togglePolicy,
    refresh: fetchPolicies
  }
}
