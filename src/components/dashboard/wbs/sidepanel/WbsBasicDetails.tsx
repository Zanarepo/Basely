import { useState, useEffect } from 'react'
import type { WbsStatus, ChecklistItem } from '@/lib/wbs/constants'
import { TerminologyDict } from '@/utils/terminology'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import { StatusSelector } from './components/StatusSelector'
import { EstimationFields } from './components/EstimationFields'
import { ScopeDeliverablesAccordion } from './components/ScopeDeliverablesAccordion'

type WbsBasicDetailsProps = {
  name: string
  setName: (val: string) => void
  status: WbsStatus
  setStatus: (val: WbsStatus) => void
  isWorkPackage: boolean
  setIsWorkPackage: React.Dispatch<React.SetStateAction<boolean>>
  description: string
  setDescription: (val: string) => void
  deliverablesData: ChecklistItem[]
  setDeliverablesData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  acceptanceCriteriaData: ChecklistItem[]
  setAcceptanceCriteriaData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  userStoriesData?: ChecklistItem[]
  setUserStoriesData?: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  edgeCasesData?: ChecklistItem[]
  setEdgeCasesData?: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  priority?: string | null
  setPriority?: (val: string | null) => void
  storyPoints?: number | null
  setStoryPoints?: (val: number | null) => void
  requiredSkills?: string[]
  setRequiredSkills?: (val: string[]) => void
  hasEditAccess: boolean
  canCheckDeliverables?: boolean
  canCheckCriteria?: boolean
  saving: boolean
  workspaceMembers: { userId: string; name: string; email: string }[]
  customStatuses: string[]
  onAddCustomStatus: (newStatus: string) => void
  canAssignMembers?: boolean
  callerRole?: string
  callerUserId?: string
  onAutoSaveDeliverables?: (items: ChecklistItem[]) => void
  onAutoSaveCriteria?: (items: ChecklistItem[]) => void
  onAutoSaveUserStories?: (items: ChecklistItem[]) => void
  onAutoSaveEdgeCases?: (items: ChecklistItem[]) => void
  onAutoSavePriority?: (val: string | null) => void
  onAutoSaveStoryPoints?: (val: number | null) => void
  onAutoSaveRequiredSkills?: (val: string[]) => void
  onAutoSaveStatus?: (val: WbsStatus) => Promise<void> | void
  terms: TerminologyDict
  organizationId: string
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  projectAdrs?: any[]
  linkedAdrIds?: string[]
  tier?: string
  wbsElementId?: string
  onLinkedAdrsChange?: (ids: string[]) => void
}

export function WbsBasicDetails({
  name, setName,
  status, setStatus,
  isWorkPackage, setIsWorkPackage,
  description, setDescription,
  deliverablesData, setDeliverablesData,
  acceptanceCriteriaData, setAcceptanceCriteriaData,
  userStoriesData = [], setUserStoriesData,
  edgeCasesData = [], setEdgeCasesData,
  priority, setPriority,
  storyPoints, setStoryPoints,
  requiredSkills = [], setRequiredSkills,
  hasEditAccess,
  canCheckDeliverables,
  canCheckCriteria,
  saving,
  customStatuses,
  onAddCustomStatus,
  onAutoSaveDeliverables,
  onAutoSaveCriteria,
  onAutoSaveUserStories,
  onAutoSaveEdgeCases,
  onAutoSavePriority,
  onAutoSaveStoryPoints,
  onAutoSaveRequiredSkills,
  onAutoSaveStatus,
  terms,
  organizationId,
  onShowToast
}: WbsBasicDetailsProps) {
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  return (
    <>
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="wbs-name" className="auth-label">
          Element Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="wbs-name"
          type="text"
          required
          disabled={!hasEditAccess || saving}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Requirements Gathering"
          className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm disabled:opacity-50"
        />
      </div>

      {/* Status & Terminology Toggle */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <StatusSelector
          status={status}
          setStatus={setStatus}
          customStatuses={customStatuses}
          onAddCustomStatus={onAddCustomStatus}
          hasEditAccess={hasEditAccess}
          saving={saving}
          onAutoSaveStatus={onAutoSaveStatus}
        />

        <div className="space-y-2">
          <label className="auth-label block mb-1">Planning Tier</label>
          <button
            type="button"
            disabled={!hasEditAccess || saving}
            onClick={() => {
              if (isWorkPackage) {
                const confirmed = window.confirm(`Warning: Changing this ${terms.workPackage} to a ${terms.planTier} will delete any budget estimates associated with it. This action cannot be undone. Are you sure you want to proceed?`);
                if (confirmed) {
                  setIsWorkPackage(false);
                }
              } else {
                setIsWorkPackage(true);
              }
            }}
            className={`w-full py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              isWorkPackage
                ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/35 shadow-xs'
                : 'bg-app-input text-app-muted border-app-border hover:bg-app-hover'
            }`}
          >
            {isWorkPackage ? `${terms.workPackage} (Leaf)` : terms.planTier}
          </button>
          <p className="text-xs text-app-subtle leading-relaxed">
            {terms.planTiers} break down into smaller tasks. Only <b>{terms.workPackages}</b> can be scheduled, assigned to people, and have budget estimates.
          </p>
        </div>
      </div>

      {/* Estimation Fields */}
      <EstimationFields
        name={name}
        description={description}
        priority={priority}
        setPriority={setPriority}
        storyPoints={storyPoints}
        setStoryPoints={setStoryPoints}
        requiredSkills={requiredSkills}
        setRequiredSkills={setRequiredSkills}
        hasEditAccess={hasEditAccess}
        saving={saving}
        terms={terms}
        isChecking={isChecking}
        checkLimit={checkLimit}
        recordUsage={recordUsage}
        onShowToast={onShowToast}
        onAutoSavePriority={onAutoSavePriority}
        onAutoSaveStoryPoints={onAutoSaveStoryPoints}
        onAutoSaveRequiredSkills={onAutoSaveRequiredSkills}
      />

      {/* Scope & Deliverables Accordion */}
      <ScopeDeliverablesAccordion
        name={name}
        description={description}
        setDescription={setDescription}
        deliverablesData={deliverablesData}
        setDeliverablesData={setDeliverablesData}
        acceptanceCriteriaData={acceptanceCriteriaData}
        setAcceptanceCriteriaData={setAcceptanceCriteriaData}
        userStoriesData={userStoriesData}
        setUserStoriesData={setUserStoriesData}
        edgeCasesData={edgeCasesData}
        setEdgeCasesData={setEdgeCasesData}
        hasEditAccess={hasEditAccess}
        canCheckDeliverables={canCheckDeliverables}
        canCheckCriteria={canCheckCriteria}
        saving={saving}
        terms={terms}
        isChecking={isChecking}
        checkLimit={checkLimit}
        recordUsage={recordUsage}
        onAutoSaveDeliverables={onAutoSaveDeliverables}
        onAutoSaveCriteria={onAutoSaveCriteria}
        onAutoSaveUserStories={onAutoSaveUserStories}
        onAutoSaveEdgeCases={onAutoSaveEdgeCases}
      />

      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
