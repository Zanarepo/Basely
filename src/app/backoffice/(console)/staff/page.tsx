import { createClient } from '@/utils/supabase/server'
import { getStaffSession } from '@/lib/backoffice/auth'
import { InviteStaffModal } from '@/components/backoffice/InviteStaffModal'
import { StaffRowActions } from '@/components/backoffice/StaffRowActions'
import { Shield, ShieldAlert, User, MoreHorizontal } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Internal Staff | Backoffice'
}

export default async function StaffPage() {
  const currentStaff = await getStaffSession()
  if (!currentStaff) return null
  const isSuper = currentStaff.role === 'superadmin'

  const supabase = await createClient()
  const { data: staffList, error } = await supabase
    .from('internal_staff')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: pendingInvites } = await supabase
    .from('internal_invitations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-app-fg tracking-tight">Internal Staff</h1>
          <p className="text-app-muted mt-1">Manage superadmins, account managers, and support staff.</p>
        </div>
        {isSuper && <InviteStaffModal />}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-app-fg">Staff Directory</h2>
          
          <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-app-border bg-app-muted-surface">
                    <th className="px-6 py-4 font-semibold text-app-muted uppercase tracking-wider text-xs">Email</th>
                    <th className="px-6 py-4 font-semibold text-app-muted uppercase tracking-wider text-xs">Role</th>
                    <th className="px-6 py-4 font-semibold text-app-muted uppercase tracking-wider text-xs">Added</th>
                    {isSuper && <th className="px-6 py-4"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {staffList?.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-app-hover/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                            {staff.role === 'superadmin' ? (
                              <Shield className="h-4 w-4 text-indigo-500" />
                            ) : (
                              <User className="h-4 w-4 text-app-muted" />
                            )}
                          </div>
                          <span className="font-medium text-app-fg">{staff.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-app-surface border border-app-border px-2.5 py-0.5 text-xs font-semibold text-app-fg">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-app-muted">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      {isSuper && (
                        <td className="px-6 py-4">
                          <StaffRowActions staffId={staff.id} currentRole={staff.role} staffEmail={staff.email} />
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {pendingInvites?.map((invite: any) => (
                    <tr key={invite.id} className="hover:bg-app-hover/30 transition-colors group opacity-60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full border border-dashed border-app-border flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-app-muted" />
                          </div>
                          <div>
                            <span className="font-medium text-app-fg block">{invite.invitee_email}</span>
                            <span className="text-xs text-app-muted uppercase font-bold tracking-wider">Pending Invite</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-app-surface border border-app-border px-2.5 py-0.5 text-xs font-semibold text-app-fg">
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-app-muted">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                      {isSuper && (
                        <td className="px-6 py-4">
                          {/* Could add a Resend or Revoke invite action here later */}
                        </td>
                      )}
                    </tr>
                  ))}
                  
                  {(!staffList || staffList.length === 0) && (!pendingInvites || pendingInvites.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-app-muted">
                        No internal staff found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  )
}
