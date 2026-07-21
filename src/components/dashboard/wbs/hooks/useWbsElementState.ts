import { useState, useEffect } from 'react'
import type { WbsElement, WbsStatus, DeliverableItem, AcceptanceCriteriaItem } from '@/lib/wbs/constants'

export function useWbsElementState(element: WbsElement | null) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [deliverablesData, setDeliverablesData] = useState<DeliverableItem[]>([])
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [acceptanceCriteriaData, setAcceptanceCriteriaData] = useState<AcceptanceCriteriaItem[]>([])
  const [status, setStatus] = useState<WbsStatus>('Not Started')
  const [isWorkPackage, setIsWorkPackage] = useState(false)

  useEffect(() => {
    if (element) {
      setName(element.name)
      setDescription(element.description ?? '')
      setDeliverables(element.deliverables ?? '')
      setDeliverablesData(element.deliverablesData ?? [])
      setAcceptanceCriteria(element.acceptanceCriteria ?? '')
      setAcceptanceCriteriaData(element.acceptanceCriteriaData ?? [])
      setStatus(element.status)
      setIsWorkPackage(element.isWorkPackage)
    }
  }, [element])

  return {
    name, setName,
    description, setDescription,
    deliverables, setDeliverables,
    deliverablesData, setDeliverablesData,
    acceptanceCriteria, setAcceptanceCriteria,
    acceptanceCriteriaData, setAcceptanceCriteriaData,
    status, setStatus,
    isWorkPackage, setIsWorkPackage
  }
}
