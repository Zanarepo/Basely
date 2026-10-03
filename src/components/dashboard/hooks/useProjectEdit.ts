import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  allow_team_schedule_edits: boolean
}

export function useProjectEdit(project: ProjectType | null, open: boolean, onClose: () => void) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [methodology, setMethodology] = useState<ProjectType['methodology']>('Waterfall')
  const [currency, setCurrency] = useState('USD')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [dailyHours, setDailyHours] = useState(8)
  const [allowTeamScheduleEdits, setAllowTeamScheduleEdits] = useState(false)

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
      setAllowTeamScheduleEdits(project.allow_team_schedule_edits || false)
    }
    setErrorMsg(null)
  }, [project, open])

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

    if (!project) return

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
        allowTeamScheduleEdits,
      })

      if (!result.ok) {
        setErrorMsg(result.error)
        return
      }

      router.refresh()
      onClose()
    })
  }

  const handleToggleAutoSave = (newVal: boolean) => {
    setAllowTeamScheduleEdits(newVal)
    if (!project) return

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
        allowTeamScheduleEdits: newVal,
      })

      if (!result.ok) {
        setErrorMsg(result.error)
        // revert on failure
        setAllowTeamScheduleEdits(!newVal)
        return
      }

      router.refresh()
    })
  }

  return {
    isPending,
    name, setName,
    clientName, setClientName,
    description, setDescription,
    methodology, setMethodology,
    currency, setCurrency,
    startDate, setStartDate,
    endDate, setEndDate,
    workingDays, setWorkingDays,
    dailyHours, setDailyHours,
    allowTeamScheduleEdits, setAllowTeamScheduleEdits,
    errorMsg,
    handleDayToggle,
    handleSubmit,
    handleToggleAutoSave
  }
}
