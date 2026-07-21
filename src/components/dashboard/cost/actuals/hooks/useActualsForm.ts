import { useState, useMemo } from 'react'
import type { WbsCostData } from '@/lib/cost/types'
import { recordActualCost, updateActualCost } from '@/lib/actuals/actions'

interface UseActualsFormProps {
  wbsCostData: WbsCostData[]
  projectCurrency: string
  onDataChange: () => void
}

export function useActualsForm({ wbsCostData, projectCurrency, onDataChange }: UseActualsFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formWbsId, setFormWbsId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formDesc, setFormDesc] = useState('')

  const availableWorkPackages = useMemo(() => {
    return wbsCostData.filter((w) => {
      if (!w.isWorkPackage) return false;
      if (editingId && w.wbsId === formWbsId) return true;
      return !w.actualCosts || w.actualCosts.length === 0;
    });
  }, [wbsCostData, editingId, formWbsId]);

  const resetForm = () => {
    setFormWbsId('')
    setFormAmount('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormDesc('')
  }

  const openAddForm = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(true)
  }

  const openEditForm = (actual: { id: string; wbs_element_id: string; amount: number; date: string; description: string | null }) => {
    setFormWbsId(actual.wbs_element_id)
    setFormAmount(actual.amount.toString())
    setFormDate(actual.date)
    setFormDesc(actual.description || '')
    setEditingId(actual.id)
    setIsAdding(true)
  }

  const handleSave = async () => {
    if (!formWbsId || !formAmount || !formDate) return
    setIsSaving(true)
    try {
      if (editingId) {
        await updateActualCost(editingId, {
          wbs_element_id: formWbsId,
          amount: parseFloat(formAmount),
          date: formDate,
          description: formDesc || null
        })
      } else {
        await recordActualCost({
          wbs_element_id: formWbsId,
          amount: parseFloat(formAmount),
          currency: projectCurrency,
          date: formDate,
          description: formDesc,
          source: 'manual'
        })
      }
      setIsAdding(false)
      setEditingId(null)
      resetForm()
      onDataChange()
    } catch (err: any) {
      alert(err.message || 'Failed to save actual cost')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isAdding,
    setIsAdding,
    isSaving,
    editingId,
    setEditingId,
    formWbsId,
    setFormWbsId,
    formAmount,
    setFormAmount,
    formDate,
    setFormDate,
    formDesc,
    setFormDesc,
    availableWorkPackages,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave
  }
}
