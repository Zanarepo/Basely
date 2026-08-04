'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react'
import { ErpConfig, getExternalChartOfAccounts, getOrgWbsElements, saveAccountMappingAction } from '@/lib/erp/actions'
import { ExternalAccount } from '@/lib/erp/adapters/types'

export interface WbsOption {
  id: string
  name: string
  code: string
  project_id: string
  projectName: string
}

export interface AccountMappingItem {
  wbsElementId: string
  wbsName: string
  projectId: string
  projectName?: string
}

export interface UseAccountMappingReturn {
  accounts: ExternalAccount[]
  wbsElements: WbsOption[]
  mappings: Record<string, AccountMappingItem>
  loading: boolean
  saving: boolean
  saveSuccess: boolean
  error: string | null
  filterText: string
  categoryFilter: string
  setFilterText: (text: string) => void
  setCategoryFilter: (cat: string) => void
  updateMapping: (accountId: string, wbsElementId: string | null) => void
  autoMapSuggestions: () => void
  saveMappings: () => Promise<boolean>
  filteredAccounts: ExternalAccount[]
  stats: {
    total: number
    mapped: number
    unmapped: number
    completionRatio: number
  }
}

export function useAccountMapping(config: ErpConfig | undefined, organizationId: string): UseAccountMappingReturn {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([])
  const [wbsElements, setWbsElements] = useState<WbsOption[]>([])
  const [mappings, setMappings] = useState<Record<string, AccountMappingItem>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [saving, startSaving] = useTransition()

  const fetchAccountsAndWbs = useCallback(async () => {
    if (!config || !organizationId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [accs, wbs] = await Promise.all([
        getExternalChartOfAccounts(config.id),
        getOrgWbsElements(organizationId)
      ])
      setAccounts(accs)
      setWbsElements(wbs)
      setMappings((config.account_mapping || {}) as Record<string, AccountMappingItem>)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load chart of accounts or WBS elements')
    } finally {
      setLoading(false)
    }
  }, [config, organizationId])

  useEffect(() => {
    fetchAccountsAndWbs()
  }, [fetchAccountsAndWbs])

  const wbsMap = useMemo(() => {
    const m: Record<string, WbsOption> = {}
    wbsElements.forEach(item => { m[item.id] = item })
    return m
  }, [wbsElements])

  const updateMapping = (accountId: string, wbsElementId: string | null) => {
    setSaveSuccess(false)
    setMappings(prev => {
      const copy = { ...prev }
      if (!wbsElementId || !wbsMap[wbsElementId]) {
        delete copy[accountId]
      } else {
        const item = wbsMap[wbsElementId]
        copy[accountId] = {
          wbsElementId: item.id,
          wbsName: `${item.code} - ${item.name}`,
          projectId: item.project_id,
          projectName: item.projectName
        }
      }
      return copy
    })
  }

  const autoMapSuggestions = () => {
    setSaveSuccess(false)
    if (wbsElements.length === 0) return

    setMappings(prev => {
      const copy = { ...prev }
      accounts.forEach((acc, index) => {
        if (!copy[acc.id] && index < wbsElements.length) {
          // Leave the 6th account unmapped intentionally in demo/auto-map so partial sync failures can be demonstrated
          if (acc.code === '6500') return
          const item = wbsElements[index % wbsElements.length]
          copy[acc.id] = {
            wbsElementId: item.id,
            wbsName: `${item.code} - ${item.name}`,
            projectId: item.project_id,
            projectName: item.projectName
          }
        }
      })
      return copy
    })
  }

  const saveMappings = async (): Promise<boolean> => {
    if (!config) return false
    return new Promise(resolve => {
      startSaving(async () => {
        setError(null)
        setSaveSuccess(false)
        const res = await saveAccountMappingAction(config.id, mappings)
        if (res.success) {
          setSaveSuccess(true)
          resolve(true)
        } else {
          setError(res.error || 'Failed to save account mappings')
          resolve(false)
        }
      })
    })
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesText = filterText === '' || 
        acc.name.toLowerCase().includes(filterText.toLowerCase()) || 
        acc.code.toLowerCase().includes(filterText.toLowerCase()) ||
        acc.category.toLowerCase().includes(filterText.toLowerCase())
      
      const matchesCat = categoryFilter === 'ALL' || acc.type === categoryFilter
      
      return matchesText && matchesCat
    })
  }, [accounts, filterText, categoryFilter])

  const stats = useMemo(() => {
    const total = accounts.length
    const mapped = accounts.filter(a => !!mappings[a.id]).length
    const unmapped = total - mapped
    const completionRatio = total > 0 ? Math.round((mapped / total) * 100) : 0
    return { total, mapped, unmapped, completionRatio }
  }, [accounts, mappings])

  return {
    accounts,
    wbsElements,
    mappings,
    loading,
    saving,
    saveSuccess,
    error,
    filterText,
    categoryFilter,
    setFilterText,
    setCategoryFilter,
    updateMapping,
    autoMapSuggestions,
    saveMappings,
    filteredAccounts,
    stats
  }
}
