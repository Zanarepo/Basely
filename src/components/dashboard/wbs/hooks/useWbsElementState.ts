import { useState, useEffect } from 'react'
import type { WbsElement, WbsStatus, DeliverableItem, AcceptanceCriteriaItem, ChecklistItem } from '@/lib/wbs/constants'

export function useWbsElementState(element: WbsElement | null) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [deliverablesData, setDeliverablesData] = useState<DeliverableItem[]>([])
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [acceptanceCriteriaData, setAcceptanceCriteriaData] = useState<AcceptanceCriteriaItem[]>([])
  const [userStoriesData, setUserStoriesData] = useState<ChecklistItem[]>([])
  const [edgeCasesData, setEdgeCasesData] = useState<ChecklistItem[]>([])
  const [priority, setPriority] = useState<string | null>(null)
  const [status, setStatus] = useState<WbsStatus>('Not Started')
  const [isWorkPackage, setIsWorkPackage] = useState(false)
  const [cost, setCost] = useState<number | undefined>(undefined)
  const [estimationMethod, setEstimationMethod] = useState<'analogous' | 'parametric' | 'bottom_up'>('bottom_up')

  useEffect(() => {
    if (element) {
      setName(element.name)
      setDescription(element.description ?? '')
      setDeliverables(element.deliverables ?? '')
      setDeliverablesData(element.deliverablesData ?? [])
      setAcceptanceCriteria(element.acceptanceCriteria ?? '')
      setAcceptanceCriteriaData(element.acceptanceCriteriaData ?? [])
      setUserStoriesData(element.userStoriesData ?? [])
      setEdgeCasesData(element.edgeCasesData ?? [])
      setPriority(element.priority ?? null)
      setStatus(element.status)
      setIsWorkPackage(element.isWorkPackage)
      setCost(element.cost)
      setEstimationMethod(element.estimationMethod ?? 'bottom_up')
    }
  }, [element])

  return {
    name, setName,
    description, setDescription,
    deliverables, setDeliverables,
    deliverablesData, setDeliverablesData,
    acceptanceCriteria, setAcceptanceCriteria,
    acceptanceCriteriaData, setAcceptanceCriteriaData,
    userStoriesData, setUserStoriesData,
    edgeCasesData, setEdgeCasesData,
    priority, setPriority,
    status, setStatus,
    isWorkPackage, setIsWorkPackage,
    cost, setCost,
    estimationMethod, setEstimationMethod
  }
}
