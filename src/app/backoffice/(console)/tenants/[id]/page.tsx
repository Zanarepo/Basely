import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { ManualOverrideModal } from '@/components/backoffice/ManualOverrideModal'
import { toggleProjectArchiveStatus } from '@/lib/backoffice/actions'
import { AccountAssignmentPanel } from '@/components/backoffice/AccountAssignmentPanel'
import { AccountHealthPanel } from '@/components/backoffice/AccountHealthPanel'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantDetailView({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession()
  const { id: orgId } = await params
  const supabase = createAdminClient()

  // Fetch Org Details
  const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single()
  const { data: sub } = await supabase.from('organization_subscriptions').select('*').eq('organization_id', orgId).single()
  const { data: members } = await supabase.from('organization_members').select('*, profiles!organization_members_user_id_fkey(full_name, email)').eq('organization_id', orgId)
  const { data: projects } = await supabase.from('projects').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
  
  // Fetch Overrides Log
  const { data: overrides } = await supabase
    .from('tenant_overrides_log')
    .select('*, internal_staff(email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  // Fetch Account Assignments
  const { data: assignments } = await supabase
    .from('account_assignments')
    .select('*, internal_staff(email)')
    .eq('organization_id', orgId)

  // Fetch Health Notes
  const { data: healthNotes } = await supabase
    .from('tenant_health_notes')
    .select('*, internal_staff(email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  // Fetch all staff for assignment dropdown
  const { data: staffList } = await supabase.from('internal_staff').select('*')

  if (!org) {
    return <div className="text-red-500 font-bold p-8">Organization not found.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/backoffice/tenants" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              &larr; Back to Directory
            </Link>
          </div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight flex items-center gap-3">
            {org.name}
          </h1>
          <p className="text-sm text-app-muted font-mono mt-1">ID: {org.id}</p>
        </div>
        
        {/* Manual Override (Only Senior/Superadmin) */}
        {staff && ['superadmin', 'support_senior'].includes(staff.role) && sub && (
          <ManualOverrideModal 
            organizationId={orgId}
            currentTier={sub.tier_id}
            currentStatus={sub.status}
            currentSeats={sub.seat_count || 1}
            staffRole={staff.role}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Members Table */}
          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-app-border flex justify-between items-center">
              <h3 className="font-bold text-app-fg">Organization Members ({members?.length || 0})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-surface border-b border-app-border">
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase">User</th>
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase">Role</th>
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {members?.map(m => (
                    <tr key={m.id} className="group hover:bg-app-hover">
                      <td className="px-4 py-3">
                        <div className="font-bold text-app-fg text-sm">{(m as any).profiles?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-app-muted">{(m as any).profiles?.email || 'No email'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-app-muted-surface rounded-md text-app-fg">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action="/api/backoffice/impersonate" method="POST" className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <input type="hidden" name="targetUserId" value={m.user_id} />
                          <button 
                            type="submit" 
                            style={{ cursor: 'pointer' }}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Impersonate
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-app-border flex justify-between items-center">
              <h3 className="font-bold text-app-fg">Projects ({projects?.length || 0})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-surface border-b border-app-border">
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase">Project</th>
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-black text-app-muted uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {projects?.map(p => (
                    <tr key={p.id} className="group hover:bg-app-hover">
                      <td className="px-4 py-3">
                        <div className="font-bold text-app-fg text-sm">{p.name}</div>
                        {p.client_name && <div className="text-xs text-app-muted">{p.client_name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          p.is_archived 
                            ? 'bg-app-surface text-app-muted' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {p.is_archived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {staff?.role === 'superadmin' && (
                          <form action={toggleProjectArchiveStatus.bind(null, p.id, p.is_archived, orgId) as any} className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                            <button 
                              type="submit" 
                              style={{ cursor: 'pointer' }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                                p.is_archived
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                              }`}
                            >
                              {p.is_archived ? 'Enable' : 'Disable'}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!projects || projects.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-app-muted">
                        No projects found in this workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log of Overrides */}
          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-app-border">
              <h3 className="font-bold text-app-fg">Override History</h3>
            </div>
            <div className="p-4 space-y-4">
              {overrides?.length === 0 ? (
                <p className="text-sm text-app-muted">No manual overrides have been performed on this tenant.</p>
              ) : (
                overrides?.map(log => (
                  <div key={log.id} className="p-3 bg-app-surface border border-app-border rounded-xl flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-app-orb-indigo flex items-center justify-center text-indigo-600 text-xs font-bold mt-1">
                      {((log as any).internal_staff?.email || 'Sys').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-xs font-bold text-app-fg">{(log as any).internal_staff?.email}</span>
                        <span className="text-[10px] text-app-muted">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-app-fg mb-2">
                        Changed <strong className="text-app-fg">{log.action_type}</strong> from <span className="line-through opacity-70">{log.old_value}</span> to <span className="text-indigo-600 dark:text-indigo-400 font-bold">{log.new_value}</span>
                      </div>
                      <div className="text-xs text-app-muted bg-app-surface-solid p-2 rounded-lg border border-app-border italic">
                        "{log.justification}"
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Details & CRM */}
        <div className="space-y-6">
          <AccountAssignmentPanel 
            organizationId={orgId} 
            currentAssignments={assignments} 
            staffList={staffList} 
            isSuperadmin={staff?.role === 'superadmin'} 
          />

          <AccountHealthPanel 
            organizationId={orgId} 
            healthNotes={healthNotes} 
            canEdit={staff?.role === 'superadmin' || staff?.role === 'account_manager'}
          />

          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
            <h3 className="font-bold text-app-fg mb-4">Subscription State</h3>
            {sub ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-app-muted uppercase">Tier</p>
                  <p className="text-lg font-black text-app-fg uppercase tracking-wide">{sub.tier_id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-app-muted uppercase">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      sub.status === 'active' ? 'bg-emerald-500' :
                      sub.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-semibold capitalize text-app-fg">{sub.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-app-muted uppercase">Seats Allocated</p>
                  <p className="text-base font-semibold text-app-fg">{sub.seat_count}</p>
                </div>
                <hr className="border-app-border" />
                <div>
                  <p className="text-xs font-bold text-app-muted uppercase">Period End</p>
                  <p className="text-sm font-semibold text-app-fg">{new Date(sub.current_period_end).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-app-muted">No subscription record found.</p>
            )}
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
            <h3 className="font-bold text-app-fg mb-4">Usage vs Limits</h3>
            <div className="space-y-4">
              <div className="p-5">
              <div className="flex justify-between text-sm font-bold text-app-fg mb-2">
                <span className="text-app-muted font-black uppercase text-xs">Seats Used</span>
                <span>{members?.length || 0} / {sub?.seat_count || 1}</span>
              </div>
              <div className="w-full bg-app-surface rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full ${((members?.length || 0) / (sub?.seat_count || 1)) > 1 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${Math.min(((members?.length || 0) / (sub?.seat_count || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            </div>
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
            <h3 className="font-bold text-app-fg mb-4">Billing History</h3>
            <div className="space-y-3">
              <p className="text-sm text-app-muted italic">Payment gateway billing history integration (Paystack/Stripe) pending sprint 32.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
