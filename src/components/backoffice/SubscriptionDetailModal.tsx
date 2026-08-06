'use client'

import React from 'react'
import { X, Download, FileJson } from 'lucide-react'

export function SubscriptionDetailModal({ data, onClose }: { data: any, onClose: () => void }) {
  if (!data) return null
  
  const { org, sub, membersCount, overrides } = data

  const handleDownload = () => {
    const report = {
      organization: org,
      subscription: sub,
      usage: {
        seats_used: membersCount,
        seats_allocated: sub?.seat_count || 1
      },
      override_history: overrides,
      generated_at: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billing_report_${org?.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border shrink-0 bg-app-surface-solid">
          <div>
            <h2 className="text-xl font-bold text-app-fg">{org?.name}</h2>
            <p className="text-xs font-mono text-app-muted mt-1">{org?.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 rounded-lg text-sm font-bold transition-colors cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              Download JSON
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-app-muted uppercase mb-1">Tier</p>
              <p className="text-lg font-black text-app-fg uppercase tracking-wide">{sub?.tier_id || 'Free'}</p>
            </div>
            
            <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-app-muted uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  sub?.status === 'active' ? 'bg-emerald-500' :
                  sub?.status === 'trialing' ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <span className="text-lg font-bold capitalize text-app-fg">{sub?.status || 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-app-muted uppercase mb-1">Period End / Expiration</p>
              <p className="text-sm font-semibold text-app-fg">
                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm">
              <div className="flex justify-between text-xs font-bold text-app-fg mb-2">
                <span className="text-app-muted uppercase">Seats Used</span>
                <span>{membersCount} / {sub?.seat_count || 1}</span>
              </div>
              <div className="w-full bg-app-surface-solid rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${((membersCount) / (sub?.seat_count || 1)) > 1 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${Math.min(((membersCount) / (sub?.seat_count || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-app-border bg-app-surface-solid">
              <h3 className="font-bold text-app-fg text-sm">Billing & Override History</h3>
            </div>
            <div className="p-4 space-y-3">
              {overrides?.length === 0 ? (
                <p className="text-sm text-app-muted italic">No history available for this organization.</p>
              ) : (
                overrides.map((log: any) => (
                  <div key={log.id} className="p-3 bg-app-surface border border-app-border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-app-fg">{log.internal_staff?.email || 'System'}</span>
                      <span className="text-[10px] text-app-muted">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-app-fg mb-1">
                      Changed <strong className="text-app-fg">{log.action_type}</strong> from <span className="line-through opacity-70">{log.old_value}</span> to <span className="text-indigo-500 font-bold">{log.new_value}</span>
                    </div>
                    <div className="text-xs text-app-muted bg-app-surface-solid p-2 rounded text-italic border border-app-border/50">
                      "{log.justification}"
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
