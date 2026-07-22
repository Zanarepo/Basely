'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, MessageSquare, Send } from 'lucide-react'
import { createClient } from '../../../utils/supabase/client'
import { testSlackWebhook } from '../../../lib/integrations/slack-actions'

export default function ProjectSlackSettings({
  projectId,
}: {
  projectId: string
}) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from('projects')
        .select('slack_webhook_url')
        .eq('id', projectId)
        .single()

      if (data && !error) {
        setWebhookUrl(data.slack_webhook_url || '')
      }
      setIsLoading(false)
    }
    loadSettings()
  }, [projectId, supabase])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(false)

    const { error } = await supabase
      .from('projects')
      .update({ slack_webhook_url: webhookUrl || null })
      .eq('id', projectId)

    setIsSaving(false)
    if (error) {
      setSaveError(true)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleTest = async () => {
    if (!webhookUrl) return
    setIsTesting(true)
    setTestSuccess(null)
    const result = await testSlackWebhook(webhookUrl)
    setIsTesting(false)
    setTestSuccess(result.success)
    if (result.success) {
      setTimeout(() => setTestSuccess(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor={`webhook-url-${projectId}`} className="block text-sm font-medium text-app-fg">
              Slack Webhook URL
            </label>
            <input
              id={`webhook-url-${projectId}`}
              placeholder="https://hooks.slack.com/services/your-webhook-url"
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-md text-app-fg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-app-muted">
              You can create an Incoming Webhook from your Slack App configuration dashboard.
              Leave this empty to disable Slack notifications for this project.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Save Integration
              </button>
              
              <button
                onClick={handleTest}
                disabled={isTesting || !webhookUrl}
                className="flex items-center gap-2 px-4 py-2 bg-white text-app-fg border border-app-border rounded-lg hover:bg-gray-50 dark:hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Test Connection
              </button>
            </div>
            
            <div className="flex items-center gap-2 h-5">
              {saveSuccess && <span className="text-sm font-medium text-emerald-500">Settings saved successfully!</span>}
              {saveError && <span className="text-sm font-medium text-red-500">Failed to save settings.</span>}
              {testSuccess === true && <span className="text-sm font-medium text-emerald-500">Test message sent! Check your Slack.</span>}
              {testSuccess === false && <span className="text-sm font-medium text-red-500">Test failed. Check the URL.</span>}
            </div>
          </div>
    </div>
  )
}
