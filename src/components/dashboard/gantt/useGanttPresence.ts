import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type LiveUser = {
  userId: string
  name: string
  color: string
  x: number
  y: number
}

// Generate a consistent color based on user ID
function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

export function useGanttPresence(projectId: string, currentUserId: string, currentUserName: string) {
  const [activeUsers, setActiveUsers] = useState<LiveUser[]>([])
  const [showCursors, setShowCursors] = useState(true)
  const [lockedActivities, setLockedActivities] = useState<{ [activityId: string]: string }>({})
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const usersRef = useRef<{ [key: string]: LiveUser }>({})
  const locksRef = useRef<{ [activityId: string]: string }>({})
  const lastSendTime = useRef<number>(0)
  
  const userColor = useRef(stringToColor(currentUserId)).current

  // Load user preference for cursors
  useEffect(() => {
    const saved = localStorage.getItem('project_management_show_cursors')
    if (saved !== null) {
      setShowCursors(saved === 'true')
    }
  }, [])

  const toggleCursors = () => {
    const next = !showCursors
    setShowCursors(next)
    localStorage.setItem('project_management_show_cursors', String(next))
  }

  useEffect(() => {
    if (!projectId || !currentUserId) return

    const supabase = createClient()
    const channel = supabase.channel(`gantt_presence:${projectId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const newUsers: { [key: string]: LiveUser } = {}
        
        for (const id of Object.keys(state)) {
          if (id === currentUserId) continue // Skip self
          
          const presenceData = state[id]![0] as any
          newUsers[id] = {
            userId: id,
            name: presenceData.name || 'Unknown',
            color: stringToColor(id),
            x: usersRef.current[id]?.x || -100, // Default offscreen
            y: usersRef.current[id]?.y || -100,
          }
        }
        
        usersRef.current = newUsers
        setActiveUsers(Object.values(newUsers))
      })
      .on('broadcast', { event: 'cursor-move' }, (payload) => {
        const { userId, x, y } = payload.payload
        if (userId === currentUserId || !usersRef.current[userId]) return
        
        usersRef.current[userId] = { ...usersRef.current[userId]!, x, y }
        setActiveUsers(Object.values(usersRef.current))
      })
      .on('broadcast', { event: 'lock-activity' }, (payload) => {
        const { userId, activityId } = payload.payload
        if (userId === currentUserId) return
        locksRef.current = { ...locksRef.current, [activityId]: userId }
        setLockedActivities(locksRef.current)
      })
      .on('broadcast', { event: 'unlock-activity' }, (payload) => {
        const { userId, activityId } = payload.payload
        if (userId === currentUserId) return
        const newLocks = { ...locksRef.current }
        delete newLocks[activityId]
        locksRef.current = newLocks
        setLockedActivities(locksRef.current)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: currentUserName,
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, currentUserId, currentUserName])

  // Mouse move listener
  useEffect(() => {
    if (!channelRef.current || !showCursors) return

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSendTime.current > 33) {
        lastSendTime.current = now
        channelRef.current!.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: { userId: currentUserId, x: e.clientX, y: e.clientY }
        }).catch(() => {})
      }
    }

    const handleMouseLeave = () => {
      channelRef.current!.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: { userId: currentUserId, x: -100, y: -100 }
      }).catch(() => {})
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [currentUserId, showCursors])

  const acquireLock = (activityId: string) => {
    locksRef.current = { ...locksRef.current, [activityId]: currentUserId }
    setLockedActivities(locksRef.current)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'lock-activity',
      payload: { userId: currentUserId, activityId }
    })
  }

  const releaseLock = (activityId: string) => {
    const newLocks = { ...locksRef.current }
    delete newLocks[activityId]
    locksRef.current = newLocks
    setLockedActivities(locksRef.current)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'unlock-activity',
      payload: { userId: currentUserId, activityId }
    })
  }

  return {
    activeUsers,
    showCursors,
    toggleCursors,
    lockedActivities,
    acquireLock,
    releaseLock
  }
}
