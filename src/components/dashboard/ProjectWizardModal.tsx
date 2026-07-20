'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Briefcase, Loader2, ShieldAlert } from 'lucide-react'
import { createProject } from '@/lib/projects/actions'

type ProjectWizardModalProps = {
  open: boolean
  onClose: () => void
  organizationId: string
}

type MethodologyType = 'Waterfall' | 'Agile' | 'Hybrid'

const METHODOLOGIES: MethodologyType[] = ['Waterfall', 'Agile', 'Hybrid']
const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'NGN', symbol: '?' },
  { code: 'EUR', symbol: '?' },
  { code: 'GBP', symbol: '?' },
]
const DAYS_OF_WEEK = [
  { name: 'Sun', value: 0 }, { name: 'Mon', value: 1 }, { name: 'Tue', value: 2 },
  { name: 'Wed', value: 3 }, { name: 'Thu', value: 4 }, { name: 'Fri', value: 5 },
  { name: 'Sat', value: 6 },
]

export function ProjectWizardModal({ open, onClose, organizationId }: ProjectWizardModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [methodology, setMethodology] = useState<MethodologyType>('Waterfall')
  const [currency, setCurrency] = useState('USD')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [dailyHours, setDailyHours] = useState(8)
  const [allowTeamScheduleEdits, setAllowTeamScheduleEdits] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!open) return null

  const handleClose = () => {
    if (isPending) return
    setName(''); setClientName(''); setDescription(''); setMethodology('Waterfall')
    setCurrency('USD'); setStartDate(''); setEndDate(''); setWorkingDays([1, 2, 3, 4, 5])
    setDailyHours(8); setAllowTeamScheduleEdits(false); setErrorMsg(null); onClose()
  }

  const handleDayToggle = (day: number) => {
    setWorkingDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort())
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMsg(null)
    if (!name.trim()) return setErrorMsg('Project name is required')
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return setErrorMsg('End date must be on or after start date')
    }
    if (!workingDays.length) return setErrorMsg('Please select at least one working day')

    startTransition(async () => {
      const result = await createProject(organizationId, {
        name, clientName: clientName.trim() || null, description: description.trim() || null,
        methodology, currency, startDate: startDate || null, endDate: endDate || null,
        calendarConfig: { working_days: workingDays, daily_hours: dailyHours },
        allowTeamScheduleEdits,
      })
      if (!result.ok) return setErrorMsg(result.error)
      router.refresh()
      handleClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative flex w-full max-w-lg max-h-[calc(100vh-2rem)] flex-col overflow-hidden auth-card !p-0 shadow-2xl animate-fade-in">
          <div className="shrink-0 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-500"><Briefcase className="h-5 w-5" /></div>
                <div><h2 className="text-lg font-bold text-app-fg">New Project</h2><p className="text-sm text-app-muted">Set up metadata and calendar configurations.</p></div>
              </div>
              <button type="button" onClick={handleClose} disabled={isPending} className="btn-icon !border-0 !bg-transparent" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            {errorMsg && <div className="flex items-start gap-3 p-4 mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm"><ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" /><span>{errorMsg}</span></div>}
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
              <div className="space-y-2"><label htmlFor="project-name" className="auth-label">Project Name <span className="text-rose-500">*</span></label><input id="project-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} placeholder="e.g. Q3 Commercial Launch" className="auth-input pl-4" /></div>
              <div className="space-y-2"><label htmlFor="project-client" className="auth-label">Client Name</label><input id="project-client" value={clientName} onChange={(event) => setClientName(event.target.value)} disabled={isPending} placeholder="e.g. Acme Corp" className="auth-input pl-4" /></div>
              <div className="space-y-2"><label htmlFor="project-description" className="auth-label">Description</label><textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={isPending} placeholder="Describe the main deliverables and objectives..." className="auth-input pl-4 py-3 min-h-[80px] resize-none" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><label htmlFor="project-methodology" className="auth-label">Methodology</label><select id="project-methodology" value={methodology} onChange={(event) => setMethodology(event.target.value as MethodologyType)} disabled={isPending} className="auth-input pl-3 cursor-pointer">{METHODOLOGIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
                <div className="space-y-2"><label htmlFor="project-currency" className="auth-label">Currency</label><select id="project-currency" value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={isPending} className="auth-input pl-3 cursor-pointer">{CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.code} ({item.symbol})</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><label htmlFor="project-start" className="auth-label">Start Date</label><input id="project-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={isPending} className="auth-input pl-4" /></div>
                <div className="space-y-2"><label htmlFor="project-end" className="auth-label">End Date</label><input id="project-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={isPending} className="auth-input pl-4" /></div>
              </div>
              <div className="space-y-2"><span className="auth-label block">Working Days</span><div className="flex flex-wrap gap-2">{DAYS_OF_WEEK.map((day) => { const active = workingDays.includes(day.value); return <button key={day.value} type="button" onClick={() => handleDayToggle(day.value)} disabled={isPending} className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${active ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/35' : 'bg-app-muted-surface text-app-muted border-app-border hover:bg-app-hover'}`}>{day.name}</button> })}</div></div>
              <div className="space-y-2"><label htmlFor="project-hours" className="auth-label">Daily Work Hours</label><input id="project-hours" type="number" min="1" max="24" value={dailyHours} onChange={(event) => setDailyHours(parseInt(event.target.value, 10) || 8)} disabled={isPending} className="auth-input pl-4" /></div>

              <div className="pt-4 mt-6 border-t border-app-border space-y-4">
                <h3 className="text-sm font-semibold text-app-fg mb-4">Advanced Settings</h3>
                <div className="flex items-center justify-between p-4 bg-app-surface border border-app-border rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-app-fg">Allow Team Schedule Edits</div>
                    <div className="text-xs text-app-muted mt-1">If enabled, team members assigned as "Responsible" can adjust task durations and dates.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={allowTeamScheduleEdits}
                      onChange={(e) => setAllowTeamScheduleEdits(e.target.checked)}
                      disabled={isPending}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-app-border px-6 py-4 mt-2 bg-app-surface-solid/80"><button type="button" onClick={handleClose} disabled={isPending} className="btn-secondary">Cancel</button><button type="submit" disabled={isPending} className="btn-primary">{isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</> : 'Create Project'}</button></div>
          </form>
        </div>
      </div>
    </div>
  )
}
