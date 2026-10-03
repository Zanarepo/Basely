'use client'

import { useEffect, useState } from 'react'
import { X, Settings2, Loader2, Save, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import { WbsBasicDetails } from './sidepanel/WbsBasicDetails'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'
import { useEntityAttachments } from '@/components/dashboard/collaboration/hooks/useEntityAttachments'
import { IterationTagSelector } from '@/components/dashboard/releases/components/IterationTagSelector'

import { useWbsElementState } from './hooks/useWbsElementState'
import { useWbsScheduling } from './hooks/useWbsScheduling'
import { useWbsSubmit } from './hooks/useWbsSubmit'
import { useWbsSidePanelPermissions } from './hooks/useWbsSidePanelPermissions'
import { useUserPersona } from '@/hooks/use-user-persona'
import { getProjectAdrs, type AdrSummary } from '@/lib/adr/adr-workflow-data'

import { WbsRaciAccordion } from './sidepanel/accordions/WbsRaciAccordion'
import { WbsBudgetAccordion } from './sidepanel/accordions/WbsBudgetAccordion'
import { WbsScheduleAccordion } from './sidepanel/accordions/WbsScheduleAccordion'
import { WbsAttachmentsAccordion } from './sidepanel/accordions/WbsAttachmentsAccordion'
import { WbsAdrAccordion } from './sidepanel/accordions/WbsAdrAccordion'

type WbsElementSidePanelProps = {
  element: WbsElement | null
  workspaceMembers: { userId: string; name: string; email: string }[]
  onClose: () => void
  onSave: (id: string, updates: Partial<WbsElement>) => Promise<boolean>
  onAssignmentChanged?: () => void
  hasEditAccess: boolean
  customStatuses: string[]
  onAddCustomStatus: (newStatus: string) => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
  canAssignMembers?: boolean
  callerRole?: string
  callerUserId?: string
  allowTeamScheduleEdits?: boolean
  currency?: string
  terms: import('@/utils/terminology').TerminologyDict
  organizationId: string
  tier: string
  aiEnabled: boolean
  methodology?: string | null
}

export function WbsElementSidePanel({
  element,
  workspaceMembers,
  onClose,
  onSave,
  onAssignmentChanged,
  hasEditAccess,
  customStatuses,
  onAddCustomStatus,
  onShowToast,
  canAssignMembers = false,
  callerRole,
  callerUserId,
  allowTeamScheduleEdits = false,
  currency = 'USD',
  terms,
  organizationId,
  tier,
  aiEnabled,
  methodology,
}: WbsElementSidePanelProps) {
  const { showBudgetControls } = useUserPersona()

  const [projectAdrs, setProjectAdrs] = useState<AdrSummary[]>([])

  useEffect(() => {
    if (element?.projectId) {
      getProjectAdrs(element.projectId).then(setProjectAdrs).catch(console.error)
    }
  }, [element?.projectId])

  const [isExpanded, setIsExpanded] = useState(false)
  const elementState = useWbsElementState(element)
  const schedulingState = useWbsScheduling(element, elementState.isWorkPackage)

  const {
    effectiveEditAccess,
    canEditSchedule,
    canCheckDeliverables,
    canCheckCriteria,
  } = useWbsSidePanelPermissions({
    element,
    hasEditAccess,
    callerRole,
    callerUserId,
    allowTeamScheduleEdits,
  })

  const { saving, handleFormSubmit } = useWbsSubmit({
    element,
    hasEditAccess,
    onSave,
    onClose,
    setScheduleError: schedulingState.setScheduleError,
    elementState,
    schedulingState
  })

  const {
    attachments,
    isLoading: isAttachmentsLoading,
    handleAddAttachment,
    handleDeleteAttachment
  } = useEntityAttachments(element?.projectId, 'wbs_element', element?.id)

  if (!element) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 z-50 w-full bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'max-w-4xl' : 'max-w-lg'} animate-fade-in-right`}>
        <form onSubmit={handleFormSubmit} className="flex flex-col h-full overflow-hidden">
        
          <div className="flex items-center justify-between p-6 pb-4 border-b border-app-border shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-bold text-app-fg">
                WBS Element Details <span className="text-sm font-normal text-app-muted">({element?.code})</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
                title={isExpanded ? "Minimize panel" : "Expand panel"}
              >
                {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {schedulingState.scheduleError && (
            <div className="mx-6 mt-6 p-4 border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/25 rounded-2xl flex items-start gap-3 shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-red-800 dark:text-red-400">Scheduling Recalculation Blocked</span>
                <p className="text-[11px] text-red-700 dark:text-red-300 mt-1">{schedulingState.scheduleError}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-5">
              <WbsBasicDetails
                name={elementState.name}
                setName={elementState.setName}
                status={elementState.status}
                setStatus={elementState.setStatus}
                isWorkPackage={elementState.isWorkPackage}
                setIsWorkPackage={elementState.setIsWorkPackage}
                description={elementState.description}
                setDescription={elementState.setDescription}
                deliverablesData={elementState.deliverablesData}
                setDeliverablesData={elementState.setDeliverablesData}
                acceptanceCriteriaData={elementState.acceptanceCriteriaData}
                setAcceptanceCriteriaData={elementState.setAcceptanceCriteriaData}
                userStoriesData={elementState.userStoriesData}
                setUserStoriesData={elementState.setUserStoriesData}
                edgeCasesData={elementState.edgeCasesData}
                setEdgeCasesData={elementState.setEdgeCasesData}
                priority={elementState.priority}
                setPriority={elementState.setPriority}
                storyPoints={elementState.storyPoints}
                setStoryPoints={elementState.setStoryPoints}
                requiredSkills={elementState.requiredSkills}
                setRequiredSkills={elementState.setRequiredSkills}
                hasEditAccess={effectiveEditAccess}
                canCheckDeliverables={canCheckDeliverables}
                canCheckCriteria={canCheckCriteria}
                saving={saving}
                workspaceMembers={workspaceMembers}
                customStatuses={customStatuses}
                onAddCustomStatus={onAddCustomStatus}
                onAutoSaveDeliverables={(items) => {
                  if (element?.id) onSave(element.id, { deliverablesData: items })
                }}
                onAutoSaveCriteria={(items) => {
                  if (element?.id) onSave(element.id, { acceptanceCriteriaData: items })
                }}
                onAutoSaveUserStories={(items) => {
                  if (element?.id) onSave(element.id, { userStoriesData: items })
                }}
                onAutoSaveEdgeCases={(items) => {
                  if (element?.id) onSave(element.id, { edgeCasesData: items })
                }}
                onAutoSavePriority={(val) => {
                  if (element?.id) onSave(element.id, { priority: val })
                }}
                onAutoSaveStoryPoints={(val) => {
                  if (element?.id) onSave(element.id, { story_points: val })
                }}
                onAutoSaveRequiredSkills={(val) => {
                  if (element?.id) onSave(element.id, { required_skills: val })
                }}
                onAutoSaveStatus={async (val) => {
                  if (element?.id) await onSave(element.id, { status: val })
                }}
                canAssignMembers={canAssignMembers}
                callerRole={callerRole}
                callerUserId={callerUserId}
                terms={terms}
                organizationId={organizationId}
                onShowToast={onShowToast}
                wbsElementId={element?.id || ''}
                projectAdrs={projectAdrs}
                linkedAdrIds={elementState.linkedAdrIds}
                tier={tier}
                onLinkedAdrsChange={(newIds: string[]) => {
                  elementState.setLinkedAdrIds(newIds)
                }}
              />

              {element?.projectId && element?.id && (
                <div className="py-1">
                  <IterationTagSelector
                    projectId={element.projectId}
                    entityType="wbs_element"
                    entityId={element.id}
                    currentIterationId={(element as any).iterationId}
                    disabled={!hasEditAccess}
                    onUpdated={(newVal) => {
                      if (onAssignmentChanged) onAssignmentChanged()
                    }}
                    methodology={methodology}
                  />
                </div>
              )}

              {terms.iteration === 'Phase' && (
                <WbsScheduleAccordion
                  projectId={element.projectId}
                  wbsElementId={element.id}
                  isWorkPackage={elementState.isWorkPackage}
                  autoSchedule={schedulingState.autoSchedule}
                  setAutoSchedule={schedulingState.setAutoSchedule}
                  isMilestone={schedulingState.isMilestone}
                  setIsMilestone={schedulingState.setIsMilestone}
                  loadingSchedule={schedulingState.loadingSchedule}
                  hasEditAccess={canEditSchedule}
                  saving={saving}
                  startDate={schedulingState.startDate}
                  handleStartDateChange={schedulingState.handleStartDateChange}
                  endDate={schedulingState.endDate}
                  handleEndDateChange={schedulingState.handleEndDateChange}
                  duration={schedulingState.duration}
                  handleDurationChange={schedulingState.handleDurationChange}
                  projectActivities={schedulingState.projectActivities}
                  predecessors={schedulingState.predecessors}
                  handleTogglePredecessor={schedulingState.handleTogglePredecessor}
                  handleUpdatePredType={schedulingState.handleUpdatePredType}
                  handleUpdatePredLag={schedulingState.handleUpdatePredLag}
                  onDependenciesChanged={schedulingState.refetchSchedulingData}
                  methodology={methodology}
                />
              )}

              <WbsRaciAccordion
                element={element}
                hasEditAccess={hasEditAccess}
                onAssignmentChanged={onAssignmentChanged}
                onShowToast={onShowToast}
                organizationId={organizationId}
                tier={tier}
                aiEnabled={aiEnabled}
                callerRole={callerRole}
                callerUserId={callerUserId}
              />

              {showBudgetControls && elementState.isWorkPackage && methodology?.toLowerCase() !== 'agile' && (
                <WbsBudgetAccordion
                  wbsElementId={element.id}
                  wbsName={element.name}
                  projectId={element.projectId}
                  cost={elementState.cost}
                  setCost={elementState.setCost}
                  estimationMethod={elementState.estimationMethod}
                  setEstimationMethod={elementState.setEstimationMethod}
                  hasEditAccess={effectiveEditAccess}
                  saving={saving}
                  currency={currency}
                  onAssignmentChanged={onAssignmentChanged}
                />
              )}

              {terms.iteration !== 'Phase' && (
                <WbsScheduleAccordion
                  projectId={element.projectId}
                  wbsElementId={element.id}
                  isWorkPackage={elementState.isWorkPackage}
                  autoSchedule={schedulingState.autoSchedule}
                  setAutoSchedule={schedulingState.setAutoSchedule}
                  isMilestone={schedulingState.isMilestone}
                  setIsMilestone={schedulingState.setIsMilestone}
                  loadingSchedule={schedulingState.loadingSchedule}
                  hasEditAccess={canEditSchedule}
                  saving={saving}
                  startDate={schedulingState.startDate}
                  handleStartDateChange={schedulingState.handleStartDateChange}
                  endDate={schedulingState.endDate}
                  handleEndDateChange={schedulingState.handleEndDateChange}
                  duration={schedulingState.duration}
                  handleDurationChange={schedulingState.handleDurationChange}
                  projectActivities={schedulingState.projectActivities}
                  predecessors={schedulingState.predecessors}
                  handleTogglePredecessor={schedulingState.handleTogglePredecessor}
                  handleUpdatePredType={schedulingState.handleUpdatePredType}
                  handleUpdatePredLag={schedulingState.handleUpdatePredLag}
                  onDependenciesChanged={schedulingState.refetchSchedulingData}
                  methodology={methodology}
                />
              )}
              
              {elementState.isWorkPackage && (
                <WbsAdrAccordion
                  wbsElementId={element?.id || ''}
                  organizationId={organizationId}
                  projectAdrs={projectAdrs}
                  linkedAdrIds={elementState.linkedAdrIds}
                  tier={tier}
                  hasEditAccess={hasEditAccess}
                  onLinkedAdrsChange={(newIds: string[]) => {
                    elementState.setLinkedAdrIds(newIds)
                  }}
                />
              )}

              <WbsAttachmentsAccordion
                attachments={attachments}
                isAttachmentsLoading={isAttachmentsLoading}
                hasEditAccess={effectiveEditAccess}
                callerRole={callerRole}
                callerUserId={callerUserId}
                handleAddAttachment={handleAddAttachment}
                handleDeleteAttachment={handleDeleteAttachment}
              />

              <div className="mt-8 border-t border-app-border pt-6">
                <CommentThread
                  projectId={element?.projectId || ''}
                  entityType="activity"
                  entityId={element?.id || ''}
                  currentUserId={callerUserId}
                  workspaceMembers={workspaceMembers}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-app-border flex items-center justify-end gap-3 bg-app-surface-solid shrink-0 mt-auto">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            {effectiveEditAccess && (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Dictionary
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}
