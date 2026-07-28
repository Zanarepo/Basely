'use client'

import React from 'react'
import { useChangeManagementPlanData } from './hooks/useChangeManagementPlanData'
import { ChangeWorkflowDisplay } from './components/ChangeWorkflowDisplay'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

interface ChangeManagementPlanResolverProps {
  projectId: string
  sectionKey: string
  periodEnd?: Date
  frozenData?: any
}

export function ChangeManagementPlanResolver({
  projectId,
  periodEnd,
  frozenData
}: ChangeManagementPlanResolverProps) {
  const {
    approvalThresholds,
    escalationProcess,
    rolesDescription,
    isEnterpriseTier,
    approvalPolicies,
    loading,
    saving,
    error,
    savePlan,
    refetch
  } = useChangeManagementPlanData(projectId, periodEnd, frozenData)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-800/20 border border-slate-700/40 rounded-xl">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span>Verifying organizational change governance rules & tiers...</span>
        </div>
      </div>
    )
  }

  if (error && !approvalThresholds) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center text-rose-300">
        <AlertTriangle className="w-6 h-6 mx-auto text-rose-400 mb-2" />
        <p className="font-semibold">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Loading Governance
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ChangeWorkflowDisplay
        approvalThresholds={approvalThresholds}
        escalationProcess={escalationProcess}
        rolesDescription={rolesDescription}
        isEnterpriseTier={isEnterpriseTier}
        approvalPolicies={approvalPolicies}
        saving={saving}
        onSave={savePlan}
      />
    </div>
  )
}
