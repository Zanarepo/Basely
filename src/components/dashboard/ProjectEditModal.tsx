'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Briefcase,
  Layers,
  DollarSign,
  Calendar,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { updateProject } from '@/lib/projects/actions'

type ProjectType = {
  id: string
  name: string
  clientName: string | null
  description: string | null
  methodology: 'Waterfall' | 'Agile' | 'Hybrid'
  currency: string
  startDate: string | null
  endDate: string | null
  calendarConfig: {
    working_days: number[]
    daily_hours: number
  }
}

type ProjectEditModalProps = {
  open: boolean
  onClose: () => void
  project: ProjectType | null
}

const METHODOLOGIES = ['Waterfall', 'Agile', 'Hybrid'] as const
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

const DAYS_OF_WEEK = [
  { name: 'Sun', value: 0 },
  { name: 'Mon', value: 1 },
  { name: 'Tue', value: 2 },
  { name: 'Wed', value: 3 },
  { name: 'Thu', value: 4 },
  { name: 'Fri', value: 5 },
  { name: 'Sat', value: 6 },
]

export function ProjectEditModal({
  open,
  onClose,
  project,
}: ProjectEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [methodology, setMethodology] = useState<typeof METHODOLOGIES[number]>('Waterfall')
  const [currency, setCurrency] = useState('USD')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [dailyHours, setDailyHours] = useState(8)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setClientName(project.clientName || '')
      setDescription(project.description || '')
      setMethodology(project.methodology)
      setCurrency(project.currency)
      setStartDate(project.startDate || '')
      setEndDate(project.endDate || '')
      setWorkingDays(project.calendarConfig?.working_days || [1, 2, 3, 4, 5])
      setDailyHours(project.calendarConfig?.daily_hours || 8)
    }
    setErrorMsg(null)
  }, [project, open])

  if (!open || !project) return null

  const handleDayToggle = (dayValue: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) {
      setErrorMsg('Project name is required')
      return
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setErrorMsg('End date must be on or after start date')
      return
    }

    if (workingDays.length === 0) {
      setErrorMsg('Please select at least one working day')
      return
    }

    startTransition(async () => {
      const result = await updateProject(project.id, {
        name,
        clientName: clientName.trim() || null,
        description: description.trim() || null,
        methodology,
        currency,
        startDate: startDate || null,
        endDate: endDate || null,
        calendarConfig: {
          working_days: workingDays,
          daily_hours: dailyHours,
        },
      })

      if (!result.ok) {
        setErrorMsg(result.error)
        return
      }

      router.refresh()
      onClose()
    })
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
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-app-fg">Edit Project</h2>
                  <p className="text-sm text-app-muted">Update metadata and calendar configurations.</p>
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

            {errorMsg && (
              <div className="flex items-start gap-3 p-4 mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-name" className="auth-label">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="auth-input pl-4"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-client" className="auth-label">
              Client Name
            </label>
            <input
              id="edit-client"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={isPending}
              className="auth-input pl-4"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-description" className="auth-label">
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className="auth-input pl-4 py-3 min-h-[70px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-methodology" className="auth-label">
                Methodology
              </label>
              <select
                id="edit-methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value as any)}
                disabled={isPending}
                className="auth-input pl-3 cursor-pointer"
              >
                {METHODOLOGIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-currency" className="auth-label">
                Currency
              </label>
              <select
                id="edit-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isPending}
                className="auth-input pl-3 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-start" className="auth-label">
                Start Date
              </label>
              <input
                id="edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                className="auth-input pl-4"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-end" className="auth-label">
                End Date
              </label>
              <input
                id="edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
                className="auth-input pl-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="auth-label block">Working Days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const active = workingDays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleDayToggle(d.value)}
                    disabled={isPending}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/35'
                        : 'bg-app-muted-surface text-app-muted border-app-border hover:bg-app-hover'
                    }`}
                  >
                    {d.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-hours" className="auth-label">
              Daily Work Hours
            </label>
            <input
              id="edit-hours"
              type="number"
              min="1"
              max="24"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseInt(e.target.value) || 8)}
              disabled={isPending}
              className="auth-input pl-4"
            />
          </div>

            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-app-border px-6 py-4 mt-2 bg-app-surface-solid/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
