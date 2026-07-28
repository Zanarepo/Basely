'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface ApprovalPolicyRule {
  id: string
  policy_name?: string
  entity_type: string
  require_manager_approval: boolean
  require_sponsor_approval?: boolean
  threshold_amount?: number
  enabled: boolean
}

export interface ChangeManagementPlanData {
  approvalThresholds: string
  escalationProcess: string
  rolesDescription: string
  isEnterpriseTier: boolean
  approvalPolicies: ApprovalPolicyRule[]
  loading: boolean
  saving: boolean
  error?: string
  savePlan: (thresholds: string, escalation: string, roles: string) => Promise<boolean>
  refetch: () => Promise<void>
}

const DEFAULT_THRESHOLDS = 'Scope changes over $5,000 or schedule delays over 3 business days require Executive Sponsor sign-off. Changes within baseline tolerances may be approved directly by the Project Manager.'
const DEFAULT_ESCALATION = '1. Initial Technical Review by Project Manager within 48 hours.\n2. Escalation to Change Control Board (CCB) for items exceeding cost/schedule tolerance.\n3. Final strategic resolution by Executive Sponsor within 5 business days.'
const DEFAULT_ROLES = '• Project Manager: Evaluates technical feasibility, WBS impacts, and schedule float.\n• Change Control Board (CCB): Formal governance body reviewing baseline variances.\n• Executive Sponsor: Authorizes management reserves and project charter scope adjustments.'

export function useChangeManagementPlanData(projectId: string, periodEnd?: Date, frozenData?: any): ChangeManagementPlanData {
  const [loading, setLoading] = useState(!frozenData)
  const [saving, setSaving] = useState(false)
  const [approvalThresholds, setApprovalThresholds] = useState<string>(frozenData?.approvalThresholds || DEFAULT_THRESHOLDS)
  const [escalationProcess, setEscalationProcess] = useState<string>(frozenData?.escalationProcess || DEFAULT_ESCALATION)
  const [rolesDescription, setRolesDescription] = useState<string>(frozenData?.rolesDescription || DEFAULT_ROLES)
  const [isEnterpriseTier, setIsEnterpriseTier] = useState<boolean>(frozenData?.isEnterpriseTier || false)
  const [approvalPolicies, setApprovalPolicies] = useState<ApprovalPolicyRule[]>(frozenData?.approvalPolicies || [])
  const [error, setError] = useState<string>()

  const loadData = useCallback(async () => {
    if (frozenData) {
      setApprovalThresholds(frozenData.approvalThresholds || DEFAULT_THRESHOLDS)
      setEscalationProcess(frozenData.escalationProcess || DEFAULT_ESCALATION)
      setRolesDescription(frozenData.rolesDescription || DEFAULT_ROLES)
      setIsEnterpriseTier(frozenData.isEnterpriseTier || false)
      setApprovalPolicies(frozenData.approvalPolicies || [])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // 1. Fetch organization ID to check enterprise policies
      const { data: projectData } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .maybeSingle()

      const orgId = projectData?.organization_id

      let policies: ApprovalPolicyRule[] = []
      let enterpriseActive = false

      if (orgId) {
        const { data: policyData } = await supabase
          .from('approval_policies')
          .select('*')
          .eq('organization_id', orgId)
          .eq('enabled', true)

        if (policyData && policyData.length > 0) {
          policies = policyData.map(p => ({
            id: p.id,
            policy_name: p.policy_name || p.entity_type || 'Governance Rule',
            entity_type: p.entity_type || 'change_request',
            require_manager_approval: Boolean(p.require_manager_approval),
            require_sponsor_approval: Boolean(p.require_sponsor_approval),
            threshold_amount: p.threshold_amount ? Number(p.threshold_amount) : undefined,
            enabled: p.enabled
          }))
          enterpriseActive = true
        }
      }

      setIsEnterpriseTier(enterpriseActive)
      setApprovalPolicies(policies)

      // 2. Fetch saved change management plan for this project
      const { data: planData, error: planError } = await supabase
        .from('change_management_plans')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()

      if (!planError && planData) {
        setApprovalThresholds(planData.approval_thresholds || DEFAULT_THRESHOLDS)
        setEscalationProcess(planData.escalation_process || DEFAULT_ESCALATION)
        setRolesDescription(planData.roles_description || DEFAULT_ROLES)
      } else {
        setApprovalThresholds(DEFAULT_THRESHOLDS)
        setEscalationProcess(DEFAULT_ESCALATION)
        setRolesDescription(DEFAULT_ROLES)
      }
    } catch (err: any) {
      console.error('Error in useChangeManagementPlanData:', err)
      setError('Failed to load change management governance data.')
    } finally {
      setLoading(false)
    }
  }, [projectId, frozenData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const savePlan = async (thresholds: string, escalation: string, roles: string): Promise<boolean> => {
    setSaving(true)
    setError(undefined)
    try {
      const supabase = createClient()
      const { error: upsertErr } = await supabase
        .from('change_management_plans')
        .upsert({
          project_id: projectId,
          approval_thresholds: thresholds,
          escalation_process: escalation,
          roles_description: roles,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' })

      if (upsertErr) throw upsertErr

      setApprovalThresholds(thresholds)
      setEscalationProcess(escalation)
      setRolesDescription(roles)
      return true
    } catch (err: any) {
      console.error('Failed to save change management plan:', err)
      setError('Could not save change management plan updates.')
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    approvalThresholds,
    escalationProcess,
    rolesDescription,
    isEnterpriseTier,
    approvalPolicies,
    loading,
    saving,
    error,
    savePlan,
    refetch: loadData
  }
}
