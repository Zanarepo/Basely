import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { calculateFinishDate, countWorkingDays } from '@/lib/schedule/cpm'
import type { CalendarConfig } from '@/lib/schedule/cpm'
import type { WbsElement } from '@/lib/wbs/constants'

export type PredecessorInput = {
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

export function useWbsScheduling(element: WbsElement | null, isWorkPackage: boolean) {
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)
  
  const [autoSchedule, setAutoSchedule] = useState<boolean>(true)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [duration, setDuration] = useState<number>(1)
  const [isMilestone, setIsMilestone] = useState<boolean>(false)
  
  const [calendar, setCalendar] = useState<CalendarConfig>({
    workingDays: [1, 2, 3, 4, 5],
    holidays: [],
  })

  const [projectActivities, setProjectActivities] = useState<any[]>([])
  const [predecessors, setPredecessors] = useState<PredecessorInput[]>([])
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  useEffect(() => {
    if (element) {
      setScheduleError(null)
      if (element.isWorkPackage) {
        fetchSchedulingData(element.id, element.projectId)
      } else {
        setActivityId(null)
        setPredecessors([])
        setProjectActivities([])
      }
    }
  }, [element?.id, (element as any)?.updatedAt, isWorkPackage])

  useEffect(() => {
    if (isWorkPackage && element && !activityId) {
      fetchSchedulingData(element.id, element.projectId)
    }
  }, [isWorkPackage])

  const fetchSchedulingData = async (wbsId: string, projectId: string) => {
    setLoadingSchedule(true)
    setScheduleError(null)
    try {
      const supabase = createClient()
      
      const { data: proj } = await supabase
        .from('projects')
        .select('start_date, calendar_config')
        .eq('id', projectId)
        .single()

      let activeCalendar: CalendarConfig = {
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
      }

      if (proj && proj.calendar_config) {
        const config = proj.calendar_config as any
        activeCalendar = {
          workingDays: config.working_days || [1, 2, 3, 4, 5],
          holidays: config.holidays || [],
        }
        setCalendar(activeCalendar)
      }
      
      const { data: act, error: actErr } = await supabase
        .from('activities')
        .select('*')
        .eq('wbs_element_id', wbsId)
        .maybeSingle()

      if (actErr) throw new Error(actErr.message)

      if (act) {
        setActivityId(act.id)
        
        const actDur = act.duration !== null && act.duration !== undefined ? act.duration : 1
        setDuration(actDur)
        setIsMilestone(actDur === 0)
        
        const isAuto = act.constraint_type === 'ASAP'
        setAutoSchedule(isAuto)
        
        const cleanEs = act.es ? act.es.split('T')[0]!.split(' ')[0]! : ''
        const cleanEf = act.ef ? act.ef.split('T')[0]!.split(' ')[0]! : ''
        setStartDate(cleanEs)
        setEndDate(cleanEf)

        const { data: deps, error: depErr } = await supabase
          .from('dependencies')
          .select('*')
          .eq('successor_id', act.id)

        if (depErr) throw new Error(depErr.message)

        setPredecessors(
          (deps || []).map((d) => ({
            predecessorId: d.predecessor_id,
            type: d.type,
            lagDays: d.lag_days,
          }))
        )
      } else {
        setActivityId(null)
        setDuration(1)
        setIsMilestone(false)
        setAutoSchedule(true)
        setStartDate('')
        setEndDate('')
        setPredecessors([])
      }

      const { data: allActs, error: allErr } = await supabase
        .from('activities')
        .select('id, name, wbs_element_id')
        .eq('project_id', projectId)
        .neq('wbs_element_id', wbsId)

      if (allErr) throw new Error(allErr.message)
      setProjectActivities(allActs || [])

    } catch (err: any) {
      console.error(err)
      setScheduleError('Failed to load scheduling data: ' + err.message)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const handleMilestoneChange = (checked: boolean) => {
    setIsMilestone(checked)
    if (checked) {
      setDuration(0)
      if (startDate) setEndDate(startDate)
    } else {
      setDuration(1)
      if (startDate) {
        const nextEnd = calculateFinishDate(startDate, 1, calendar)
        setEndDate(nextEnd)
      }
    }
  }

  const handleDurationChange = (durVal: number) => {
    if (isMilestone) return
    const nextDur = Math.max(1, durVal)
    setDuration(nextDur)

    if (startDate) {
      const nextEnd = calculateFinishDate(startDate, nextDur, calendar)
      setEndDate(nextEnd)
    }
  }

  const handleStartDateChange = (startVal: string) => {
    const cleanVal = startVal ? startVal.split('T')[0]!.split(' ')[0]! : ''
    setStartDate(cleanVal)

    if (cleanVal) {
      if (isMilestone) {
        setEndDate(cleanVal)
      } else if (duration > 0) {
        const nextEnd = calculateFinishDate(cleanVal, duration, calendar)
        setEndDate(nextEnd)
      }
    }
  }

  const handleEndDateChange = (endVal: string) => {
    const cleanVal = endVal ? endVal.split('T')[0]!.split(' ')[0]! : ''
    setEndDate(cleanVal)

    if (startDate && cleanVal) {
      const workingDaysCount = countWorkingDays(startDate, cleanVal, calendar)
      const nextDur = Math.max(1, workingDaysCount + 1)
      setDuration(nextDur)
    }
  }

  const handleTogglePredecessor = (predId: string, checked: boolean) => {
    if (checked) {
      setPredecessors((prev) => [...prev, { predecessorId: predId, type: 'FS', lagDays: 0 }])
    } else {
      setPredecessors((prev) => prev.filter((p) => p.predecessorId !== predId))
    }
  }

  const handleUpdatePredType = (predId: string, type: 'FS' | 'SS' | 'FF' | 'SF') => {
    setPredecessors((prev) =>
      prev.map((p) => (p.predecessorId === predId ? { ...p, type } : p))
    )
  }

  const handleUpdatePredLag = (predId: string, lag: number) => {
    setPredecessors((prev) =>
      prev.map((p) => (p.predecessorId === predId ? { ...p, lagDays: Math.max(0, lag) } : p))
    )
  }

  const refetchSchedulingData = () => {
    if (element && element.isWorkPackage) {
      fetchSchedulingData(element.id, element.projectId)
    }
  }

  return {
    activityId,
    loadingSchedule,
    autoSchedule, setAutoSchedule,
    startDate, setStartDate, handleStartDateChange,
    endDate, setEndDate, handleEndDateChange,
    duration, setDuration, handleDurationChange,
    isMilestone, setIsMilestone: handleMilestoneChange,
    calendar, setCalendar,
    projectActivities, setProjectActivities,
    predecessors, setPredecessors,
    handleTogglePredecessor, handleUpdatePredType, handleUpdatePredLag,
    scheduleError, setScheduleError,
    refetchSchedulingData
  }
}
