'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, Users, Trash2, UserX, UserCheck, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import {
  transferWorkspaceOwnership,
  updateWorkspaceMemberRole,
  updateWorkspaceMemberActiveStatus,
  removeWorkspaceMember,
  updateWorkspaceMemberAdminPrivilege,
  updateProfileName,
} from '@/lib/workspace/member-actions'
import { deleteWorkspace } from '@/lib/workspace/actions'

const OWNER_ROLES = ['Admin', 'PM', 'Team Member', 'Viewer'] as const
const ADMIN_ROLES = ['PM', 'Team Member', 'Viewer'] as const
type WorkspaceRole = (typeof OWNER_ROLES)[number]

export type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: WorkspaceRole
  isOwner: boolean
  isActive: boolean
  addedBy: string | null
  canManageAllMembers: boolean
}

export function WorkspaceMembersPanel({
  organizationId,
  members,
  isOwner,
  callerUserId,
  callerCanManageAllMembers,
}: {
  organizationId: string
  members: WorkspaceMember[]
  isOwner: boolean
  callerUserId: string
  callerCanManageAllMembers: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [newOwnerId, setNewOwnerId] = useState('')
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null)
  const [ownerNameInput, setOwnerNameInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // The workspace owner's user ID is the user_id of the member where isOwner is true
  const ownerId = members.find((m) => m.isOwner)?.userId ?? ''

  const handleDeleteWorkspace = () => {
    if (deleteConfirmText !== 'DELETE') return
    setMessage(null)
    startTransition(async () => {
      const result = await deleteWorkspace(organizationId)
      if (result.ok) {
        router.push('/dashboard')
      } else {
        setMessage(result.error ?? 'Failed to delete workspace.')
      }
    })
  }

  const changeRole = (memberUserId: string, role: WorkspaceRole) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberRole(organizationId, memberUserId, role)
      if (result.ok) {
        setMessage('Role updated.')
        router.refresh()
      } else {
        setMessage(result.error)
        router.refresh() // refresh to reset the select to the true DB value
      }
    })
  }

  const transfer = () => {
    if (!newOwnerId || !window.confirm('Transfer ownership? You will remain an Admin.')) return
    setMessage(null)
    startTransition(async () => {
      const result = await transferWorkspaceOwnership(organizationId, newOwnerId)
      setMessage(result.ok ? 'Ownership transferred.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const togglePrivilege = (memberUserId: string, checked: boolean) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberAdminPrivilege(organizationId, memberUserId, checked)
      setMessage(result.ok ? 'Privileges updated.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const toggleStatus = (memberUserId: string, isActive: boolean) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateWorkspaceMemberActiveStatus(organizationId, memberUserId, isActive)
      setMessage(result.ok ? (isActive ? 'Access activated.' : 'Access revoked.') : result.error)
      if (result.ok) router.refresh()
    })
  }

  const removeMember = (memberUserId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return
    setMessage(null)
    startTransition(async () => {
      const result = await removeWorkspaceMember(organizationId, memberUserId)
      setMessage(result.ok ? 'Member removed.' : result.error)
      if (result.ok) router.refresh()
    })
  }

  const saveOwnerName = () => {
    if (!ownerNameInput.trim()) return
    setMessage(null)
    startTransition(async () => {
      const result = await updateProfileName(ownerNameInput)
      if (result.ok) {
        setMessage('Profile name updated.')
        setEditingOwnerId(null)
        router.refresh()
      } else {
        setMessage(result.error)
      }
    })
  }

  return (
    <section className="mt-6 backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-xl bg-indigo-500/15">
          <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-app-fg">Team access</h2>
          <p className="text-sm text-app-muted">
            The Owner controls Admin access. Admins manage non-Admin members only.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member) => {
          const roles = isOwner ? OWNER_ROLES : ADMIN_ROLES
          // Non-owners cannot manage Admin or Owner rows — show a locked badge
          const isLocked = !isOwner && (member.isOwner || member.role === 'Admin')

          // Access controls for Status and Delete:
          const canManageStatus =
            member.userId !== callerUserId && // cannot revoke self
            !member.isOwner && // cannot revoke owner
            (isOwner || (member.addedBy !== ownerId || callerCanManageAllMembers))

          const canRemove =
            member.userId !== callerUserId && // cannot remove self
            !member.isOwner && // cannot remove owner
            (isOwner || callerCanManageAllMembers || member.addedBy === callerUserId)

          const isEditingThisProfile = editingOwnerId === member.userId

          return (
            <div key={member.userId} className="flex flex-col gap-4 rounded-2xl border border-app-border bg-app-muted-surface p-4 sm:flex-row sm:items-center group">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isEditingThisProfile ? (
                    <div className="flex items-center gap-2 my-0.5">
                      <input
                        type="text"
                        value={ownerNameInput}
                        onChange={(e) => setOwnerNameInput(e.target.value)}
                        placeholder="Full Name"
                        disabled={isPending}
                        className="bg-app-bg border border-indigo-500 rounded-lg px-2.5 py-1 text-sm font-medium text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveOwnerName()
                          if (e.key === 'Escape') setEditingOwnerId(null)
                        }}
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={saveOwnerName}
                        className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Save name"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setEditingOwnerId(null)}
                        className="p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-app-fg truncate">
                      {member.name}{member.isOwner ? ' · Owner' : ''}
                    </p>
                  )}

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    member.isActive 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {member.isActive ? 'Active' : 'Revoked'}
                  </span>
                </div>
                <p className="text-sm text-app-muted truncate mb-2">{member.email}</p>
                
                {/* Privileged Admin Toggle: Editable by Owner only, on non-owner Admins */}
                {isOwner && member.role === 'Admin' && !member.isOwner && (
                  <label className="flex items-center gap-2 text-xs text-app-subtle font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.canManageAllMembers}
                      disabled={isPending}
                      onChange={(e) => togglePrivilege(member.userId, e.target.checked)}
                      className="rounded border-app-border bg-app-surface text-indigo-600 focus:ring-indigo-500 focus:ring-offset-app-bg"
                    />
                    <span>Privileged Admin (Can manage Owner&apos;s invites)</span>
                  </label>
                )}
                {/* Visual read-only privilege badge for non-owner Admins */}
                {!isOwner && member.role === 'Admin' && member.canManageAllMembers && (
                  <span className="inline-flex text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-500/20 font-medium">
                    Privileged Admin
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Role select */}
                {member.isOwner ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-300 px-3">Owner</span>
                    {(isOwner || member.userId === callerUserId) && !isEditingThisProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOwnerId(member.userId)
                          setOwnerNameInput(member.name)
                        }}
                        className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 cursor-pointer"
                        title="Edit profile name"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : isLocked ? (
                  <span
                    title="Only the workspace Owner can manage Admin roles"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm font-medium text-app-muted cursor-not-allowed select-none"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                    Admin
                  </span>
                ) : (
                  <select
                    key={member.userId + ':' + member.role}
                    aria-label={'Role for ' + member.email}
                    defaultValue={member.role}
                    disabled={isPending}
                    onChange={(event) => changeRole(member.userId, event.target.value as WorkspaceRole)}
                    className="auth-input w-full sm:w-40 pl-3 cursor-pointer disabled:opacity-60"
                  >
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                )}

                {/* Revoke / Reactivate Button */}
                {canManageStatus && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleStatus(member.userId, !member.isActive)}
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 duration-200 ${
                      member.isActive
                        ? 'text-rose-600 dark:text-rose-500 bg-rose-500/10 hover:text-white hover:bg-rose-600 border-rose-500/30 hover:border-rose-600'
                        : 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 hover:text-white hover:bg-emerald-600 border-emerald-500/30 hover:border-emerald-600'
                    }`}
                  >
                    {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    <span>{member.isActive ? 'Revoke' : 'Reactivate'}</span>
                  </button>
                )}

                {/* Remove Button */}
                {canRemove && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => removeMember(member.userId)}
                    title="Remove member from workspace"
                    className="btn-icon-danger opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isOwner && (
        <div className="mt-6 border-t border-app-border pt-5">
          <p className="font-medium text-app-fg">Transfer ownership</p>
          <p className="mt-1 text-sm text-app-muted">
            This is permanent. You will remain an Admin after the transfer.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={newOwnerId}
              onChange={(event) => setNewOwnerId(event.target.value)}
              disabled={isPending}
              className="auth-input flex-1 pl-3 cursor-pointer disabled:opacity-60"
            >
              <option value="">Choose a workspace member</option>
              {members.filter((member) => !member.isOwner).map((member) => (
                <option key={member.userId} value={member.userId}>{member.name} ({member.email})</option>
              ))}
            </select>
            <button type="button" onClick={transfer} disabled={isPending || !newOwnerId}
              className="btn-primary disabled:opacity-50">
              Transfer ownership
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-8 border-t border-rose-500/20 pt-6">
          <h4 className="font-bold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </h4>
          <p className="mt-2 text-sm text-app-muted">
            Deleting this workspace will permanently erase all associated projects, WBS elements, cost accounts, actuals, and team memberships. This action is irreversible.
          </p>
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-app-fg">Delete this workspace</p>
              <p className="text-xs text-app-subtle">Once deleted, it cannot be recovered.</p>
            </div>
            
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="px-3 py-2 bg-app-bg border border-rose-500/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-sm text-app-fg placeholder-rose-500/30"
                />
                <button
                  type="button"
                  onClick={handleDeleteWorkspace}
                  disabled={isPending || deleteConfirmText !== 'DELETE'}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800/50 disabled:text-rose-500/50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-sm font-semibold rounded-xl transition-all cursor-pointer shrink-0"
              >
                Delete Workspace
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-app-subtle">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        <span>{message ?? 'Only the Owner can promote, demote, or transfer Admin access.'}</span>
      </div>
    </section>
  )
}