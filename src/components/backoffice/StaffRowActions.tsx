'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, X, Loader2, ShieldAlert } from 'lucide-react'
import { updateStaffRole, deleteStaffMember } from '@/lib/backoffice/staff-actions'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

const INTERNAL_ROLES = [
  { value: 'superadmin', label: 'Super Admin', description: 'Full back-office access' },
  { value: 'account_manager', label: 'Account Manager', description: 'Scoped view of assigned accounts' },
  { value: 'support_admin', label: 'Support Admin', description: 'View & read-only impersonation' },
  { value: 'support_junior', label: 'Support Junior', description: 'Limited support access' }
]

export function StaffRowActions({
  staffId,
  currentRole,
  staffEmail
}: {
  staffId: string
  currentRole: string
  staffEmail: string
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [role, setRole] = useState(currentRole)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleUpdate = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await updateStaffRole(staffId, role)
      if (!result.ok) {
        setErrorMsg(result.error || 'Failed to update role')
        return
      }
      setIsEditModalOpen(false)
    })
  }

  const handleDelete = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await deleteStaffMember(staffId)
      if (!result.ok) {
        setErrorMsg(result.error || 'Failed to delete staff member')
        return
      }
      setIsDeleteModalOpen(false)
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            setRole(currentRole)
            setErrorMsg(null)
            setIsEditModalOpen(true)
          }}
          className="p-2 rounded-xl text-app-muted hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors cursor-pointer"
          title="Edit Role"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setErrorMsg(null)
            setIsDeleteModalOpen(true)
          }}
          className="p-2 rounded-xl text-app-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Delete Staff"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isPending && setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-app-card rounded-2xl shadow-xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors z-10 cursor-pointer disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-app-fg">Edit Staff Role</h2>
                <p className="text-sm text-app-muted mt-1 truncate">
                  {staffEmail}
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-app-fg">
                  Role
                </label>
                <EnterpriseSelect
                  value={role}
                  onChange={(val) => setRole(val as string)}
                  disabled={isPending}
                  options={INTERNAL_ROLES.map((r) => ({
                    value: r.value,
                    label: r.label,
                    description: r.description
                  }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isPending || role === currentRole}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isPending && setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-app-card rounded-2xl shadow-xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors z-10 cursor-pointer disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-rose-600 dark:text-rose-400">Remove Staff Member?</h2>
                <p className="text-sm text-app-fg mt-2 font-medium break-all">
                  {staffEmail}
                </p>
                <p className="text-sm text-app-muted mt-2">
                  This action cannot be undone. They will lose all access to the Back Office immediately.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
