'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2, ShieldAlert } from 'lucide-react'
import { useApprovalPolicies } from './hooks/useApprovalPolicies'
import type { WorkspaceMember } from '@/components/dashboard/WorkspaceMembersPanel'
import { CollapsibleSection } from './CollapsibleSection'

interface ApprovalPoliciesPanelProps {
  organizationId: string
  members: WorkspaceMember[]
  isAdmin: boolean
}

export function ApprovalPoliciesPanel({ organizationId, members, isAdmin }: ApprovalPoliciesPanelProps) {
  const { policies, isLoading, isSaving, togglePolicy } = useApprovalPolicies(organizationId)
  const [isOpen, setIsOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isAdmin) {
    return null
  }

  const budgetPolicy = policies.find(p => p.action_type === 'budget_baseline')
  const schedulePolicy = policies.find(p => p.action_type === 'schedule_baseline')

  const handleToggle = async (actionType: 'budget_baseline' | 'schedule_baseline', enabled: boolean) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    
    const { success, error } = await togglePolicy(actionType, enabled)
    
    if (success) {
      setSuccessMsg(`Approval requirement ${enabled ? 'enabled' : 'disabled'} for ${actionType.replace('_', ' ')}.`)
    } else if (error) {
      setErrorMsg(error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Approval Workflows"
        subtitle="Require admin approval for sensitive actions."
        icon={<ShieldCheck className="w-5 h-5 text-indigo-500" />}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        badge={
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-muted">Status:</span>
            {policies.some(p => p.enabled) ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Inactive
              </span>
            )}
          </div>
        }
      >
        <div>
          {errorMsg && (
            <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-6">
            <div className="bg-app-surface-solid border border-app-border rounded-xl p-4 sm:p-5 flex items-start gap-4 flex-col sm:flex-row sm:items-center justify-between transition-colors hover:border-app-border-hover">
              <div>
                <h4 className="text-sm font-semibold text-app-fg">Budget Baseline Changes</h4>
                <p className="text-xs text-app-muted mt-1 max-w-lg">
                  When enabled, any attempt to save a budget baseline will create a pending request instead of committing immediately. An Admin must approve it.
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={budgetPolicy?.enabled ?? false}
                  onChange={(e) => handleToggle('budget_baseline', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
              </label>
            </div>

            <div className="bg-app-surface-solid border border-app-border rounded-xl p-4 sm:p-5 flex items-start gap-4 flex-col sm:flex-row sm:items-center justify-between transition-colors hover:border-app-border-hover">
              <div>
                <h4 className="text-sm font-semibold text-app-fg">Schedule Baseline Changes</h4>
                <p className="text-xs text-app-muted mt-1 max-w-lg">
                  When enabled, any attempt to save a schedule baseline will create a pending request instead of committing immediately. An Admin must approve it.
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={schedulePolicy?.enabled ?? false}
                  onChange={(e) => handleToggle('schedule_baseline', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
