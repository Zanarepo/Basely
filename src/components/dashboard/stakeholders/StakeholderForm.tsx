'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, Link as LinkIcon, Unlink } from 'lucide-react'

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type StakeholderFormProps = {
  projectId: string
  stakeholderId: string | null
  onClose: () => void
  workspaceMembers: WorkspaceMember[]
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function StakeholderForm({ projectId, stakeholderId, onClose, workspaceMembers, onShowToast }: StakeholderFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [orgType, setOrgType] = useState<'internal' | 'external'>('internal')
  const [subCategory, setSubCategory] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [influence, setInfluence] = useState<number>(3)
  const [interest, setInterest] = useState<number>(3)
  const [commPref, setCommPref] = useState('')
  
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (stakeholderId) {
      loadStakeholder(stakeholderId)
    }
  }, [stakeholderId])

  const loadStakeholder = async (id: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('id', id)
      .single()
      
    if (data) {
      setName(data.name || '')
      setRoleTitle(data.role_title || '')
      setOrgType(data.organization_type)
      setSubCategory(data.sub_category || '')
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setInfluence(data.influence || 3)
      setInterest(data.interest || 3)
      setCommPref(data.communication_preference || '')
      setLinkedUserId(data.linked_user_id)
    } else if (error) {
      console.error('Failed to load stakeholder', error)
    }
    setLoading(false)
  }

  const handleLinkUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value
    if (!uid) {
      setLinkedUserId(null)
      return
    }
    
    setLinkedUserId(uid)
    const member = workspaceMembers.find(m => m.userId === uid)
    if (member) {
      // Auto-fill form fields with user data for convenience (though backend/ui will prefer linked data)
      setName(member.name)
      setEmail(member.email)
      setOrgType('internal')
    }
  }

  const handleUnlink = () => {
    setLinkedUserId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // For linked users, name is required by DB, so we ensure it has a value.
    const finalName = name.trim() || (linkedUserId ? workspaceMembers.find(m => m.userId === linkedUserId)?.name : '') || 'Unnamed'

    const payload = {
      project_id: projectId,
      name: finalName,
      role_title: roleTitle || null,
      organization_type: orgType,
      sub_category: subCategory || null,
      email: email || null,
      phone: phone || null,
      influence,
      interest,
      communication_preference: commPref || null,
      linked_user_id: linkedUserId
    }

    if (stakeholderId) {
      const { error } = await supabase.from('stakeholders').update(payload).eq('id', stakeholderId)
      if (error) console.error(error)
      else {
        onShowToast('success', 'Stakeholder updated successfully')
        onClose()
      }
    } else {
      const { error } = await supabase.from('stakeholders').insert(payload)
      if (error) console.error(error)
      else {
        onShowToast('success', 'Stakeholder created successfully')
        onClose()
      }
    }
    setSaving(false)
  }

  return (
    <>
      <div 
        className="absolute inset-0 z-40 bg-transparent" 
        onClick={onClose}
        aria-label="Close form"
      />
      <div className="absolute inset-y-0 right-0 w-96 bg-app-surface-solid border-l border-app-border shadow-2xl flex flex-col z-50">
        <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/50">
        <h3 className="font-bold text-app-fg text-lg">
          {stakeholderId ? 'Edit Stakeholder' : 'Add Stakeholder'}
        </h3>
        <button onClick={onClose} className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-app-muted" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* User Linkage Section */}
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
            <label className="text-sm font-semibold text-app-fg flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-indigo-500" />
              Link Platform User (Optional)
            </label>
            {linkedUserId ? (
              <div className="flex items-center justify-between p-2.5 bg-app-surface border border-emerald-500/30 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    Linked to User
                  </span>
                  <span className="text-xs text-app-subtle">{workspaceMembers.find(m => m.userId === linkedUserId)?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="p-1.5 text-app-muted hover:text-rose-500 rounded-md hover:bg-rose-500/10 transition-colors"
                  title="Unlink"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={handleLinkUser}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a workspace member...</option>
                {workspaceMembers.map(m => (
                  <option key={m.userId} value={m.userId}>{m.name} ({m.email})</option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-app-subtle">
              Linking ensures name & email automatically stay synced with the user's platform profile.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!!linkedUserId}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Type</label>
                <select
                  value={orgType}
                  onChange={e => setOrgType(e.target.value as any)}
                  className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Sub-Category</label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={e => setSubCategory(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Client, Vendor..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Role / Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Project Sponsor"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={!!linkedUserId}
                  className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-app-surface border border-app-border rounded-xl">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Influence (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={influence}
                  onChange={e => setInfluence(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-xs font-bold text-app-fg mt-1">{influence}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-app-fg mb-1">Interest (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interest}
                  onChange={e => setInterest(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-xs font-bold text-app-fg mt-1">{interest}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-fg mb-1">Communication Preferences</label>
              <textarea
                value={commPref}
                onChange={e => setCommPref(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                placeholder="Weekly email status report..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-app-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-app-fg hover:bg-app-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!name.trim() && !linkedUserId)}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {stakeholderId ? 'Save Changes' : 'Create Stakeholder'}
            </button>
          </div>
        </form>
      )}
      </div>
    </>
  )
}
