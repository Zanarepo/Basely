import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getWidgetConversationsAction, getWidgetMessagesAction } from '@/lib/support/actions'

export function useGlobalSupportWidget(mode: 'admin' | 'tenant') {
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string; ticket: any } | null>(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const latestSeenTimestampRef = useRef<number>(Date.now())
  const soundPlayedRef = useRef<Record<string, boolean>>({})

  const playNotificationSound = () => {
    if (isMuted) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12) // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    } catch (e) {
      console.error('Audio synthesizer error:', e)
    }
  }

  const loadConversations = async () => {
    try {
      const { user, tickets: loadedTickets } = await getWidgetConversationsAction(mode, {
        status: statusFilter,
        priority: priorityFilter
      })
      if (user) setUserId(user.id)
      if (loadedTickets) {
        setTickets(loadedTickets)

        let newIncomingFound = false
        loadedTickets.forEach((t: any) => {
          const msg = t.latestMessage
          if (msg && msg.created_at) {
            const msgTime = new Date(msg.created_at).getTime()
            if (msgTime > latestSeenTimestampRef.current && !soundPlayedRef.current[msg.id]) {
              const isFromMe = msg.sender_id === user?.id || (mode === 'admin' ? msg.is_staff_reply === true : msg.is_staff_reply === false)
              if (!isFromMe) {
                newIncomingFound = true
                soundPlayedRef.current[msg.id] = true
                latestSeenTimestampRef.current = msgTime
                setUnreadCount(prev => prev + 1)
                setToastNotification({
                  title: `New Message in ${t.organizations?.name || 'Support'}`,
                  body: `${msg.sender_name || 'Customer'}: ${msg.message}`,
                  ticket: t
                })
              }
            }
          }
        })

        if (newIncomingFound) {
          playNotificationSound()
        }
      }
    } catch (e: any) {
      if (!e?.message?.includes('unexpected response')) {
        console.warn('Failed to load support conversations:', e?.message || e)
      }
    }
  }

  useEffect(() => {
    loadConversations()

    const supabase = createClient()
    const channel = supabase
      .channel(`support-widget-${mode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_ticket_messages' },
        (payload) => {
          loadConversations()
        }
      )
      .subscribe()

    const interval = setInterval(loadConversations, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [mode, selectedTicket?.id, statusFilter, priorityFilter])

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket)
    setLoadingMessages(true)
    try {
      const msgs = await getWidgetMessagesAction(ticket.id, mode)
      setSelectedMessages(msgs)
      setUnreadCount(0)
    } catch (e) {
      console.error('Failed to load messages for widget:', e)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleToastClick = () => {
    if (toastNotification?.ticket) {
      handleSelectTicket(toastNotification.ticket)
    }
    setToastNotification(null)
    setIsOpen(true)
  }

  return {
    isOpen, setIsOpen,
    userId,
    tickets,
    selectedTicket, setSelectedTicket,
    selectedMessages,
    loadingMessages,
    unreadCount, setUnreadCount,
    isMuted, setIsMuted,
    toastNotification, setToastNotification,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    handleSelectTicket,
    handleToastClick
  }
}
