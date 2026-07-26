import { useState, useEffect } from 'react'
import { 
  getProcurementEntries, 
  upsertProcurementEntry, 
  deleteProcurementEntry,
  getAvailableCostAccounts,
  ProcurementEntry
} from '@/lib/planning/procurement-actions'

export function useProcurementPlan(projectId: string) {
  const [entries, setEntries] = useState<ProcurementEntry[]>([])
  const [costAccounts, setCostAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    const [entriesRes, accountsRes] = await Promise.all([
      getProcurementEntries(projectId),
      getAvailableCostAccounts(projectId)
    ])
    
    if (entriesRes.error) {
      setError(entriesRes.error)
    } else {
      setEntries(entriesRes.entries || [])
    }
    
    if (accountsRes.costAccounts) {
      setCostAccounts(accountsRes.costAccounts)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const saveEntry = async (entry: Partial<ProcurementEntry>) => {
    setIsSaving(true)
    const res = await upsertProcurementEntry(projectId, entry)
    setIsSaving(false)
    if (res.error) {
      setError(res.error)
      return res.error
    } else if (res.entry) {
      // Refresh to get the joined cost account details properly
      await loadData()
    }
  }

  const removeEntry = async (entryId: string) => {
    setIsSaving(true)
    const res = await deleteProcurementEntry(projectId, entryId)
    if (res.error) {
      setError(res.error)
    } else {
      setEntries(prev => prev.filter(e => e.id !== entryId))
    }
    setIsSaving(false)
  }

  return {
    entries,
    costAccounts,
    isLoading,
    isSaving,
    error,
    saveEntry,
    removeEntry,
    refresh: loadData
  }
}
