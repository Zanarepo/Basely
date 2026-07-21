'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Bell, Check, AtSign, User, AlertTriangle, DollarSign, Calendar, FileText, Activity } from 'lucide-react'
import { useNotifications } from './useNotifications'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { createPortal } from 'react-dom'

type NotificationCenterProps = {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const getIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'mention': return <AtSign className="h-4 w-4 text-blue-500" />
      case 'assignment': return <User className="h-4 w-4 text-purple-500" />
      case 'risk_change': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'cost_change': return <DollarSign className="h-4 w-4 text-green-500" />
      case 'schedule_change': return <Calendar className="h-4 w-4 text-indigo-500" />
      case 'document_change': return <FileText className="h-4 w-4 text-sky-500" />
      case 'status_report': return <Activity className="h-4 w-4 text-emerald-500" />
      default: return <Bell className="h-4 w-4 text-app-subtle" />
    }
  }

  const getLink = (notif: any) => {
    if (!notif.project_id) return '/dashboard'
    let base = `/dashboard/projects/${notif.project_id}`
    switch (notif.reference_entity_type) {
      case 'wbs': return `${base}?tab=wbs&elementId=${notif.reference_entity_id}`
      case 'risk': return `${base}?tab=risks&riskId=${notif.reference_entity_id}`
      case 'issue': return `${base}?tab=risks&issueId=${notif.reference_entity_id}`
      case 'document': return `${base}?tab=documents`
      case 'activity': return `${base}?tab=wbs&elementId=${notif.reference_entity_id}`
      default: return base
    }
  }

  return createPortal(
    <>
      {/* Backdrop overlay for click-outside to close */}
      <div 
        className="fixed inset-0 bg-black/5 dark:bg-black/40 z-30 animate-in fade-in duration-200 cursor-pointer"
        onClick={onClose}
      />

      {/* Side Sheet Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-app-surface border-l border-app-border shadow-2xl flex flex-col z-40 animate-in slide-in-from-right-8 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface-solid">
          <h3 className="font-semibold text-lg text-app-fg">Notifications</h3>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-app-subtle hover:text-app-fg flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-app-subtle text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <Bell className="h-10 w-10 text-app-subtle/30 mb-3" />
              <p className="text-app-fg font-medium">All caught up!</p>
              <p className="text-app-subtle text-sm mt-1">You have no new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {notifications.map((notif) => {
                const isUnread = !notif.read_at
                return (
                  <Link
                    key={notif.id}
                    href={getLink(notif)}
                    onClick={() => {
                      if (isUnread) markAsRead(notif.id)
                      onClose()
                    }}
                    className={`block p-5 hover:bg-app-surface-hover transition-colors ${isUnread ? 'bg-indigo-500/5' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 mt-1">
                        {getIcon(notif.trigger_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isUnread ? 'text-app-fg font-medium' : 'text-app-subtle'}`}>
                          {notif.content_summary}
                        </p>
                        <p className="text-xs text-app-subtle mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shadow-sm shadow-indigo-500/50" />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-app-border bg-app-surface-solid text-center">
          <Link 
            href="/dashboard/settings?tab=notifications" 
            onClick={onClose}
            className="text-sm text-indigo-500 hover:text-indigo-400 font-medium flex items-center justify-center gap-2"
          >
            Notification Settings
          </Link>
        </div>
      </div>
    </>,
    document.body
  )
}
