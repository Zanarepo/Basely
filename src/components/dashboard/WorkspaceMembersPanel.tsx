'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, Users, Trash2, UserX, UserCheck } from 'lucide-react'
import {
  transferWorkspaceOwnership,
  updateWorkspaceMemberRole,
  updateWorkspaceMemberActiveStatus,
  removeWorkspaceMember,
  updateWorkspaceMemberAdminPrivilege,
} from '@/lib/workspace/member-actions'

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

  // The workspace owner's user ID is the user_id of the member where isOwner is true
  const ownerId = members.find((m) => m.isOwner)?.userId ?? ''

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

          return (
            <div key={member.userId} className="flex flex-col gap-4 rounded-2xl border border-app-border bg-app-muted-surface p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-app-fg truncate">
                    {member.name}{member.isOwner ? ' · Owner' : ''}
                  </p>
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
                    <span>Privileged Admin (Can manage Owner's invites)</span>
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
                  <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-300 px-3">Owner</span>
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
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      member.isActive
                        ? 'text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border-rose-500/20 hover:border-rose-500'
                        : 'text-emerald-500 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border-emerald-500/20 hover:border-emerald-500'
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
                    className="p-2 rounded-xl text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
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
              className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Transfer ownership
            </button>
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