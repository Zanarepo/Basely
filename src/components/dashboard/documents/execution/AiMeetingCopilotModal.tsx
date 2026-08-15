'use client'

import React, { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { extractMeetingNotesWithAiAction, ExtractedMeetingData } from '@/lib/documents/ai-meeting-actions'

interface AiMeetingCopilotModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onExtractionComplete: (data: ExtractedMeetingData) => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function AiMeetingCopilotModal({ isOpen, onClose, projectId, onExtractionComplete, onShowToast }: AiMeetingCopilotModalProps) {
  const [rawNotes, setRawNotes] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)

  if (!isOpen) return null

  const handleExtract = async () => {
    if (!rawNotes.trim()) {
      onShowToast?.('error', 'Please enter some notes to extract.')
      return
    }

    setIsExtracting(true)
    const res = await extractMeetingNotesWithAiAction(projectId, rawNotes)
    setIsExtracting(false)

    if (res.ok && res.data) {
      onShowToast?.('success', 'Successfully extracted meeting details!')
      onExtractionComplete(res.data)
      setRawNotes('')
      onClose()
    } else {
      onShowToast?.('error', res.error || 'Failed to extract meeting notes.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-gray-50 dark:bg-app-bg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h3 className="font-bold text-app-fg text-lg leading-tight">Meeting to Action Praz-AI</h3>
              <p className="text-xs text-app-muted font-medium">Paste raw notes or transcript</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-hover rounded-lg transition-colors text-app-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste your Zoom transcript, messy bullet points, or raw meeting notes here..."
            className="w-full h-64 bg-app-bg border border-app-border rounded-xl p-4 text-sm font-medium text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            disabled={isExtracting}
          />
          <div className="text-xs text-app-muted bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            Praz-AI will automatically extract discussion points, map attendees to project stakeholders, log decisions, and generate action items.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border bg-gray-50 dark:bg-app-bg flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExtracting}
            className="px-4 py-2 font-semibold text-sm text-app-muted hover:text-app-fg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExtract}
            disabled={isExtracting || !rawNotes.trim()}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all font-semibold text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-Extract Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
