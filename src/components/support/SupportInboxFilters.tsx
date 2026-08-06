'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import EnterpriseSelect from '../common/EnterpriseSelect'

export function SupportInboxFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || 'all'
  const currentPriority = searchParams.get('priority') || 'all'

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    // Reset to page 1 on filter change
    params.set('page', '1')
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-app-muted uppercase">Status</label>
        <EnterpriseSelect
          value={currentStatus}
          onChange={(val) => updateFilters('status', val)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'waiting_on_customer', label: 'Waiting on Customer' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' }
          ]}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-app-muted uppercase">Priority</label>
        <EnterpriseSelect
          value={currentPriority}
          onChange={(val) => updateFilters('priority', val)}
          options={[
            { value: 'all', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' }
          ]}
          size="sm"
        />
      </div>
    </div>
  )
}
