'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useCalendarSync } from './hooks/useCalendarSync'
import { createClient } from '@/utils/supabase/client'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

export default function CalendarSyncSettings({ projectId }: { projectId?: string }) {
  const { connections, isLoading, isSaving, toggleProjectSync, disconnectCalendar } = useCalendarSync()
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    // Check for connection success in URL
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('success') === 'true') {
      showToast('success', 'Google Calendar connected successfully!')
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    async function loadProjects() {
      const supabase = createClient()
      const { data } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false })
      if (data) setProjects(data)
    }
    loadProjects()
  }, [])

  const handleConnectGoogle = () => {
    setIsConnecting(true)
    let url = '/api/integrations/calendar/google/connect'
    if (projectId) {
      url += `?projectId=${projectId}`
    }
    window.location.href = url
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/integrations/calendar/sync?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        showToast('success', 'Milestones synced to Google Calendar!')
      } else {
        showToast('error', 'Failed to sync milestones.')
      }
    } catch (e) {
      console.error(e)
      showToast('error', 'An unexpected error occurred during sync.')
    } finally {
      setIsSyncing(false)
    }
  }

  const hasGoogleConnection = connections.some(c => c.provider === 'google')
  const googleConnection = connections.find(c => c.provider === 'google')

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="space-y-6 w-full">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div>
        <h2 className="text-lg font-medium text-app-fg">Calendar Synchronization</h2>
        <p className="text-sm text-app-muted mt-1">
          Connect your calendar to automatically sync project milestones and deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Google Calendar Card */}
        <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-app-fg">Google Calendar</h3>
                <p className="text-xs text-app-muted">Sync milestones & events</p>
              </div>
            </div>
            {hasGoogleConnection ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Not Connected
              </span>
            )}
          </div>

          <div className="flex-1">
            {hasGoogleConnection && googleConnection ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-app-fg mb-2">Synced Projects</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {projects.map(project => {
                    const isSynced = googleConnection.synced_project_ids?.includes(project.id)
                    return (
                      <label key={project.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-muted-surface/50 cursor-pointer border border-transparent hover:border-app-border/50 transition-colors">
                        <span className="text-sm text-app-fg/90 truncate mr-4">{project.name}</span>
                        <input 
                          type="checkbox" 
                          className="rounded border-app-border text-indigo-600 focus:ring-indigo-500"
                          checked={isSynced}
                          disabled={isSaving}
                          onChange={(e) => toggleProjectSync(googleConnection.id, project.id, e.target.checked)}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-app-muted">
                Connect your Google account to automatically push project milestones to your primary calendar.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-app-border flex items-center justify-between gap-3">
            {hasGoogleConnection && googleConnection ? (
              <>
                <button
                  onClick={() => disconnectCalendar(googleConnection.id)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Disconnect
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} 
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-app-fg text-app-bg hover:opacity-90 rounded-lg text-sm font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
