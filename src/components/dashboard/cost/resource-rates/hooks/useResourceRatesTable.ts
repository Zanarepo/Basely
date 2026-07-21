import { useState, useMemo } from 'react'
import { ResourceRate, ResourceType, ResourceUnit } from '@/lib/cost/types'
import { createResourceRate, updateResourceRate, deleteResourceRate, bulkDeleteResourceRates } from '@/lib/cost/actions'

interface UseResourceRatesTableProps {
  projectId: string
  resourceRates: ResourceRate[]
  projectCurrency: string
  onDataChange: () => void
}

export function useResourceRatesTable({
  projectId,
  resourceRates,
  projectCurrency,
  onDataChange
}: UseResourceRatesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<ResourceType>('labor')
  const [rate, setRate] = useState<number>(0)
  const [unit, setUnit] = useState<ResourceUnit>('hr')

  const filteredRates = useMemo(() => {
    if (!searchTerm.trim()) return resourceRates;
    const lowerSearch = searchTerm.toLowerCase();
    return resourceRates.filter(r => 
      r.name.toLowerCase().includes(lowerSearch) || 
      r.type.toLowerCase().includes(lowerSearch)
    );
  }, [resourceRates, searchTerm]);

  const startCreate = () => {
    setName('')
    setType('labor')
    setRate(0)
    setUnit('hr')
    setIsCreating(true)
    setEditingId(null)
  }

  const startEdit = (r: ResourceRate) => {
    setName(r.name)
    setType(r.type)
    setRate(r.rate)
    setUnit(r.unit)
    setEditingId(r.id)
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      if (isCreating) {
        await createResourceRate(projectId, {
          name, type, rate, unit, currency: projectCurrency
        })
      } else if (editingId) {
        await updateResourceRate(editingId, {
          name, type, rate, unit, currency: projectCurrency
        })
      }
      onDataChange()
      cancelEdit()
    } catch (error) {
      console.error('Failed to save resource rate:', error)
      alert('Failed to save resource rate.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource? Any existing assignments will be removed or broken.')) return
    try {
      await deleteResourceRate(id)
      onDataChange()
      setSelectedIds(prev => prev.filter(s => s !== id))
    } catch (error) {
      console.error('Failed to delete resource rate:', error)
      alert('Failed to delete resource rate. It might be assigned to activities.')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} resources?`)) return
    
    try {
      await bulkDeleteResourceRates(selectedIds)
      setSelectedIds([])
      onDataChange()
    } catch (error) {
      console.error('Failed to bulk delete resource rates:', error)
      alert('Failed to delete resource rates.')
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRates.map(r => r.id))
    } else {
      setSelectedIds([])
    }
  }

  return {
    editingId,
    setEditingId,
    isCreating,
    setIsCreating,
    searchTerm,
    setSearchTerm,
    selectedIds,
    setSelectedIds,
    name,
    setName,
    type,
    setType,
    rate,
    setRate,
    unit,
    setUnit,
    filteredRates,
    startCreate,
    startEdit,
    cancelEdit,
    handleSave,
    handleDelete,
    handleBulkDelete,
    handleSelectAll
  }
}
