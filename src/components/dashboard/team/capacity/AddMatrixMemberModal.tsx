'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Users, Sparkles, Save, ShieldCheck, Briefcase } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { createClient } from '@/utils/supabase/client'
import { saveMemberCapacity } from '@/lib/team/capacity-actions'
import { assignProjectMember } from '@/lib/projects/actions'
import { Link as LinkIcon, Unlink } from 'lucide-react'

interface WorkspaceMember {
  userId: string
  name: string
  email: string
  role: string
}

interface AddMatrixMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (member: {
    id: string
    name: string
    role: string
    avatar: string
    availableHours: number
    sprintVelocity: number
    bandwidthPct: number
  }) => void
  workspaceMembers?: WorkspaceMember[]
  existingMemberIds?: string[]
  projectId?: string
  organizationId?: string
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function AddMatrixMemberModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceMembers = [],
  existingMemberIds = [],
  projectId = '',
  organizationId = 'default_org',
  onShowToast
}: AddMatrixMemberModalProps) {
  const [mode, setMode] = useState<'workspace' | 'custom'>(
    workspaceMembers.filter(m => !existingMemberIds.includes(m.userId)).length > 0 ? 'workspace' : 'custom'
  )
  const [selectedUserId, setSelectedUserId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [hours, setHours] = useState('40')
  const [velocity, setVelocity] = useState('15')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stakeholders, setStakeholders] = useState<any[]>([])

  const supabase = createClient()


  useEffect(() => {
    if (projectId) {
      supabase.from('stakeholders').select('*').eq('project_id', projectId)
        .then(({ data }) => setStakeholders(data || []))
    }
  }, [projectId])

  if (!isOpen) return null

  const unaddedWorkspaceMembers = workspaceMembers.filter(m => !existingMemberIds.includes(m.userId))
  const unaddedStakeholders = stakeholders.filter(s => !existingMemberIds.includes(s.id))

  const handleLinkSelect = (val: string) => {
    setSelectedUserId(val)
    if (!val) {
      setCustomName('')
      setCustomRole('')
      setCustomEmail('')
      return
    }
    if (val.startsWith('ws_')) {
      const uid = val.replace('ws_', '')
      const member = workspaceMembers.find(m => m.userId === uid)
      if (member) {
        setCustomName(member.name)
        setCustomRole(member.role || '')
        setCustomEmail(member.email || '')
      }
    } else if (val.startsWith('sh_')) {
      const sid = val.replace('sh_', '')
      const sh = stakeholders.find(s => s.id === sid)
      if (sh) {
        setCustomName(sh.name || '')
        setCustomRole(sh.role_title || '')
        setCustomEmail(sh.email || '')
      }
    }
  }

  const linkOptions = [
    { value: '', label: 'Select a workspace member or stakeholder...' },
    ...unaddedWorkspaceMembers.map(m => ({ value: `ws_${m.userId}`, label: `[Team] ${m.name}` })),
    ...unaddedStakeholders.map(s => ({ value: `sh_${s.id}`, label: `[Stakeholder] ${s.name}` }))
  ]

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    let finalId = ''
    let finalName = ''
    let finalRole = ''
    let isExistingWorkspaceUser = false

    if (!customName.trim()) {
      setError('Please provide the full name or designator for this specialist.')
      setIsSaving(false)
      return
    }
    
    finalName = customName.trim()
    finalRole = customRole.trim() || 'Specialist Resource'

    if (selectedUserId) {
      if (selectedUserId.startsWith('ws_')) {
        finalId = selectedUserId.replace('ws_', '')
        isExistingWorkspaceUser = true
      } else if (selectedUserId.startsWith('sh_')) {
        finalId = selectedUserId.replace('sh_', '')
      }
    } else {
      finalId = crypto.randomUUID()
    }

    const initials = finalName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()

    const parsedHours = parseFloat(hours) || 40.0
    const parsedVelocity = parseFloat(velocity) || 15.0

    // Try assigning project member if real user
    if (isExistingWorkspaceUser && projectId) {
      try {
        await assignProjectMember(projectId, finalId)
      } catch (err) {
        console.error('Error assigning project member during capacity initialization:', err)
      }
    }

    // Save capacity record in team DB
    const res = await saveMemberCapacity({
      organization_id: organizationId || 'default_org',
      project_id: projectId || 'global',
      user_id: finalId,
      member_name: finalName,
      member_role: finalRole,
      avatar_initials: initials,
      available_hours_per_week: parsedHours,
      sprint_velocity_points: parsedVelocity,
      allocated_percentage: 100,
      effective_start_date: new Date().toISOString().split('T')[0],
      effective_end_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    })

    setIsSaving(false)
    if (res.ok) {
      onShowToast?.('success', `Added "${finalName}" (${finalRole}) to team competency database`)
      onSuccess?.({
        id: finalId,
        name: finalName,
        role: finalRole,
        avatar: initials,
        availableHours: parsedHours,
        sprintVelocity: parsedVelocity,
        bandwidthPct: 100
      })
      onClose()
    } else {
      const msg = res.error || 'Failed to initialize resource allocation'
      setError(msg)
      onShowToast?.('error', msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-app-surface border border-app-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-transparent border-b border-app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/25 text-violet-500 flex items-center justify-center shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-app-fg">Add Team Specialist & Capacity</h3>
              <p className="text-xs text-app-muted">Register member or external resource in project matrix</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg rounded-xl hover:bg-app-muted-surface border border-transparent hover:border-app-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Link Profile Dropdown */}
          <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl relative">
            <label className="flex items-center gap-2 text-sm font-bold text-app-fg mb-3">
              <LinkIcon className="w-4 h-4 text-violet-500" />
              Link Platform User or Stakeholder (Optional)
            </label>
            <div className="relative">
              <EnterpriseSelect
                value={selectedUserId}
                onChange={(val) => handleLinkSelect(val as string)}
                options={linkOptions}
                placeholder="Select a workspace member or stakeholder..."
                className="bg-app-surface"
              />
            </div>
            <p className="text-[11px] text-app-muted mt-2 leading-relaxed">
              Linking ensures name & role automatically stay synced with the user's platform profile or stakeholder record.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                Specialist / Contractor Full Name <span className="text-violet-500">*</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Dr. Julian Vance, Sarah Lin (Consultant)..."
                className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                  Project Role & Designation
                </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Lead Security Architect"
                    className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. consult@partner.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

          <div className="pt-2 border-t border-app-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-app-fg mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-violet-500" /> Initial Capacity Allocation Baseline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-app-muted block mb-1">
                  Available Hours / Week
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="168"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-bold text-app-fg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-app-muted block mb-1">
                  Sprint Velocity (Pts / Sprint)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="200"
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-bold text-app-fg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-app-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-app-muted hover:text-app-fg rounded-xl bg-app-muted-surface border border-app-border hover:bg-app-hover transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Register in Team Matrix</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
