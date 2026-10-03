import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/projects/actions'
import { useUserPersona } from '@/hooks/use-user-persona'

export type MethodologyType = 'Waterfall' | 'Agile' | 'Hybrid'

interface UseProjectWizardModalProps {
  organizationId: string
  onClose: () => void
}

export function useProjectWizardModal({ organizationId, onClose }: UseProjectWizardModalProps) {
  const router = useRouter()
  const { showBudgetControls } = useUserPersona()
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

  return {
    showBudgetControls,
    isPending,
    name, setName,
    clientName, setClientName,
    description, setDescription,
    methodology, setMethodology,
    currency, setCurrency,
    startDate, setStartDate,
    endDate, setEndDate,
    workingDays,
    dailyHours, setDailyHours,
    allowTeamScheduleEdits, setAllowTeamScheduleEdits,
    errorMsg,
    handleClose,
    handleDayToggle,
    handleSubmit
  }
}
