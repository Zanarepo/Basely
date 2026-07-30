'use client'

import { useState } from 'react'
import { X, Settings2, Loader2, Save, Calendar as CalIcon, AlertCircle, Users, ChevronDown, ChevronRight } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import { RaciAssignmentPicker } from './RaciAssignmentPicker'
import { WbsBasicDetails } from './sidepanel/WbsBasicDetails'
import { WbsSchedulingFields } from './sidepanel/WbsSchedulingFields'
import { WbsDependenciesList } from './sidepanel/WbsDependenciesList'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'
import { Paperclip } from 'lucide-react'
import { AttachmentList } from '@/components/dashboard/collaboration/attachments/AttachmentList'
import { AttachmentPicker } from '@/components/dashboard/collaboration/attachments/AttachmentPicker'
import { useEntityAttachments } from '@/components/dashboard/collaboration/hooks/useEntityAttachments'
import { IterationTagSelector } from '@/components/dashboard/releases/components/IterationTagSelector'

import { useWbsElementState } from './hooks/useWbsElementState'
import { useWbsScheduling } from './hooks/useWbsScheduling'
import { useWbsSubmit } from './hooks/useWbsSubmit'

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
}: WbsElementSidePanelProps) {
  const elementState = useWbsElementState(element)
  const schedulingState = useWbsScheduling(element, elementState.isWorkPackage)

  const [isBudgetOpen, setIsBudgetOpen] = useState(false)

  const { saving, handleFormSubmit } = useWbsSubmit({
    element,
    hasEditAccess,
    onSave,
    onClose,
    setScheduleError: schedulingState.setScheduleError,
    elementState,
    schedulingState
  })

  const [isRaciOpen, setIsRaciOpen] = useState(false)
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false)

  const {
    attachments,
    isLoading: isAttachmentsLoading,
    handleAddAttachment,
    handleDeleteAttachment
  } = useEntityAttachments(element?.projectId, 'wbs_element', element?.id)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  const isTeamMember = callerRole === 'Team Member'
  const isResponsible = element?.raciAssignments?.some(a => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId) ?? false
  const isAccountable = element?.raciAssignments?.some(a => a.roleType === 'Accountable' && a.stakeholder?.linked_user_id === callerUserId) ?? false
  
  const effectiveEditAccess = hasEditAccess && (!isTeamMember || isResponsible)
  const canEditSchedule = hasEditAccess && !!(effectiveEditAccess || (allowTeamScheduleEdits && isResponsible))
  const canCheckDeliverables = hasEditAccess && (effectiveEditAccess || isResponsible)
  const canCheckCriteria = hasEditAccess && (effectiveEditAccess || isAccountable)

  if (!element) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col animate-fade-in-right">
        <form onSubmit={handleFormSubmit} className="flex flex-col h-full overflow-hidden">
        
          <div className="flex items-center justify-between p-6 pb-4 border-b border-app-border shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-app-fg">
                WBS Element Details <span className="text-sm font-normal text-app-muted">({element?.code})</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
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
                canAssignMembers={canAssignMembers}
                callerRole={callerRole}
                callerUserId={callerUserId}
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
                  />
                </div>
              )}

              <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface">
                <button
                  type="button"
                  onClick={() => setIsRaciOpen(!isRaciOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
                    <Users className="w-4 h-4 text-app-muted" />
                    RACI Assignments
                  </div>
                  {isRaciOpen ? (
                    <ChevronDown className="w-4 h-4 text-app-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-app-muted" />
                  )}
                </button>
                
                {isRaciOpen && (
                  <div className="p-4 border-t border-app-border bg-app-surface-solid">
                    <RaciAssignmentPicker
                      projectId={element?.projectId || ''}
                      wbsElementId={element?.id || ''}
                      assignments={element?.raciAssignments || []}
                      hasEditAccess={hasEditAccess}
                      onAssignmentChanged={onAssignmentChanged}
                      onShowToast={onShowToast}
                      callerRole={callerRole}
                      callerUserId={callerUserId}
                    />
                  </div>
                )}
              </div>

              {elementState.isWorkPackage && (
                <div className="border border-green-500/25 rounded-xl overflow-hidden bg-green-500/5 dark:bg-green-950/20 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-green-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                      <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">$</span>
                      Budget Estimate
                    </div>
                    {isBudgetOpen ? (
                      <ChevronDown className="w-4 h-4 text-green-500/70" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-green-500/70" />
                    )}
                  </button>
                  
                  {isBudgetOpen && (
                    <div className="p-4 border-t border-green-500/25 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="auth-label block mb-1">Budget Amount</label>
                          <input
                            type="number"
                            value={elementState.cost || ''}
                            onChange={(e) => elementState.setCost(e.target.value ? Number(e.target.value) : undefined)}
                            disabled={!hasEditAccess || saving}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:border-green-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="auth-label block mb-1">Estimation Method</label>
                          <select
                            value={elementState.estimationMethod}
                            onChange={(e) => elementState.setEstimationMethod(e.target.value as any)}
                            disabled={!hasEditAccess || saving}
                            className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:border-green-500 disabled:opacity-50"
                          >
                            <option value="bottom_up">Bottom-Up</option>
                            <option value="analogous">Analogous</option>
                            <option value="parametric">Parametric</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {elementState.isWorkPackage && (
                <div className="border border-indigo-500/25 rounded-xl overflow-hidden bg-indigo-500/5 dark:bg-indigo-950/20 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-indigo-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                      <CalIcon className="w-4 h-4" />
                      Scheduling & Dependencies
                    </div>
                    {isScheduleOpen ? (
                      <ChevronDown className="w-4 h-4 text-indigo-500/70" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-indigo-500/70" />
                    )}
                  </button>

                  {isScheduleOpen && (
                    <div className="p-4 border-t border-indigo-500/25 space-y-4">
                      <WbsSchedulingFields
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
                      />

                      <WbsDependenciesList
                        isWorkPackage={elementState.isWorkPackage}
                        loadingSchedule={schedulingState.loadingSchedule}
                        projectActivities={schedulingState.projectActivities}
                        predecessors={schedulingState.predecessors}
                        hasEditAccess={canEditSchedule}
                        saving={saving}
                        handleTogglePredecessor={schedulingState.handleTogglePredecessor}
                        handleUpdatePredType={schedulingState.handleUpdatePredType}
                        handleUpdatePredLag={schedulingState.handleUpdatePredLag}
                      />
                    </div>
                  )}
                </div>
              )}
              
              
              <div className="border border-app-border rounded-xl bg-app-surface">
                <button
                  type="button"
                  onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors ${
                    isAttachmentsOpen ? 'rounded-t-xl' : 'rounded-xl'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
                    <Paperclip className="w-4 h-4 text-app-muted" />
                    Attachments ({attachments.length})
                  </div>
                  {isAttachmentsOpen ? (
                    <ChevronDown className="w-4 h-4 text-app-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-app-muted" />
                  )}
                </button>
                
                {isAttachmentsOpen && (
                  <div className="p-4 border-t border-app-border bg-app-surface-solid rounded-b-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-app-fg">Files</h4>
                      {effectiveEditAccess && (
                        <AttachmentPicker onAttach={handleAddAttachment} />
                      )}
                    </div>
                    <AttachmentList
                      attachments={attachments}
                      isLoading={isAttachmentsLoading}
                      onDelete={handleDeleteAttachment}
                      currentUserIsAdmin={callerRole === 'owner' || callerRole === 'admin'}
                      currentUserId={callerUserId}
                    />
                  </div>
                )}
              </div>

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
