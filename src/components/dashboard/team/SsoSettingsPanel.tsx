'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, Key, Save, Loader2, Trash2, Link as LinkIcon, Settings2 } from 'lucide-react'
import { useSsoConfiguration, SsoProtocol } from './hooks/useSsoConfiguration'
import type { WorkspaceMember } from '@/components/dashboard/WorkspaceMembersPanel'
import { CollapsibleSection } from './CollapsibleSection'

interface SsoSettingsPanelProps {
  organizationId: string
  members: WorkspaceMember[]
  isAdmin: boolean
}

export function SsoSettingsPanel({ organizationId, members, isAdmin }: SsoSettingsPanelProps) {
  const { config, isLoading, isSaving, saveConfig, deleteConfig } = useSsoConfiguration(organizationId)
  
  const [protocol, setProtocol] = useState<SsoProtocol>('saml')
  const [metadataUrl, setMetadataUrl] = useState('')
  const [certificate, setCertificate] = useState('')
  const [enforced, setEnforced] = useState(false)
  const [breakGlassAdminId, setBreakGlassAdminId] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Update local state when config loads
  useEffect(() => {
    if (config) {
      setProtocol(config.protocol)
      setMetadataUrl(config.idp_metadata?.url || '')
      setCertificate(config.certificate || '')
      setEnforced(config.enforced)
      setBreakGlassAdminId(config.break_glass_admin_id || '')
    }
  }, [config])

  if (!isAdmin) {
    return null
  }

  const admins = members.filter(m => m.role === 'Admin' || m.isOwner)

  const handleSave = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (enforced && !metadataUrl.trim()) {
      setErrorMsg('IdP Metadata URL or Issuer is required when SSO is enforced.')
      return
    }

    const { success, error } = await saveConfig({
      protocol,
      enforced,
      certificate,
      break_glass_admin_id: breakGlassAdminId || null,
      idp_metadata: { url: metadataUrl.trim() },
    })
    
    if (success) {
      setSuccessMsg('SSO configuration saved successfully.')
    } else if (error) {
      setErrorMsg(error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove SSO configuration? Users will revert to standard login.')) {
      setErrorMsg(null)
      setSuccessMsg(null)
      const { success, error } = await deleteConfig()
      if (success) {
        setSuccessMsg('SSO configuration removed.')
      } else if (error) {
        setErrorMsg(error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Single Sign-On (SSO)"
        subtitle="Configure enterprise authentication for your organization."
        icon={<ShieldCheck className="w-5 h-5 text-indigo-500" />}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        badge={
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-muted">Status:</span>
            {config ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Configured
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Not Configured
              </span>
            )}
          </div>
        }
      >
        <div>

        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-8">
          {/* Protocol Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-app-fg">Authentication Protocol</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProtocol('saml')}
                className={`p-4 rounded-xl border text-left transition-all ${protocol === 'saml' ? 'bg-indigo-500/5 border-indigo-500/50 ring-1 ring-indigo-500' : 'bg-app-surface-solid border-app-border hover:border-app-border-hover'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-app-fg">SAML 2.0</div>
                  {protocol === 'saml' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <div className="text-xs text-app-muted mt-1">Standard enterprise identity provider integration.</div>
              </button>
              
              <button
                type="button"
                onClick={() => setProtocol('oauth')}
                className={`p-4 rounded-xl border text-left transition-all ${protocol === 'oauth' ? 'bg-indigo-500/5 border-indigo-500/50 ring-1 ring-indigo-500' : 'bg-app-surface-solid border-app-border hover:border-app-border-hover'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-app-fg">OAuth 2.0</div>
                  {protocol === 'oauth' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <div className="text-xs text-app-muted mt-1">Modern secure authorization protocol.</div>
              </button>
            </div>
          </div>

          {/* Identity Provider Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-app-fg flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-app-muted" /> Provider Configuration
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-app-subtle">IdP Metadata URL or Issuer</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
                  <input
                    type="text"
                    value={metadataUrl}
                    onChange={(e) => setMetadataUrl(e.target.value)}
                    placeholder="https://idp.example.com/metadata"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-app-surface-solid border border-app-border text-sm text-app-fg placeholder:text-app-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {protocol === 'saml' && (
                <div className="space-y-1.5">
                  <label className="text-sm text-app-subtle">X.509 Certificate</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-app-muted" />
                    <textarea
                      value={certificate}
                      onChange={(e) => setCertificate(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----\n..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-app-surface-solid border border-app-border text-sm text-app-fg placeholder:text-app-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[100px] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security & Enforcement */}
          <div className="space-y-4 pt-4 border-t border-app-border">
            <h4 className="text-sm font-medium text-app-fg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Security Policies
            </h4>
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={enforced}
                    onChange={(e) => setEnforced(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-app-fg">Enforce SSO for all users</div>
                  <div className="text-xs text-app-muted mt-0.5">When enabled, users cannot log in using passwords. They will be redirected to the Identity Provider.</div>
                </div>
              </label>

              {enforced && (
                <div className="space-y-1.5 pl-8 mt-4 border-l-2 border-amber-500/20">
                  <label className="text-sm font-medium text-amber-600 dark:text-amber-500">Break-Glass Admin (Required)</label>
                  <p className="text-xs text-app-muted mb-2">Select an admin who can bypass SSO via password in case the Identity Provider is down.</p>
                  <select
                    value={breakGlassAdminId}
                    onChange={(e) => setBreakGlassAdminId(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 rounded-lg bg-app-surface-solid border border-amber-500/30 text-sm text-app-fg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  >
                    <option value="">-- Select Break-Glass Admin --</option>
                    {admins.map(admin => (
                      <option key={admin.userId} value={admin.userId}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-app-surface-solid border-t border-app-border flex items-center justify-between">
          {config ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Remove Configuration</span>
            </button>
          ) : <div />}
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (enforced && (!breakGlassAdminId || !metadataUrl.trim()))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
