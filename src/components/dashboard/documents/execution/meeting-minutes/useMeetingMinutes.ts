import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { createMeetingMinute, updateMeetingMinute, deleteMeetingMinute } from '@/lib/actions/meeting-minutes'
import { createActionItem } from '@/lib/actions/action-items'
import { ExtractedMeetingData } from '@/lib/documents/ai-meeting-actions'

export interface UseMeetingMinutesProps {
  projectId: string
  minuteId: string | null
  hasEditAccess: boolean
  onBack: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function useMeetingMinutes({ projectId, minuteId, hasEditAccess, onBack, onShowToast }: UseMeetingMinutesProps) {
  const [isLoading, setIsLoading] = useState(!!minuteId)
  const [isSaving, setIsSaving] = useState(false)
  
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().substring(0, 16))
  const [attendees, setAttendees] = useState<string[]>([])
  const [discussionNotes, setDiscussionNotes] = useState('')
  const [decisions, setDecisions] = useState<any[]>([])
  const [actionItems, setActionItems] = useState<any[]>([])
  const [pendingActionItems, setPendingActionItems] = useState<any[]>([])

  const [stakeholders, setStakeholders] = useState<any[]>([])
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
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

  const handleCopilotComplete = (data: ExtractedMeetingData) => {
    if (data.discussionNotes) setDiscussionNotes(data.discussionNotes)
    if (data.attendees && data.attendees.length > 0) {
      setAttendees(prev => Array.from(new Set([...prev, ...data.attendees])))
    }
    if (data.decisions && data.decisions.length > 0) {
      const newDecisions = data.decisions.map(d => ({ id: crypto.randomUUID(), text: d.text }))
      setDecisions(prev => [...prev, ...newDecisions])
    }
    if (data.actionItems && data.actionItems.length > 0) {
      const pending = data.actionItems.map(item => ({
        id: 'temp-' + crypto.randomUUID(),
        description: item.description,
        owner_stakeholder_id: item.owner_stakeholder_id,
        status: 'open',
        owner: stakeholders.find(s => s.id === item.owner_stakeholder_id) || null
      }))
      setPendingActionItems(prev => [...prev, ...pending])
    }
  }

  const savePendingActionItems = async (mId: string) => {
    if (pendingActionItems.length === 0) return
    await Promise.all(
      pendingActionItems.map((item) =>
        createActionItem(projectId, {
          description: item.description,
          owner_stakeholder_id: item.owner_stakeholder_id,
          source_meeting_minutes_id: mId
        })
      )
    )
    setPendingActionItems([])
  }

  const updatePendingActionItem = (id: string, updates: any) => {
    setPendingActionItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const removePendingActionItem = (id: string) => {
    setPendingActionItems(prev => prev.filter(item => item.id !== id))
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
        await savePendingActionItems(minuteId)
        onShowToast?.('success', 'Meeting minutes updated')
        if (pendingActionItems.length > 0) fetchMinuteDetails()
      } else {
        onShowToast?.('error', res.error || 'Failed to update')
      }
    } else {
      const res = await createMeetingMinute(projectId, payload)
      if (res.success && res.data) {
        await savePendingActionItems(res.data.id)
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

  return {
    // State
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
    
    // Setters
    setMeetingDate,
    setDiscussionNotes,
    setIsSpawnModalOpen,
    setIsCopilotOpen,
    
    // Handlers
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
  }
}
