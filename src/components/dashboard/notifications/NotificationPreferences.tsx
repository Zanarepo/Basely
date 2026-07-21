'use client'

import { useState, useEffect } from 'react'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications/actions'
import { Loader2, Mail, Hash, Save, BellRing } from 'lucide-react'

export function NotificationPreferences() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const prefs = await getNotificationPreferences()
      if (prefs) {
        setEmailEnabled(prefs.email_enabled)
        setSlackEnabled(prefs.slack_enabled)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    const ok = await updateNotificationPreferences(emailEnabled, slackEnabled)
    setSaving(false)
    if (ok) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <BellRing className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-app-fg">Notification Preferences</h3>
          <p className="text-sm text-app-subtle">Choose where you want to receive project updates.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* In-App Notice */}
        <div className="p-4 bg-app-surface-hover rounded-lg border border-app-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-app-fg">In-App Notifications</p>
              <p className="text-xs text-app-subtle mt-1">
                You will always receive notifications within the application (via the Bell icon). This cannot be disabled.
              </p>
            </div>
            <div className="h-5 w-10 bg-indigo-500 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-70">
              <div className="h-3 w-3 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between group p-3 -mx-3 rounded-xl hover:bg-app-hover transition-colors">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-app-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-app-fg">Email Notifications</p>
              <p className="text-xs text-app-subtle mt-1 max-w-sm">
                Receive important updates, mentions, and assignments directly to your registered email address.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailEnabled}
            onClick={() => setEmailEnabled(!emailEnabled)}
            className={`h-5 w-10 rounded-full flex items-center px-1 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 ${
              emailEnabled ? 'bg-indigo-500 justify-end' : 'bg-app-border justify-start'
            }`}
          >
            <div className="h-3 w-3 bg-white rounded-full shadow-sm"></div>
          </button>
        </div>

        {/* Slack */}
        <div className="flex items-center justify-between group p-3 -mx-3 rounded-xl hover:bg-app-hover transition-colors">
          <div className="flex gap-3">
            <Hash className="h-5 w-5 text-app-muted mt-0.5" />
            <div>
              <p className="text-sm font-medium text-app-fg">Slack Notifications</p>
              <p className="text-xs text-app-subtle mt-1 max-w-sm">
                Receive notifications in Slack. (Requires workspace admin to configure the Slack integration).
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={slackEnabled}
            onClick={() => setSlackEnabled(!slackEnabled)}
            className={`h-5 w-10 rounded-full flex items-center px-1 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 ${
              slackEnabled ? 'bg-indigo-500 justify-end' : 'bg-app-border justify-start'
            }`}
          >
            <div className="h-3 w-3 bg-white rounded-full shadow-sm"></div>
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-app-border flex items-center justify-end gap-4 group p-4 -mx-4 rounded-xl hover:bg-app-hover transition-colors">
        {saveSuccess && (
          <span className="text-sm text-emerald-500 font-medium">Preferences saved!</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </button>
      </div>
    </div>
  )
}
