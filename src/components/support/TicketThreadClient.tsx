'use client'

import { useState, useEffect, useRef } from 'react'
import { addTicketMessageAction } from '@/lib/support/actions'
import { createClient } from '@/utils/supabase/client'
import { Send } from 'lucide-react'

interface TicketThreadClientProps {
  ticketId: string
  messages: any[]
  currentUserId: string
  isClosed: boolean
  viewType?: 'admin' | 'tenant'
  isStaffReply?: boolean
  customerHeaderName?: string
}

export function TicketThreadClient({ 
  ticketId, 
  messages: initialMessages, 
  currentUserId, 
  isClosed,
  viewType = 'tenant',
  isStaffReply = false,
  customerHeaderName
}: TicketThreadClientProps) {
  const [threadMessages, setThreadMessages] = useState<any[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setThreadMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    scrollToBottom()
  }, [threadMessages, mounted])

  useEffect(() => {
    // 1. Instant WebSocket Realtime subscription
    const channel = supabase
      .channel(`ticket-thread-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          const newMsg = payload.new
          setThreadMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || (m.temp_id && m.message === newMsg.message && m.sender_id === newMsg.sender_id))) {
              return prev.map(m => (m.temp_id && m.message === newMsg.message) ? { ...newMsg, sender: m.sender } : m)
            }
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    // 2. Guaranteed background synchronization interval every 2.5 seconds (in case WebSocket is dropped or blocked)
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setThreadMessages((prev) => {
          const prevNonTemp = prev.filter(m => !m.temp_id)
          // If server count differs or latest ID changed, merge cleanly
          if (data.length !== prevNonTemp.length || data[data.length - 1].id !== prevNonTemp[prevNonTemp.length - 1]?.id) {
            const tempMsgs = prev.filter(m => m.temp_id && !data.some(d => d.message === m.message && d.sender_id === m.sender_id))
            return [...data, ...tempMsgs]
          }
          return prev
        })
      }
    }, 2500)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [ticketId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const tempMsg = {
      id: `temp-${Date.now()}`,
      temp_id: true,
      ticket_id: ticketId,
      sender_id: currentUserId,
      message: message.trim(),
      created_at: new Date().toISOString(),
      is_staff_reply: isStaffReply,
      sender: { full_name: 'You' }
    }

    setThreadMessages(prev => [...prev, tempMsg])
    const sentText = message.trim()
    setMessage('')
    setLoading(true)

    try {
      await addTicketMessageAction(ticketId, sentText, isStaffReply)
    } catch (err: any) {
      alert(err.message)
      setThreadMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally {
      setLoading(false)
    }
  }

  // Determine if a message belongs on the right side of the screen based on viewType
  const checkIsRightSide = (msg: any) => {
    if (typeof msg.is_staff_reply === 'boolean') {
      if (viewType === 'admin') {
        return msg.is_staff_reply === true // On admin view, staff messages are on right
      } else {
        return msg.is_staff_reply === false // On tenant view, tenant messages are on right
      }
    }
    // Fallback for old messages without is_staff_reply column
    return msg.sender_id === currentUserId
  }

  const getSenderInfo = (msg: any, isRightSide: boolean) => {
    if (msg.temp_id || isRightSide) {
      return { name: 'You', role: null }
    }
    
    // In admin view, left side is ALWAYS the customer. Prioritize the custom header if provided.
    if (viewType === 'admin') {
      if (customerHeaderName) {
        return { name: customerHeaderName, role: null }
      }
      return { name: msg.sender_name || msg.sender?.full_name || 'Organization Customer', role: null }
    }

    // In tenant view, left side is the support team
    if (msg.sender_name || msg.sender_role) {
      return { 
        name: msg.sender_name || 'Support Team',
        role: msg.sender_role && msg.sender_role !== 'Customer' ? msg.sender_role : null
      }
    }
    return { name: msg.sender?.full_name || 'Support Team', role: null }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-app-surface/30 min-h-0">
        {threadMessages.map(msg => {
          const isRightSide = checkIsRightSide(msg)
          const senderInfo = getSenderInfo(msg, isRightSide)

          return (
            <div key={msg.id} className={`flex ${isRightSide ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                isRightSide 
                  ? 'bg-app-accent text-app-accent-fg rounded-tr-sm' 
                  : 'bg-app-surface border border-app-border text-app-fg rounded-tl-sm'
              }`}>
                {!isRightSide && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {senderInfo.name}
                    </span>
                    {senderInfo.role && (
                      <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide uppercase">
                        {senderInfo.role}
                      </span>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm font-medium">{msg.message}</div>
                <div className={`text-[10px] mt-2 text-right ${isRightSide ? 'opacity-70' : 'opacity-50'}`}>
                  {mounted ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          )
        })}
        {threadMessages.length === 0 && (
          <div className="text-center text-app-muted py-12 text-sm font-medium">No follow-up replies yet. Type a message below to reply and chat directly with support.</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-app-card border-t border-app-border shrink-0">
        {isClosed ? (
          <div className="text-center text-sm font-bold text-app-muted py-4">
            This ticket is closed. Please open a new ticket if you need further assistance.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message to reply..."
              className="flex-1 bg-app-surface border border-app-border rounded-lg px-4 py-2 text-app-fg focus:outline-none focus:border-app-accent transition-colors text-sm font-medium"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
