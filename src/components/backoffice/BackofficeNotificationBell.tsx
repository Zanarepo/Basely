'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { 
  getBackofficeNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '@/lib/backoffice/notifications-actions'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  organization_id: string | null
  organizations: { name: string } | null
}

export function BackofficeNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    async function fetchNotifications() {
      const data = await getBackofficeNotifications()
      setNotifications(data as any)
      setLoading(false)
    }
    fetchNotifications()

    // Optionally set up real-time polling here, e.g. every 60s
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await markNotificationRead(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await markAllNotificationsRead()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-app-surface"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-app-surface border border-app-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-app-border flex items-center justify-between bg-app-surface-solid">
              <h3 className="font-semibold text-app-fg text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-app-muted text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-app-hover flex items-center justify-center">
                    <Bell className="w-5 h-5 text-app-muted opacity-50" />
                  </div>
                  <p className="text-sm text-app-muted">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-app-border">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover:bg-app-hover/50 transition-colors ${!notification.is_read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-semibold text-app-fg">
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-app-muted whitespace-nowrap ml-2">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-app-muted mt-1 leading-relaxed">
                            {notification.message}
                          </p>

                          {notification.organizations?.name && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-app-surface-solid border border-app-border text-xs font-medium text-app-muted">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {notification.organizations.name}
                            </div>
                          )}
                        </div>

                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="p-1 rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex-shrink-0 self-start"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t border-app-border bg-app-surface-solid">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-1.5 text-xs font-medium text-app-muted hover:text-app-fg transition-colors text-center"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
