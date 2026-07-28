'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, Loader2, ChevronRight, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { MeetingMinutesEditor } from './MeetingMinutesEditor'

interface MeetingMinutesListProps {
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function MeetingMinutesList({ projectId, hasEditAccess, onShowToast }: MeetingMinutesListProps) {
  const [minutes, setMinutes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMinuteId, setActiveMinuteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMinutes()
  }, [projectId])

  const fetchMinutes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('id, meeting_date, discussion_notes')
      .eq('project_id', projectId)
      .order('meeting_date', { ascending: false })

    if (error) {
      console.error('Error fetching meeting minutes:', error)
      onShowToast?.('error', 'Failed to load meeting minutes')
    } else {
      setMinutes(data || [])
    }
    setIsLoading(false)
  }

  if (activeMinuteId || isCreating) {
    return (
      <MeetingMinutesEditor
        projectId={projectId}
        minuteId={activeMinuteId}
        hasEditAccess={hasEditAccess}
        onBack={() => {
          setActiveMinuteId(null)
          setIsCreating(false)
          fetchMinutes()
        }}
        onShowToast={onShowToast}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-app-bg text-app-fg">
      <div className="flex items-center justify-between p-6 border-b border-app-border shrink-0">
        <div>
          <h2 className="text-lg font-bold">Meeting Minutes</h2>
          <p className="text-sm text-app-muted mt-1">Record meeting notes, attendees, and decisions.</p>
        </div>
        {hasEditAccess && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Meeting
          </button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-app-muted" />
          </div>
        ) : minutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-app-border rounded-2xl bg-app-card/50">
            <FileText className="w-8 h-8 text-app-muted mb-3" />
            <p className="text-app-muted text-sm font-medium">No meeting minutes recorded yet.</p>
            {hasEditAccess && (
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 text-indigo-500 hover:text-indigo-400 font-semibold text-sm transition-colors"
              >
                Record your first meeting
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {minutes.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMinuteId(m.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-app-card border border-app-border rounded-xl hover:border-indigo-500/50 hover:shadow-md transition-all text-left group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    {new Date(m.meeting_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <p className="text-sm text-app-muted line-clamp-1 mt-1 max-w-xl">
                    {m.discussion_notes || 'No discussion notes'}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-indigo-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
