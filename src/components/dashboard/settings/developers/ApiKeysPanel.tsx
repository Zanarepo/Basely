'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Key, Plus, Trash2, Loader2, Copy, CheckCircle2, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scope: 'read_only' | 'read_write'
  entity_scope: string[]
  created_at: string
  revoked_at: string | null
}

export function ApiKeysPanel() {
  const { activeWorkspace } = useWorkspace()
  const [isOpen, setIsOpen] = useState(true)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScope, setNewKeyScope] = useState<'read_only' | 'read_write'>('read_only')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchKeys()
    }
  }, [activeWorkspace?.id])

  async function fetchKeys() {
    setLoading(true)
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scope, entity_scope, created_at, revoked_at')
      .eq('organization_id', activeWorkspace.id)
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      setKeys(data as ApiKey[])
    }
    setLoading(false)
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim() || !activeWorkspace.id) return
    setIsCreating(true)
    
    // In a real app, this should call a server action or API route to securely generate and store the hash
    // We mock the API route call here to generate the key
    try {
      const res = await fetch('/api/internal/api-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: activeWorkspace.id,
          name: newKeyName,
          scope: newKeyScope,
          entity_scope: ['projects', 'wbs', 'activities', 'risks', 'actual_costs']
        })
      })
      
      const data = await res.json()
      if (res.ok && data.apiKey) {
        setGeneratedKey(data.apiKey)
        setNewKeyName('')
        fetchKeys()
      } else {
        alert(data.error || 'Failed to create key')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? Any applications using it will immediately lose access.')) return
    
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', keyId)
    
    if (!error) {
      fetchKeys()
    }
  }

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (activeWorkspace.role !== 'Admin') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 flex flex-col items-center text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-app-fg mb-2">Admin Access Required</h3>
        <p className="text-sm text-app-muted max-w-md">
          You must be an Organization Admin to manage API keys and developer settings.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface shadow-xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-app-surface hover:bg-app-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 text-base font-bold text-app-fg">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div>API Keys & Authentication ({keys.length})</div>
            <p className="text-xs font-normal text-app-muted mt-0.5">Manage API keys for external integrations, custom scripts, and ERP connectors.</p>
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
          {generatedKey && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-app-fg">API Key Generated Successfully</h3>
                  <p className="text-sm text-app-muted mt-1 mb-4">
                    Please copy this key now. For security reasons, you will not be able to see it again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-app-surface border border-app-border rounded-lg px-4 py-2.5 text-sm font-mono text-app-fg break-all">
                      {generatedKey}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="shrink-0 p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <button 
                    onClick={() => setGeneratedKey(null)}
                    className="mt-4 text-sm text-app-muted hover:text-app-fg cursor-pointer font-medium"
                  >
                    I have copied the key
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-app-surface border border-app-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-app-fg mb-4">Generate New Key</h3>
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wider">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., ERP Connector"
                  className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wider">Scope</label>
                <EnterpriseSelect
                  value={newKeyScope}
                  onChange={(val) => setNewKeyScope(val as 'read_only' | 'read_write')}
                  options={[
                    { value: 'read_only', label: 'Read Only', description: 'Query telemetry & reports without modifying records' },
                    { value: 'read_write', label: 'Read & Write', description: 'Full CRUD access for automated integrations' },
                  ]}
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate
              </button>
            </form>
          </div>

          <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-app-border bg-app-surface/50">
              <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Active API Keys</h3>
            </div>
            
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-app-muted animate-spin" />
              </div>
            ) : keys.length === 0 ? (
              <div className="p-8 text-center">
                <Key className="w-12 h-12 text-app-border mx-auto mb-3" />
                <p className="text-app-muted text-sm">No API keys generated yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-app-border">
                {keys.map(key => {
                  const isRevoked = !!key.revoked_at
                  return (
                    <li key={key.id} className={`group p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-app-hover/30 transition-colors ${isRevoked ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-app-bg rounded-lg border border-app-border">
                          <Key className="w-5 h-5 text-app-muted" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-app-fg flex items-center gap-2">
                            {key.name}
                            {isRevoked && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-rose-500/10 text-rose-500">
                                Revoked
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-app-muted">
                            <code className="bg-app-bg border border-app-border rounded px-1.5 py-0.5 font-mono">
                              {key.key_prefix}...
                            </code>
                            <span>&bull;</span>
                            <span className="capitalize">{key.scope.replace('_', ' ')}</span>
                            <span>&bull;</span>
                            <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {!isRevoked && (
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRevoke(key.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        </div>
                      )}
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
