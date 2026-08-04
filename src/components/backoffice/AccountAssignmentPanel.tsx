'use client'

import { useState, useTransition } from 'react'
import { assignAccountManager } from '@/lib/backoffice/assignment-actions'
import { Shield, Loader2, UserPlus, Star } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

export function AccountAssignmentPanel({ organizationId, currentAssignments, staffList, isSuperadmin }: any) {
  const [isPending, startTransition] = useTransition()
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleAssign = () => {
    if (!selectedStaffId) return
    setErrorMsg('')
    startTransition(async () => {
      const result = await assignAccountManager(organizationId, selectedStaffId, currentAssignments.length === 0)
      if (!result.ok) {
        setErrorMsg(result.error)
      } else {
        setSelectedStaffId('')
      }
    })
  }

  return (
    <div className="bg-app-card rounded-2xl border border-app-border shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-app-fg">Account Managers</h3>
      </div>

      <div className="space-y-3 mb-4">
        {currentAssignments?.map((a: any) => (
          <div key={a.id} className="flex justify-between items-center p-3 rounded-xl bg-app-surface border border-app-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-app-fg">{a.internal_staff?.email}</span>
              {a.is_primary && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
            </div>
          </div>
        ))}
        
        {(!currentAssignments || currentAssignments.length === 0) && (
          <p className="text-sm text-app-muted italic">No account managers assigned.</p>
        )}
      </div>

      {isSuperadmin && (
        <div className="space-y-3 pt-3 border-t border-app-border">
          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
            <div className="flex-1 min-w-0">
              <EnterpriseSelect
                value={selectedStaffId}
                onChange={(val) => setSelectedStaffId(val as string)}
                disabled={isPending}
                options={[
                  { value: '', label: 'Select Account Manager...' },
                  ...(staffList?.filter((s: any) => s.role === 'account_manager' || s.role === 'superadmin').map((s: any) => ({
                    value: s.id,
                    label: s.email,
                    description: s.role
                  })) || [])
                ]}
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={!selectedStaffId || isPending}
              className="px-4 py-[9px] bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center sm:min-w-[80px]"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
