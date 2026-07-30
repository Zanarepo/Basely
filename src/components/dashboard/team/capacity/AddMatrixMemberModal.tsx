'use client'

import { useState } from 'react'
import { X, UserPlus, Users, Sparkles, Save, ShieldCheck, Briefcase } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { saveMemberCapacity } from '@/lib/team/capacity-actions'
import { assignProjectMember } from '@/lib/projects/actions'

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
  const [customRole, setCustomRole] = useState('Senior Systems Architect')
  const [customEmail, setCustomEmail] = useState('')
  const [hours, setHours] = useState('40')
  const [velocity, setVelocity] = useState('15')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const unaddedWorkspaceMembers = workspaceMembers.filter(m => !existingMemberIds.includes(m.userId))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    let finalId = ''
    let finalName = ''
    let finalRole = ''
    let isExistingWorkspaceUser = false

    if (mode === 'workspace' && unaddedWorkspaceMembers.length > 0) {
      if (!selectedUserId && unaddedWorkspaceMembers.length > 0) {
        setSelectedUserId(unaddedWorkspaceMembers[0].userId)
      }
      const chosenId = selectedUserId || (unaddedWorkspaceMembers[0]?.userId || '')
      const found = unaddedWorkspaceMembers.find(m => m.userId === chosenId)
      if (!found) {
        setError('Please select a team member from the workspace database.')
        setIsSaving(false)
        return
      }
      finalId = found.userId
      finalName = found.name
      finalRole = found.role || 'Project Team Member'
      isExistingWorkspaceUser = true
    } else {
      if (!customName.trim()) {
        setError('Please provide the full name or designator for this specialist.')
        setIsSaving(false)
        return
      }
      finalId = crypto.randomUUID()
      finalName = customName.trim()
      finalRole = customRole.trim() || 'Specialist Resource'
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
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent border-b border-app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 flex items-center justify-center shadow-inner">
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

        {/* Mode selector */}
        <div className="px-6 pt-4 flex border-b border-app-border bg-app-muted-surface/50 shrink-0">
          {unaddedWorkspaceMembers.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('workspace')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                mode === 'workspace'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Workspace Database ({unaddedWorkspaceMembers.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              mode === 'custom' || unaddedWorkspaceMembers.length === 0
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-app-muted hover:text-app-fg'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Resource / Specialist</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {mode === 'workspace' && unaddedWorkspaceMembers.length > 0 ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                Select from Workspace Team Database <span className="text-indigo-500">*</span>
              </label>
              <EnterpriseSelect
                value={selectedUserId || (unaddedWorkspaceMembers[0]?.userId || '')}
                onChange={(val: string) => setSelectedUserId(val)}
                options={unaddedWorkspaceMembers.map((m) => ({
                  value: m.userId,
                  label: `${m.name} (${m.role || 'Member'}) - ${m.email}`
                }))}
                placeholder="Choose team member..."
                className="bg-app-muted-surface"
              />
              <p className="text-[11px] text-app-muted mt-1.5">
                Selecting will assign them to this project and initialize their competency & capacity baseline.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                  Specialist / Contractor Full Name <span className="text-indigo-500">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Dr. Julian Vance, Sarah Lin (Consultant)..."
                  className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                    className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                    className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-app-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-app-fg mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Initial Capacity Allocation Baseline
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
                  className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-bold text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-bold text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
