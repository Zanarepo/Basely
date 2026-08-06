'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createTicketAction } from '@/lib/support/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import EnterpriseSelect from '../common/EnterpriseSelect'
import { X, LifeBuoy, Loader2, ShieldAlert } from 'lucide-react'

interface SupportDashboardClientProps {
  initialTickets: any[]
  organizationId: string
  projects: any[]
}

export function SupportDashboardClient({ initialTickets, organizationId, projects }: SupportDashboardClientProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-surface border-b border-app-border">
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Subject</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Project</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Priority</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Created</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-app-hover">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/support/${t.id}`} className="font-bold text-app-fg text-sm hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-app-muted">
                  {t.projects?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold ${
                    t.priority === 'urgent' ? 'text-red-500' :
                    t.priority === 'high' ? 'text-orange-500' :
                    'text-app-muted'
                  }`}>
                    {t.priority.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    t.status === 'resolved' || t.status === 'closed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-app-muted">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/support/${t.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-600/20 transition-colors text-xs cursor-pointer">
                    Open Chat
                  </Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-app-muted">
                  You haven't opened any support tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          organizationId={organizationId}
          projects={projects}
          onClose={() => setIsModalOpen(false)} 
          onTicketCreated={(ticket) => {
            setTickets([ticket, ...tickets])
          }}
        />
      )}
    </div>
  )
}

function CreateTicketModal({ organizationId, projects, onClose, onTicketCreated }: { organizationId: string, projects: any[], onClose: () => void, onTicketCreated: (ticket: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState('medium')
  const router = useRouter()

  const projectOptions = [
    { value: '', label: 'No Project (General)' },
    ...projects.map(p => ({ value: p.id, label: p.name }))
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low (General question)' },
    { value: 'medium', label: 'Medium (Issue, but not blocking)' },
    { value: 'high', label: 'High (Blocking work)' },
    { value: 'urgent', label: 'Urgent (System down)' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await createTicketAction(formData)
      
      const newTicket = {
        id: result.ticketId,
        subject: formData.get('subject') as string,
        priority: priority,
        status: 'open',
        created_at: new Date().toISOString(),
        projects: projects.find(p => p.id === projectId) || null
      }
      
      onTicketCreated(newTicket)
      toast.success('Support ticket logged successfully!')
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden auth-card !p-0 shadow-2xl animate-fade-in">
          <div className="shrink-0 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-500">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-app-fg">Create Support Ticket</h2>
                  <p className="text-sm text-app-muted">Submit a request to our support team.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="priority" value={priority} />
            
            <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-5 py-2">
              <div className="space-y-2">
                <label className="auth-label">Project (Optional)</label>
                <EnterpriseSelect 
                  value={projectId}
                  onChange={setProjectId}
                  options={projectOptions}
                  placeholder="Select a related project..."
                />
              </div>

              <div className="space-y-2">
                <label className="auth-label">Subject <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="subject" 
                  required
                  className="auth-input pl-4"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="space-y-2">
                <label className="auth-label">Description <span className="text-rose-500">*</span></label>
                <textarea 
                  name="description" 
                  required
                  rows={4}
                  className="auth-input pl-4 py-3 min-h-[100px] resize-none"
                  placeholder="Provide as much detail as possible..."
                />
              </div>

              <div className="space-y-2">
                <label className="auth-label">Priority</label>
                <EnterpriseSelect 
                  value={priority}
                  onChange={setPriority}
                  options={priorityOptions}
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-app-border px-6 py-4 mt-4 bg-app-surface-solid/80">
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
