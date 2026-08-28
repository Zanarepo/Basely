import { User, FileText, CheckSquare, Plus, Check, X, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { WbsStatus, ChecklistItem } from '@/lib/wbs/constants'
import { WbsChecklist } from './WbsChecklist'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { TerminologyDict } from '@/utils/terminology'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

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
  canAssignMembers,
  callerRole,
  callerUserId,
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
  onShowToast,
  projectAdrs = [],
  linkedAdrIds = [],
  tier = 'free',
  wbsElementId,
  onLinkedAdrsChange
}: WbsBasicDetailsProps) {
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const [isScopeOpen, setIsScopeOpen] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [isAutoSavingStatus, setIsAutoSavingStatus] = useState(false)
  const [skillsInputValue, setSkillsInputValue] = useState(requiredSkills.join(', '))
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  useEffect(() => {
    setSkillsInputValue(requiredSkills.join(', '))
  }, [requiredSkills])

  const handleAiGenerateScope = async () => {
    if (!name.trim() || isGeneratingAi || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGeneratingAi(true)
    try {
      const { generateScopeDetailsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await generateScopeDetailsWithAiAction(name, description)

      if (result.ok && result.data) {
        const res = result.data
        if (res.tangible_deliverables?.length) {
          const newDel: ChecklistItem[] = res.tangible_deliverables.map((text, i) => ({
            id: `del_ai_${i}_${Date.now()}`,
            text,
            completed: false
          }))
          setDeliverablesData(newDel)
          onAutoSaveDeliverables?.(newDel)
        }

        if (res.acceptance_criteria?.length) {
          const newCrit: ChecklistItem[] = res.acceptance_criteria.map((text, i) => ({
            id: `acc_ai_${i}_${Date.now()}`,
            text,
            completed: false
          }))
          setAcceptanceCriteriaData(newCrit)
          onAutoSaveCriteria?.(newCrit)
        }
        await recordUsage('generations')
      } else {
        console.error('Failed to generate scope details:', result.error)
      }
      setIsScopeOpen(true)
    } catch (err) {
      console.error('Failed to Praz-AI generate scope details:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const [isEstimatingAi, setIsEstimatingAi] = useState(false)

  const handleAiEstimateStoryPoints = async () => {
    if (!name.trim() || isEstimatingAi || isChecking) return
    
    setIsEstimatingAi(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const { estimateStoryPointsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await estimateStoryPointsWithAiAction(name, description)
      if (result.ok && result.data) {
        const estimatedPoints = result.data.story_points
        setStoryPoints?.(estimatedPoints)
        onAutoSaveStoryPoints?.(estimatedPoints)
        onShowToast?.('success', `Story points estimated at ${estimatedPoints}`)
        await recordUsage('generations')
      } else {
        console.error('Failed to estimate story points:', result.error)
        onShowToast?.('error', 'Failed to estimate story points')
      }
    } catch (err) {
      console.error('Failed to Praz-AI estimate story points:', err)
      onShowToast?.('error', 'Failed to estimate story points')
    } finally {
      setIsEstimatingAi(false)
    }
  }

  const [isEstimatingSkillsAi, setIsEstimatingSkillsAi] = useState(false)

  const handleAiEstimateSkills = async () => {
    if (!name.trim() || isEstimatingSkillsAi || isChecking) return
    
    setIsEstimatingSkillsAi(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const { estimateRequiredSkillsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await estimateRequiredSkillsWithAiAction(name, description)
      if (result.ok && result.data) {
        const estimatedSkills = result.data.required_skills
        setRequiredSkills?.(estimatedSkills)
        setSkillsInputValue(estimatedSkills.join(', '))
        onAutoSaveRequiredSkills?.(estimatedSkills)
        onShowToast?.('success', `Required skills estimated`)
        await recordUsage('generations')
      } else {
        console.error('Failed to estimate required skills:', result.error)
        onShowToast?.('error', 'Failed to estimate required skills')
      }
    } catch (err) {
      console.error('Failed to Praz-AI estimate required skills:', err)
      onShowToast?.('error', 'Failed to estimate required skills')
    } finally {
      setIsEstimatingSkillsAi(false)
    }
  }

  const handleSaveNewStatus = () => {
    const trimmed = newStatusName.trim()
    if (trimmed) {
      onAddCustomStatus(trimmed)
      setStatus(trimmed as WbsStatus)
    }
    setNewStatusName('')
    setIsAddingStatus(false)
  }

  // Fallback to hasEditAccess if canCheckDeliverables isn't explicitly passed
  const isCheckboxEnabled = (!saving) && (canCheckDeliverables ?? hasEditAccess)

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

      {/* Owner Removed - Handled by RACI */}

      {/* Status & Terminology Toggle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="auth-label">Status</label>
          {isAddingStatus ? (
             <div className="flex flex-col gap-2">
               <input
                 autoFocus
                 type="text"
                 placeholder="New Status"
                 className="w-full px-3 py-1.5 text-sm bg-app-input border border-violet-500 rounded-lg text-app-fg focus:outline-none focus:ring-1 focus:ring-violet-500"
                 value={newStatusName}
                 onChange={(e) => setNewStatusName(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSaveNewStatus()}
               />
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   className="flex-1 flex justify-center items-center py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                   onClick={handleSaveNewStatus}
                 >
                   <Check className="w-3 h-3 mr-1" /> Add
                 </button>
                 <button
                   type="button"
                   className="flex-1 flex justify-center items-center py-1.5 bg-app-muted-surface hover:bg-app-hover text-app-subtle rounded-lg text-xs font-semibold cursor-pointer"
                   onClick={() => setIsAddingStatus(false)}
                 >
                   <X className="w-3 h-3 mr-1" /> Cancel
                 </button>
               </div>
             </div>
          ) : (
            <div className="flex flex-col gap-2 relative">
              <EnterpriseSelect
                value={status}
                onChange={async (val) => {
                  setStatus(val as WbsStatus)
                  if (onAutoSaveStatus) {
                    setIsAutoSavingStatus(true)
                    try {
                      await onAutoSaveStatus(val as WbsStatus)
                    } finally {
                      setIsAutoSavingStatus(false)
                    }
                  }
                }}
                options={customStatuses}
                disabled={!hasEditAccess || saving || isAutoSavingStatus}
                size="lg"
                placeholder="Select status..."
              />
              {isAutoSavingStatus && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center bg-app-surface-solid px-2">
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                </div>
              )}
              {hasEditAccess && !saving && !isAutoSavingStatus && (
                <button
                  type="button"
                  onClick={() => setIsAddingStatus(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600 transition-colors w-max cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  New Status
                </button>
              )}
            </div>
          )}
        </div>

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

      <div className={`grid ${terms.iteration === 'Phase' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mt-4`}>
        <div className="space-y-2">
          <label className="auth-label">Priority</label>
          <EnterpriseSelect
            value={priority || 'None'}
            onChange={(val) => {
              const newVal = val === 'None' ? null : val
              setPriority?.(newVal)
              onAutoSavePriority?.(newVal)
            }}
            options={['Critical', 'High', 'Medium', 'Low', 'None']}
            disabled={!hasEditAccess || saving}
            size="lg"
            placeholder="Select priority..."
          />
        </div>
        
        {terms.iteration !== 'Phase' && (
          <div className="space-y-2">
            <label className="auth-label">Story Points</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={storyPoints === null ? '' : storyPoints}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value)
                  setStoryPoints?.(val)
                }}
                onBlur={() => {
                  onAutoSaveStoryPoints?.(storyPoints ?? null)
                }}
                disabled={!hasEditAccess || saving || isEstimatingAi}
                placeholder="e.g. 5"
                className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm disabled:opacity-50"
              />
              {hasEditAccess && (
                <button
                  type="button"
                  onClick={handleAiEstimateStoryPoints}
                  disabled={isEstimatingAi || isChecking}
                  className="shrink-0 flex items-center justify-center w-10 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 rounded-xl border border-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  title="AI Estimate Story Points"
                >
                  {isEstimatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-4">
        <label className="auth-label">Required Skills (Comma separated)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillsInputValue}
            onChange={(e) => {
              setSkillsInputValue(e.target.value)
            }}
            onBlur={() => {
              const val = skillsInputValue.split(',').map(s => s.trim()).filter(Boolean)
              setRequiredSkills?.(val)
              onAutoSaveRequiredSkills?.(val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = skillsInputValue.split(',').map(s => s.trim()).filter(Boolean)
                setRequiredSkills?.(val)
                onAutoSaveRequiredSkills?.(val)
              }
            }}
            disabled={!hasEditAccess || saving}
            placeholder="e.g. frontend, react, data_science"
            className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm disabled:opacity-50"
          />
          {hasEditAccess && (
            <button
              type="button"
              onClick={handleAiEstimateSkills}
              disabled={isEstimatingSkillsAi || isChecking}
              className="shrink-0 flex items-center justify-center w-10 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 rounded-xl border border-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
              title="AI Estimate Required Skills"
            >
              {isEstimatingSkillsAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className="text-xs text-app-subtle">
          Used by AI Skill Gap Analysis to predict team capacity bottlenecks.
        </p>
      </div>

      {/* Scope & Deliverables Accordion */}
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface mt-6">
        <div className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors">
          <button
            type="button"
            onClick={() => setIsScopeOpen(!isScopeOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-app-fg focus:outline-none"
          >
            <FileText className="w-4 h-4 text-app-muted" />
            <span>Scope & Deliverables</span>
            {isScopeOpen ? (
              <ChevronDown className="w-4 h-4 text-app-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-app-muted" />
            )}
          </button>

          {hasEditAccess && (
            <button
              type="button"
              disabled={isGeneratingAi || !name.trim()}
              onClick={(e) => {
                e.stopPropagation()
                handleAiGenerateScope()
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-linear-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-indigo-500/20 border border-violet-500/30 transition-all disabled:opacity-50 cursor-pointer"
              title="Auto-generate Tangible Deliverables and Acceptance Criteria with Praz-AI"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span>Auto-Fill Praz-AI</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {isScopeOpen && (
          <div className="p-4 border-t border-app-border bg-app-surface-solid space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="wbs-description" className="auth-label flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-app-subtle" />
                Description
              </label>
              <textarea
                id="wbs-description"
                disabled={!hasEditAccess || saving}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe scope boundaries, key steps, and what this element covers..."
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 min-h-[90px] resize-none text-xs disabled:opacity-50"
              />
            </div>

            {/* Deliverables (Interactive Checklist) */}
            <WbsChecklist
              title="Tangible Deliverables"
              icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
              items={deliverablesData}
              setItems={setDeliverablesData}
              hasEditAccess={hasEditAccess}
              canCheckItems={canCheckDeliverables}
              saving={saving}
              placeholder="E.g., Design Mockups"
              onAutoSave={onAutoSaveDeliverables}
            />

            {/* Acceptance Criteria */}
            <WbsChecklist
              title="Acceptance Criteria"
              icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
              items={acceptanceCriteriaData}
              setItems={setAcceptanceCriteriaData}
              hasEditAccess={hasEditAccess}
              canCheckItems={isCheckboxEnabled || canCheckCriteria}
              saving={saving}
              placeholder="E.g., Passes User Testing"
              onAutoSave={onAutoSaveCriteria}
            />

            {/* User Stories (Agile Focus) */}
            {terms.iteration !== 'Phase' && (
              <WbsChecklist
                title="User Stories"
                icon={<User className="h-3.5 w-3.5 text-app-subtle" />}
                items={userStoriesData}
                setItems={setUserStoriesData || setDeliverablesData}
                hasEditAccess={hasEditAccess}
                canCheckItems={isCheckboxEnabled || canCheckCriteria}
                saving={saving}
                placeholder="As a [user], I want..."
                onAutoSave={onAutoSaveUserStories}
              />
            )}

            {/* Edge Cases (Agile Focus) */}
            {terms.iteration !== 'Phase' && (
              <WbsChecklist
                title="Edge Cases"
                icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
                items={edgeCasesData}
                setItems={setEdgeCasesData || setDeliverablesData}
                hasEditAccess={hasEditAccess}
                canCheckItems={isCheckboxEnabled || canCheckCriteria}
                saving={saving}
                placeholder="E.g., If API returns 500..."
                onAutoSave={onAutoSaveEdgeCases}
              />
            )}
          </div>
        )}
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}
