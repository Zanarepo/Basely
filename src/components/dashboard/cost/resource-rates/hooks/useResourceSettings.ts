import { useState } from 'react'
import { updateGlobalOverhead, updateProjectContingency } from '@/lib/cost/actions'

interface UseResourceSettingsProps {
  projectId: string
  globalOverhead: number
  contingencyAmount: number
  contingencyType: 'flat' | 'percentage'
  onDataChange: () => void
}

export function useResourceSettings({
  projectId,
  globalOverhead,
  contingencyAmount,
  contingencyType,
  onDataChange
}: UseResourceSettingsProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'overhead' | 'contingency'>('overhead')

  // Overhead state
  const [isEditingOverhead, setIsEditingOverhead] = useState(false)
  const [overheadVal, setOverheadVal] = useState<string>(globalOverhead.toString())

  // Contingency state
  const [isEditingContingency, setIsEditingContingency] = useState(false)
  const [contingencyVal, setContingencyVal] = useState<string>(contingencyAmount?.toString() || '0')
  const [selectedContingencyType, setSelectedContingencyType] = useState<'flat' | 'percentage'>(contingencyType || 'flat')

  const handleSaveOverhead = async () => {
    try {
      const val = parseFloat(overheadVal)
      if (isNaN(val) || val < 0) return
      await updateGlobalOverhead(projectId, val)
      onDataChange()
      setIsEditingOverhead(false)
    } catch (error) {
      console.error('Failed to save overhead:', error)
      alert('Failed to save overhead')
    }
  }

  const handleSaveContingency = async () => {
    try {
      const val = parseFloat(contingencyVal)
      if (isNaN(val) || val < 0) return
      await updateProjectContingency(projectId, val, selectedContingencyType)
      onDataChange()
      setIsEditingContingency(false)
    } catch (error) {
      console.error('Failed to save contingency:', error)
      alert('Failed to save contingency')
    }
  }

  return {
    activeSettingsTab,
    setActiveSettingsTab,
    isEditingOverhead,
    setIsEditingOverhead,
    overheadVal,
    setOverheadVal,
    isEditingContingency,
    setIsEditingContingency,
    contingencyVal,
    setContingencyVal,
    selectedContingencyType,
    setSelectedContingencyType,
    handleSaveOverhead,
    handleSaveContingency
  }
}
