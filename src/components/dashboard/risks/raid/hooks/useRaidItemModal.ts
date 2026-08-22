import { useState, useEffect } from 'react'
import { upsertRaidEntry, type RaidLogEntry, type RaidCategory, type RaidStatus, type RaidPriority } from '@/lib/raid/actions'
import { getWbsElements } from '@/lib/wbs/core-actions'
import type { WbsElement } from '@/lib/wbs/constants'

export function useRaidItemModal(
  isOpen: boolean,
  onClose: () => void,
  projectId: string,
  organizationId: string,
  initialCategory: RaidCategory = 'risk',
  initialData?: RaidLogEntry | null,
  onSuccess?: (entry: RaidLogEntry) => void,
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
) {
  const [category, setCategory] = useState<RaidCategory>(initialData?.category || initialCategory)
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [status, setStatus] = useState<RaidStatus>(initialData?.status || 'open')
  const [priority, setPriority] = useState<RaidPriority>(initialData?.priority || 'medium')
  const [externalOwner, setExternalOwner] = useState(initialData?.external_owner_name || '')
  const [validationDueDate, setValidationDueDate] = useState(initialData?.validation_due_date || '')
  const [targetResolutionDate, setTargetResolutionDate] = useState(initialData?.target_resolution_date || '')
  const [mitigationPlan, setMitigationPlan] = useState(initialData?.mitigation_plan || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const [loadingWbs, setLoadingWbs] = useState(false)
  const [wbsSearch, setWbsSearch] = useState('')

  const [selectedWbsIds, setSelectedWbsIds] = useState<string[]>(() => {
    if (!initialData?.linked_wbs_element_id) return []
    return initialData.linked_wbs_element_id
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategory(initialData.category || 'risk')
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setStatus(initialData.status || 'open')
        setPriority(initialData.priority || 'medium')
        setExternalOwner(initialData.external_owner_name || '')
        setValidationDueDate(initialData.validation_due_date || '')
        setTargetResolutionDate(initialData.target_resolution_date || '')
        setMitigationPlan(initialData.mitigation_plan || '')
        if (!initialData.linked_wbs_element_id) {
          setSelectedWbsIds([])
        } else {
          setSelectedWbsIds(
            initialData.linked_wbs_element_id
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          )
        }
      } else {
        setCategory(initialCategory || 'risk')
        setTitle('')
        setDescription('')
        setStatus('open')
        setPriority('medium')
        setExternalOwner('')
        setValidationDueDate('')
        setTargetResolutionDate('')
        setMitigationPlan('')
        setSelectedWbsIds([])
      }
      setError(null)
    }
  }, [isOpen, initialData, initialCategory])

  useEffect(() => {
    if (!isOpen || !projectId) return
    let isMounted = true
    const fetchWbs = async () => {
      setLoadingWbs(true)
      const res = await getWbsElements(projectId)
      if (isMounted && res.ok && res.data) {
        setWbsElements(res.data)
      }
      if (isMounted) setLoadingWbs(false)
    }
    fetchWbs()
    return () => { isMounted = false }
  }, [isOpen, projectId])

  const isAssumption = category === 'assumption'
  const isDependency = category === 'dependency'

  const handleToggleWbs = (id: string) => {
    setSelectedWbsIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('A descriptive title is required for PMO audit logging.')
      return
    }
    
    setIsSaving(true)
    setError(null)

    const payload: Partial<RaidLogEntry> = {
      id: initialData?.id,
      organization_id: organizationId,
      project_id: projectId,
      category,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      external_owner_name: isDependency ? externalOwner.trim() : undefined,
      validation_due_date: isAssumption ? validationDueDate : undefined,
      target_resolution_date: targetResolutionDate || undefined,
      mitigation_plan: mitigationPlan.trim() || undefined,
      linked_wbs_element_id: selectedWbsIds.length > 0 ? selectedWbsIds.join(',') : undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const res = await upsertRaidEntry(payload)

    setIsSaving(false)
    if (!res.ok) {
      setError(res.error || 'Failed to persist RAID item to Supabase schema.')
      if (onShowToast) onShowToast('error', res.error || 'Failed to save RAID governance item.')
      return
    }

    const savedEntry = (res.data || { ...payload, id: crypto.randomUUID() }) as RaidLogEntry

    if (onShowToast) {
      onShowToast('success', initialData ? 'RAID governance entry updated successfully!' : 'New RAID governance item logged successfully!')
    }
    if (onSuccess) onSuccess(savedEntry)
    onClose()
  }

  return {
    category, setCategory,
    title, setTitle,
    description, setDescription,
    status, setStatus,
    priority, setPriority,
    externalOwner, setExternalOwner,
    validationDueDate, setValidationDueDate,
    targetResolutionDate, setTargetResolutionDate,
    mitigationPlan, setMitigationPlan,
    isSaving,
    error,
    wbsElements,
    loadingWbs,
    wbsSearch, setWbsSearch,
    selectedWbsIds,
    isAssumption,
    isDependency,
    handleToggleWbs,
    handleSave
  }
}
