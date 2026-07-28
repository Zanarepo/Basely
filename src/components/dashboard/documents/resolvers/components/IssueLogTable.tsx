'use client'

import React, { useState } from 'react'
import { IssueItem } from '../hooks/useIssueLogData'
import { AlertCircle, CheckCircle2, Copy, ShieldAlert, User, Calendar, Check } from 'lucide-react'

interface IssueLogTableProps {
  issues: IssueItem[]
}

export function IssueLogTable({ issues }: IssueLogTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (issue: IssueItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `Issue: ${issue.title} | Status: ${issue.status} | Owner: ${issue.owner_name} | Raised: ${new Date(issue.raised_date).toLocaleDateString()}`
    navigator.clipboard.writeText(text)
    setCopiedId(issue.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'open' || s === 'active' || s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <AlertCircle className="w-3 h-3" /> Open
        </span>
      )
    }
    if (s === 'resolved' || s === 'closed' || s === 'done') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Resolved
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {status}
      </span>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white dark:bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto text-app-muted mb-2" />
        <p className="font-semibold text-app-fg">No issues currently logged</p>
        <p className="text-xs mt-1 text-app-muted">All active project execution variances and issues will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Structured Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-app-border text-xs uppercase tracking-wider text-app-muted bg-slate-50 dark:bg-app-surface">
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Issue Description & Title</th>
              <th className="py-3 px-4 font-semibold">Responsible Owner</th>
              <th className="py-3 px-4 font-semibold">Linked Risk Origin</th>
              <th className="py-3 px-4 font-semibold">Raised Date</th>
              <th className="py-3 px-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border text-sm text-app-fg">
            {issues.map(issue => (
              <tr key={issue.id} className="group hover:bg-slate-50 dark:hover:bg-app-hover/50 transition-colors duration-150">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getStatusBadge(issue.status)}
                </td>
                <td className="py-3.5 px-4 max-w-sm">
                  <p className="font-semibold text-app-fg truncate">{issue.title}</p>
                  {issue.description && (
                    <p className="text-xs text-app-muted mt-0.5 line-clamp-1">{issue.description}</p>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-app-fg">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center font-bold">
                      {(issue.owner_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-app-fg font-semibold">{issue.owner_name || 'Unassigned'}</p>
                      <p className="text-[11px] text-app-muted">{issue.owner_role !== 'N/A' ? issue.owner_role : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {issue.linked_risk_title !== 'No Linked Risk' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20 max-w-[180px] truncate shadow-2xs">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      <span className="truncate">{issue.linked_risk_title}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-app-muted italic">None</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-xs text-app-muted whitespace-nowrap font-mono">
                  {new Date(issue.raised_date).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {/* Hover-Activated Action Controls */}
                  <div className="inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(issue, e)}
                      title="Copy issue summary"
                      className="p-1.5 text-app-muted hover:text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      {copiedId === issue.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card View (< md) */}
      <div className="md:hidden space-y-3">
        {issues.map(issue => (
          <div key={issue.id} className="group bg-white dark:bg-app-card border border-app-border rounded-xl p-4 transition-all hover:border-indigo-500/50 shadow-sm relative">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-app-fg text-base">{issue.title}</h4>
                {issue.description && <p className="text-xs text-app-muted mt-1">{issue.description}</p>}
              </div>
              <div>{getStatusBadge(issue.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-app-border pt-3">
              <div className="flex items-center gap-1.5 text-app-fg">
                <User className="w-3.5 h-3.5 text-app-muted flex-shrink-0" />
                <span className="truncate font-semibold">{issue.owner_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-app-muted justify-end">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-app-muted" />
                <span className="font-mono text-[11px]">{new Date(issue.raised_date).toLocaleDateString()}</span>
              </div>
            </div>

            {issue.linked_risk_title !== 'No Linked Risk' && (
              <div className="mt-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-2.5 text-xs flex items-center gap-2 text-amber-600 dark:text-amber-300 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">Linked Risk: <strong>{issue.linked_risk_title}</strong></span>
              </div>
            )}

            {/* Hover actions in mobile card */}
            <div className="mt-3 pt-2 border-t border-app-border flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => handleCopy(issue, e)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-app-fg bg-app-surface hover:bg-app-hover border border-app-border rounded-lg transition-colors cursor-pointer shadow-2xs"
                style={{ cursor: 'pointer' }}
              >
                {copiedId === issue.id ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Summary</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
