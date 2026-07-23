'use client'

import { useState } from 'react'
import { Shield, Loader2, Download, Filter, FileText } from 'lucide-react'
import { useGovernanceAuditLog } from './hooks/useGovernanceAuditLog'
import { CollapsibleSection } from './CollapsibleSection'
import type { GovernanceEventType } from '@/lib/governance/actions'

interface GovernanceAuditLogPanelProps {
  organizationId: string
  isAdmin: boolean
}

const EVENT_TYPE_LABELS: Record<GovernanceEventType, string> = {
  approval_decision: 'Approval Decision',
  permission_change: 'Permission Change',
  sso_config_change: 'SSO Config Change'
}

export function GovernanceAuditLogPanel({ organizationId, isAdmin }: GovernanceAuditLogPanelProps) {
  const { logs, isLoading, filterType, setFilterType, downloadCsv } = useGovernanceAuditLog(organizationId)
  const [isOpen, setIsOpen] = useState(false)

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Governance Audit Log"
        subtitle="Compliance-grade, immutable record of sensitive governance actions."
        icon={<Shield className="w-5 h-5 text-indigo-500" />}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            Secure Log
          </span>
        }
      >
        <div className="p-4 sm:p-5 lg:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-app-surface-solid border border-app-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-sm text-app-muted font-medium">
                <Filter className="w-4 h-4" /> Filter by Event:
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="auth-input w-full sm:w-auto min-w-[200px]"
              >
                <option value="all">All Events</option>
                <option value="approval_decision">Approval Decisions</option>
                <option value="permission_change">Permission Changes</option>
                <option value="sso_config_change">SSO Config Changes</option>
              </select>
            </div>
            
            <button
              onClick={downloadCsv}
              disabled={isLoading || logs.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors w-full sm:w-auto"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="bg-app-surface-solid border border-app-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-app-muted">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No audit logs found for this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                  <thead className="bg-app-muted-surface border-b border-app-border text-xs uppercase text-app-muted">
                    <tr>
                      <th className="p-4 font-semibold">Timestamp</th>
                      <th className="p-4 font-semibold">Event Type</th>
                      <th className="p-4 font-semibold">Actor</th>
                      <th className="p-4 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-app-hover transition-colors">
                        <td className="p-4 text-app-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-app-muted-surface border border-app-border">
                            {EVENT_TYPE_LABELS[log.event_type] || log.event_type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-app-fg">{log.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-app-muted">{log.profiles?.email || log.actor_user_id.slice(0, 8)}</div>
                        </td>
                        <td className="p-4">
                          <pre className="text-[10px] sm:text-xs text-app-muted bg-app-bg p-2 rounded-lg border border-app-border max-w-xs sm:max-w-md lg:max-w-lg overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.detail, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
