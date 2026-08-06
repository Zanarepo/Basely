'use client'

import React, { useState } from 'react'
import { createSystemAnnouncement, toggleSystemAnnouncement, deleteSystemAnnouncement } from '@/lib/backoffice/actions'
import { Megaphone, Trash2, Power, Info, AlertTriangle, AlertOctagon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

export function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: any[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [newType, setNewType] = useState('info')
  const [newLink, setNewLink] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage) return
    setLoading(true)
    try {
      await createSystemAnnouncement({
        message: newMessage,
        type: newType as 'info'|'warning'|'critical',
        link_url: newLink
      })
      toast.success('Announcement created and activated!')
      setShowCreate(false)
      setNewMessage('')
      setNewLink('')
      // Need a full page reload or proper server action mutation to reflect immediately, but next router revalidatePath handles it!
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, currentlyActive: boolean) => {
    try {
      await toggleSystemAnnouncement(id, !currentlyActive)
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteSystemAnnouncement(id)
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const getTypeIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
    if (type === 'critical') return <AlertOctagon className="w-4 h-4 text-red-500" />
    return <Info className="w-4 h-4 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-app-fg">Manage Announcements</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {showCreate ? 'Cancel' : <><Plus className="w-4 h-4"/> New Announcement</>}
        </button>
      </div>

      {showCreate && (
        <div className="p-6 bg-app-surface border border-app-border rounded-2xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-app-fg mb-1">Message</label>
              <input
                type="text"
                required
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="e.g., Scheduled maintenance on Sunday at 2 AM UTC"
                className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-app-fg mb-1">Severity Type</label>
                <EnterpriseSelect
                  value={newType}
                  onChange={setNewType}
                  options={[
                    { value: 'info', label: 'Info (Blue)' },
                    { value: 'warning', label: 'Warning (Yellow)' },
                    { value: 'critical', label: 'Critical (Red)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-app-fg mb-1">Link URL (Optional)</label>
                <input
                  type="url"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  placeholder="https://status.example.com"
                  className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl focus:border-indigo-500 outline-none transition-colors h-[38px]"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {loading ? 'Publishing...' : 'Publish Announcement'}
              </button>
              <p className="text-xs text-app-muted mt-2">Publishing will automatically deactivate any currently active announcement.</p>
            </div>
          </form>
        </div>
      )}

      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-app-surface border-b border-app-border text-xs uppercase tracking-wider text-app-muted font-bold">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {announcements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-app-muted">
                  No announcements found.
                </td>
              </tr>
            )}
            {announcements.map((ann) => (
              <tr key={ann.id} className="group hover:bg-app-hover transition-colors">
                <td className="px-6 py-4">
                  {ann.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-surface border border-app-border text-app-muted text-xs font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-app-muted"></div> Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTypeIcon(ann.type)}</div>
                    <div>
                      <p className="text-sm font-semibold text-app-fg">{ann.message}</p>
                      {ann.link_url && <a href={ann.link_url} target="_blank" className="text-xs text-indigo-400 hover:underline">{ann.link_url}</a>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-app-muted font-mono text-xs">
                  {new Date(ann.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggle(ann.id, ann.is_active)}
                      className={`cursor-pointer p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold ${ann.is_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
                      title={ann.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                      {ann.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="cursor-pointer p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
