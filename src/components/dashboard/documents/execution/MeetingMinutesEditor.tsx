'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { ActionItemModal } from '@/components/dashboard/action-items/ActionItemModal'
import { AiMeetingCopilotModal } from './AiMeetingCopilotModal'
import { useMeetingMinutes } from './meeting-minutes/useMeetingMinutes'
import { MeetingMinutesHeader } from './meeting-minutes/MeetingMinutesHeader'
import { MeetingMinutesGeneralDetails } from './meeting-minutes/MeetingMinutesGeneralDetails'
import { MeetingMinutesNotesAndDecisions } from './meeting-minutes/MeetingMinutesNotesAndDecisions'
import { MeetingMinutesActionItemsList } from './meeting-minutes/MeetingMinutesActionItemsList'

interface MeetingMinutesEditorProps {
  projectId: string
  minuteId: string | null
  hasEditAccess: boolean
  onBack: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function MeetingMinutesEditor({ projectId, minuteId, hasEditAccess, onBack, onShowToast }: MeetingMinutesEditorProps) {
  const {
    isLoading,
    isSaving,
    meetingDate,
    attendees,
    discussionNotes,
    decisions,
    actionItems,
    pendingActionItems,
    stakeholders,
    isSpawnModalOpen,
    isCopilotOpen,
    
    setMeetingDate,
    setDiscussionNotes,
    setIsSpawnModalOpen,
    setIsCopilotOpen,
    
    handleCopilotComplete,
    updatePendingActionItem,
    removePendingActionItem,
    handleSave,
    handleDelete,
    toggleAttendee,
    addDecision,
    updateDecision,
    removeDecision,
    fetchMinuteDetails
  } = useMeetingMinutes({ projectId, minuteId, hasEditAccess, onBack, onShowToast })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-app-bg text-app-fg overflow-hidden relative">
      
      <MeetingMinutesHeader
        minuteId={minuteId}
        hasEditAccess={hasEditAccess}
        isSaving={isSaving}
        onBack={onBack}
        onDelete={handleDelete}
        onSave={handleSave}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          
          <MeetingMinutesGeneralDetails
            hasEditAccess={hasEditAccess}
            meetingDate={meetingDate}
            setMeetingDate={setMeetingDate}
            attendees={attendees}
            stakeholders={stakeholders}
            toggleAttendee={toggleAttendee}
          />

          <MeetingMinutesNotesAndDecisions
            hasEditAccess={hasEditAccess}
            discussionNotes={discussionNotes}
            setDiscussionNotes={setDiscussionNotes}
            decisions={decisions}
            addDecision={addDecision}
            updateDecision={updateDecision}
            removeDecision={removeDecision}
          />

          <MeetingMinutesActionItemsList
            minuteId={minuteId}
            hasEditAccess={hasEditAccess}
            actionItems={actionItems}
            pendingActionItems={pendingActionItems}
            stakeholders={stakeholders}
            updatePendingActionItem={updatePendingActionItem}
            removePendingActionItem={removePendingActionItem}
            onOpenSpawnModal={() => setIsSpawnModalOpen(true)}
          />

        </div>
      </div>
      
      {isSpawnModalOpen && minuteId && (
        <ActionItemModal
          projectId={projectId}
          sourceMeetingId={minuteId}
          onClose={() => setIsSpawnModalOpen(false)}
          onSaved={() => {
            setIsSpawnModalOpen(false)
            fetchMinuteDetails()
            onShowToast?.('success', 'Action item created successfully')
          }}
          onShowToast={onShowToast}
        />
      )}

      <AiMeetingCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        projectId={projectId}
        onExtractionComplete={handleCopilotComplete}
        onShowToast={onShowToast}
      />
    </div>
  )
}
