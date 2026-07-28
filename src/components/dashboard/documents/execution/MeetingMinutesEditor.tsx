'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus, Loader2, Calendar as CalendarIcon, Users, Trash2, CheckCircle2, Check, AlignLeft, ListTodo } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { createMeetingMinute, updateMeetingMinute, deleteMeetingMinute } from '@/lib/actions/meeting-minutes'
import { ActionItemModal } from '@/components/dashboard/action-items/ActionItemModal'

interface MeetingMinutesEditorProps {
  projectId: string
  minuteId: string | null
  hasEditAccess: boolean
  onBack: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function MeetingMinutesEditor({ projectId, minuteId, hasEditAccess, onBack, onShowToast }: MeetingMinutesEditorProps) {
  const [isLoading, setIsLoading] = useState(!!minuteId)
  const [isSaving, setIsSaving] = useState(false)
  
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().substring(0, 16))
  const [attendees, setAttendees] = useState<string[]>([])
  const [discussionNotes, setDiscussionNotes] = useState('')
  const [decisions, setDecisions] = useState<any[]>([])
  const [actionItems, setActionItems] = useState<any[]>([])

  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchStakeholders()
    if (minuteId) {
      fetchMinuteDetails()
    }
  }, [projectId, minuteId])

  const fetchStakeholders = async () => {
    const { data } = await supabase
      .from('stakeholders')
      .select('id, name, role_title')
      .eq('project_id', projectId)
    if (data) setStakeholders(data)
  }

  const fetchMinuteDetails = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('id', minuteId)
      .single()

    const itemsRes = await supabase
      .from('action_items')
      .select('*, owner:stakeholders(name)')
      .eq('source_meeting_minutes_id', minuteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching minute:', error)
      onShowToast?.('error', 'Failed to load meeting minute details')
      onBack()
    } else if (data) {
      setMeetingDate(new Date(data.meeting_date).toISOString().substring(0, 16))
      setAttendees(data.attendee_stakeholder_ids || [])
      setDiscussionNotes(data.discussion_notes || '')
      setDecisions(data.decisions || [])
    }
    
    if (itemsRes.data) {
      setActionItems(itemsRes.data)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const dateObj = new Date(meetingDate)

    const payload = {
      meeting_date: dateObj.toISOString(),
      attendee_stakeholder_ids: attendees,
      discussion_notes: discussionNotes,
      decisions: decisions
    }

    if (minuteId) {
      const res = await updateMeetingMinute(minuteId, projectId, payload)
      if (res.success) {
        onShowToast?.('success', 'Meeting minutes updated')
      } else {
        onShowToast?.('error', res.error || 'Failed to update')
      }
    } else {
      const res = await createMeetingMinute(projectId, payload)
      if (res.success) {
        onShowToast?.('success', 'Meeting minutes created')
        onBack()
      } else {
        onShowToast?.('error', res.error || 'Failed to create')
      }
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!minuteId) return
    if (!confirm('Are you sure you want to delete this meeting minute? This cannot be undone.')) return
    
    setIsSaving(true)
    const res = await deleteMeetingMinute(minuteId, projectId)
    if (res.success) {
      onShowToast?.('success', 'Meeting minutes deleted')
      onBack()
    } else {
      onShowToast?.('error', res.error || 'Failed to delete')
      setIsSaving(false)
    }
  }

  const toggleAttendee = (id: string) => {
    if (!hasEditAccess) return
    if (attendees.includes(id)) {
      setAttendees(attendees.filter(a => a !== id))
    } else {
      setAttendees([...attendees, id])
    }
  }

  const addDecision = () => {
    setDecisions([...decisions, { id: crypto.randomUUID(), text: '' }])
  }

  const updateDecision = (id: string, text: string) => {
    setDecisions(decisions.map(d => d.id === id ? { ...d, text } : d))
  }

  const removeDecision = (id: string) => {
    setDecisions(decisions.filter(d => d.id !== id))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-app-bg text-app-fg overflow-hidden relative">
      
      {/* Sticky Header */}
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
                onClick={handleDelete}
                disabled={isSaving}
                className="p-2 text-red-500 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-lg transition-colors shadow-sm"
                title="Delete Meeting Minutes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-md disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Record
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          
          {/* Metadata Section */}
          <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50">
              <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" /> General Details
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Date Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={!hasEditAccess}
                  className="bg-app-bg border border-app-border rounded-lg px-4 py-2.5 text-sm font-medium text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                />
              </div>

              {/* Enhanced Attendees List */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center justify-between">
                  <span>Attendees</span>
                  <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                    {attendees.length} selected
                  </span>
                </label>
                
                <div className="border border-app-border rounded-lg bg-app-bg overflow-hidden flex flex-col h-48 shadow-inner">
                  {stakeholders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-app-muted">
                      <Users className="w-6 h-6 mb-2 opacity-50" />
                      <span className="text-xs font-medium">No stakeholders available.</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      {stakeholders.map(s => {
                        const isSelected = attendees.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleAttendee(s.id)}
                            className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 border-app-border transition-colors ${
                              hasEditAccess ? 'cursor-pointer hover:bg-app-hover' : ''
                            } ${isSelected ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected 
                                ? 'bg-indigo-500 border-indigo-500 text-white' 
                                : 'bg-white dark:bg-app-card border-app-border'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-fg'}`}>
                                {s.name}
                              </span>
                              <span className="text-xs text-app-muted truncate font-medium">
                                {s.role_title || 'No specified role'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Discussion Notes Section */}
          <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50">
              <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-indigo-500" /> Discussion Notes & Agenda
              </h3>
            </div>
            <textarea
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              disabled={!hasEditAccess}
              className="w-full bg-transparent border-none p-6 text-sm text-app-fg focus:outline-none focus:ring-0 min-h-[300px] resize-y placeholder:text-app-muted/50 leading-relaxed"
              placeholder="Start typing your meeting notes here..."
            />
          </section>

          {/* Decisions Section */}
          <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Decisions Made
              </h3>
              {hasEditAccess && (
                <button
                  onClick={addDecision}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-app-bg border border-app-border hover:bg-gray-50 dark:hover:bg-app-hover rounded-md transition-colors text-xs font-bold text-app-fg shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Decision
                </button>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {decisions.length === 0 ? (
                  <div className="py-8 border-2 border-dashed border-app-border rounded-xl text-center text-sm font-medium text-app-muted">
                    No decisions recorded yet.
                  </div>
                ) : (
                  decisions.map((d, index) => (
                    <div key={d.id} className="flex items-start gap-3 group">
                      <div className="mt-2.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500/80" />
                      </div>
                      <div className="flex-1 bg-app-bg border border-app-border rounded-lg overflow-hidden flex items-center focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
                        <input
                          type="text"
                          value={d.text}
                          onChange={(e) => updateDecision(d.id, e.target.value)}
                          disabled={!hasEditAccess}
                          placeholder="e.g. Approved $5k extra budget for QA servers"
                          className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium text-app-fg focus:outline-none"
                        />
                        {hasEditAccess && (
                          <button
                            onClick={() => removeDecision(d.id)}
                            className="p-3 text-app-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
          
          {/* Action Items / Follow-up Section */}
          {minuteId && (
            <section className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl shadow-sm overflow-hidden mb-12">
              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200/50 dark:border-indigo-500/20">
                <div>
                  <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-1">
                    <ListTodo className="w-4 h-4" /> Action Items & Follow-ups
                  </h3>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 font-medium">
                    Create tasks directly linked to this meeting to ensure follow-through.
                  </p>
                </div>
                {hasEditAccess && (
                  <button
                    onClick={() => setIsSpawnModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> New Action Item
                  </button>
                )}
              </div>
              
              {/* Render existing action items for this meeting */}
              <div className="p-6 flex flex-col gap-3">
                {actionItems.length === 0 ? (
                  <div className="py-6 text-center text-sm font-medium text-indigo-900/50 dark:text-indigo-300/50">
                    No action items have been created for this meeting yet.
                  </div>
                ) : (
                  actionItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-app-card border border-app-border rounded-lg p-4 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-app-fg text-sm">{item.description}</span>
                        <div className="flex items-center gap-4 mt-1 text-xs text-app-muted font-medium">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> 
                            {item.owner?.name || 'Unassigned'}
                          </span>
                          {item.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

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
    </div>
  )
}
