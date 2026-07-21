'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, AppNotification } from '@/lib/notifications/actions'
import { createClient } from '@/utils/supabase/client'

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data)
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Setup realtime subscription
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isMounted = true

    const initRealtime = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user || !isMounted) return
      
      const userId = data.user.id
      const channelName = `notifications_${userId}_${Math.random().toString(36).substring(7)}`
      channel = supabase.channel(channelName)
      
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as AppNotification
          setNotifications(prev => [newNotif, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      ).subscribe()
    }
    
    initRealtime()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnreadCount(0)
    await markAllAsRead()
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh: fetchNotifications
  }
}
