'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Webhook, Plus, Trash2, Loader2, Activity, Globe, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { sendTestWebhook } from '@/lib/webhooks/actions'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface WebhookSubscription {
  id: string
  event_type: string
  target_url: string
  active: boolean
  signing_secret: string
  created_at: string
}

const EVENT_TYPES = [
  { id: 'all', label: 'All Events (*)' },
  { id: 'risk_change', label: 'Risk Status Changed' },
  { id: 'cost_change', label: 'Cost Updated (Actuals/EVM)' },
  { id: 'schedule_change', label: 'Schedule Baseline Saved' },
  { id: 'document_change', label: 'Document Generated' },
  { id: 'status_report', label: 'Status Report Published' },
  { id: 'assignment', label: 'Task Assignment / WBS Creation' },
  { id: 'mention', label: 'User Mentions & Comments' },
]

export function WebhooksPanel() {
  const { activeWorkspace } = useWorkspace()
  const [isOpen, setIsOpen] = useState(true)
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newEvent, setNewEvent] = useState(EVENT_TYPES[0].id)
  const [testingId, setTestingId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchWebhooks()
    }
  }, [activeWorkspace?.id])

  async function fetchWebhooks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('webhook_subscriptions')
      .select('id, event_type, target_url, active, signing_secret, created_at')
      .eq('organization_id', activeWorkspace.id)
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      setWebhooks(data as WebhookSubscription[])
    }
    setLoading(false)
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault()
    if (!newUrl.trim() || !activeWorkspace.id) return
    setIsCreating(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to create a webhook')
      setIsCreating(false)
      return
    }

    const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase
      .from('webhook_subscriptions')
      .insert({
        organization_id: activeWorkspace.id,
        event_type: newEvent,
        target_url: newUrl,
        signing_secret: `whsec_${randomSecret}`,
        created_by_user_id: user.id,
      })
    
    if (error) {
      alert('Failed to create webhook')
      console.error(error)
    } else {
      setNewUrl('')
      fetchWebhooks()
    }
    setIsCreating(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook subscription?')) return
    
    const { error } = await supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', id)
    
    if (!error) fetchWebhooks()
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('webhook_subscriptions')
      .update({ active: !currentStatus })
      .eq('id', id)
    
    if (!error) fetchWebhooks()
  }

  async function handleTest(id: string) {
    setTestingId(id)
    const res = await sendTestWebhook(id)
    setTestingId(null)
    if (res.ok) {
      alert(`✅ Test payload successfully delivered! (HTTP Status: ${res.status})`)
    } else {
      alert(`❌ Webhook delivery failed: ${res.error || 'Unknown error'}`)
    }
  }

  if (activeWorkspace.role !== 'Admin') return null

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface shadow-xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-app-surface hover:bg-app-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 text-base font-bold text-app-fg">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
            <Webhook className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div>Webhooks & Event Stream ({webhooks.length})</div>
            <p className="text-xs font-normal text-app-muted mt-0.5">Receive real-time HTTP POST payloads when project events and changes occur.</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-app-muted shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-app-muted shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="p-6 border-t border-app-border bg-app-surface-solid space-y-6">
          <div className="bg-app-surface border border-app-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-app-fg mb-4">Add Webhook Endpoint</h3>
            <form onSubmit={handleCreateWebhook} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wider">Payload URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex-[0.8] w-full space-y-1.5">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wider">Event to send</label>
                <EnterpriseSelect
                  value={newEvent}
                  onChange={(val) => setNewEvent(val)}
                  options={EVENT_TYPES.map(evt => ({
                    value: evt.id,
                    label: evt.label,
                    description: `Webhook Event: ${evt.id}`
                  }))}
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newUrl.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Endpoint
              </button>
            </form>
          </div>

          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-app-border bg-app-surface/50">
              <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Configured Endpoints</h3>
            </div>
            
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-app-muted animate-spin" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center">
                <Webhook className="w-12 h-12 text-app-border mx-auto mb-3" />
                <p className="text-app-muted text-sm">No webhooks configured yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-app-border">
                {webhooks.map(wh => {
                  const eventLabel = EVENT_TYPES.find(e => e.id === wh.event_type)?.label || wh.event_type
                  const isTesting = testingId === wh.id
                  return (
                    <li key={wh.id} className={`group p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-app-hover/30 transition-colors ${!wh.active ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-app-bg rounded-lg border border-app-border">
                          <Globe className="w-5 h-5 text-app-muted" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-app-fg flex items-center gap-2">
                            {wh.target_url}
                            {!wh.active && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-app-border text-app-subtle">
                                Inactive
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-app-muted">
                            <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5"/> {eventLabel}</span>
                            <span>&bull;</span>
                            <span>Secret: <code className="font-mono bg-app-bg px-1 rounded border border-app-border">{wh.signing_secret}</code></span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 shrink-0 transition-opacity ${isTesting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                        <button
                          onClick={() => handleTest(wh.id)}
                          disabled={isTesting || !wh.active}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                          title="Send a sample test payload to this endpoint"
                        >
                          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Send Test
                        </button>
                        <button
                          onClick={() => toggleActive(wh.id, wh.active)}
                          className="px-3 py-1.5 text-xs font-medium rounded border border-app-border bg-app-surface hover:bg-app-hover text-app-fg transition-colors cursor-pointer"
                        >
                          {wh.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
                          className="p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Delete webhook"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
