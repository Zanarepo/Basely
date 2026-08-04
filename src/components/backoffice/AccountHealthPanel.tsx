'use client'

import { useState, useTransition } from 'react'
import { logHealthNote } from '@/lib/backoffice/assignment-actions'
import { Activity, Loader2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

export function AccountHealthPanel({ organizationId, healthNotes, canEdit }: any) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState('healthy')
  const [note, setNote] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = () => {
    if (!note.trim()) return
    setErrorMsg('')
    startTransition(async () => {
      const result = await logHealthNote(organizationId, status, note)
      if (!result.ok) {
        setErrorMsg(result.error)
      } else {
        setNote('')
        setStatus('healthy')
      }
    })
  }

  return (
    <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-app-border flex gap-2 items-center">
        <Activity className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-app-fg">Account Health Tracking</h3>
      </div>
      
      <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
        {(!healthNotes || healthNotes.length === 0) ? (
          <p className="text-sm text-app-muted italic">No health notes logged yet.</p>
        ) : (
          healthNotes.map((n: any) => (
            <div key={n.id} className="p-3 bg-app-surface border border-app-border rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-app-fg">{n.internal_staff?.email}</span>
                  <span className="text-[10px] text-app-muted">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  n.health_status === 'healthy' ? 'bg-emerald-500/20 text-emerald-500' :
                  n.health_status === 'at-risk' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {n.health_status}
                </span>
              </div>
              <p className="text-sm text-app-fg">{n.notes}</p>
            </div>
          ))
        )}
      </div>

      {canEdit && (
        <div className="p-4 border-t border-app-border bg-app-surface-solid">
          {errorMsg && <p className="text-xs text-rose-500 mb-2">{errorMsg}</p>}
          <div className="space-y-3">
            <EnterpriseSelect
              value={status}
              onChange={(val) => setStatus(val as string)}
              disabled={isPending}
              options={[
                { value: 'healthy', label: 'Healthy' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'churning', label: 'Churning' },
              ]}
            />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={isPending}
              placeholder="Add a note about this account's health..."
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 min-h-[80px]"
            />
            <button
              onClick={handleSave}
              disabled={!note.trim() || isPending}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
