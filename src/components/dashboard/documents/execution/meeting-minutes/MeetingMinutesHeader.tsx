import React from 'react'
import { ArrowLeft, Save, Trash2, Loader2, Sparkles } from 'lucide-react'

interface MeetingMinutesHeaderProps {
  minuteId: string | null
  hasEditAccess: boolean
  isSaving: boolean
  onBack: () => void
  onDelete: () => void
  onSave: () => void
  onOpenCopilot: () => void
}

export function MeetingMinutesHeader({
  minuteId,
  hasEditAccess,
  isSaving,
  onBack,
  onDelete,
  onSave,
  onOpenCopilot
}: MeetingMinutesHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-app-border shrink-0 bg-white dark:bg-app-card z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-app-bg border border-app-border hover:bg-app-hover rounded-lg transition-colors text-app-muted hover:text-app-fg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-app-fg leading-tight">
            {minuteId ? 'Meeting Record' : 'New Meeting Record'}
          </h2>
          <p className="text-xs text-app-muted font-medium mt-0.5">Capture discussions, attendees, and tasks.</p>
        </div>
      </div>
      
      {hasEditAccess && (
        <div className="flex items-center gap-3">
          {minuteId && (
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="p-2 text-red-500 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-lg transition-colors shadow-sm"
              title="Delete Meeting Minutes"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onOpenCopilot}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" /> Praz-AI
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Record
          </button>
        </div>
      )}
    </div>
  )
}
