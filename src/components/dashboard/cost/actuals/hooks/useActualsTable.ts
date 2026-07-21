import { useState, useMemo } from 'react'
import type { WbsCostData } from '@/lib/cost/types'
import { deleteActualCost, bulkDeleteActualCosts } from '@/lib/actuals/actions'

const ITEMS_PER_PAGE = 10

interface UseActualsTableProps {
  wbsCostData: WbsCostData[]
  onDataChange: () => void
}

export function useActualsTable({ wbsCostData, onDataChange }: UseActualsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const allActuals = useMemo(() => {
    return wbsCostData.flatMap((w) => w.actualCosts.map((a) => ({
      ...a,
      wbsCode: w.wbsCode,
      wbsName: w.wbsName
    }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [wbsCostData])

  const filteredActuals = useMemo(() => {
    if (!searchTerm) return allActuals
    const lower = searchTerm.toLowerCase()
    return allActuals.filter((a) => 
      a.wbsCode.toLowerCase().includes(lower) || 
      a.wbsName.toLowerCase().includes(lower) || 
      (a.description && a.description.toLowerCase().includes(lower))
    )
  }, [allActuals, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredActuals.length / ITEMS_PER_PAGE))
  
  const paginatedActuals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredActuals.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredActuals, currentPage])

  const totalActual = useMemo(() => {
    return allActuals.reduce((acc, a) => acc + (a.amount || 0), 0)
  }, [allActuals])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this actual cost?')) return
    try {
      await deleteActualCost(id)
      onDataChange()
      setSelectedIds((prev) => prev.filter((s) => s !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} actual costs?`)) return
    
    try {
      await bulkDeleteActualCosts(selectedIds)
      setSelectedIds([])
      onDataChange()
    } catch (err: any) {
      alert(err.message || 'Failed to delete actuals')
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedActuals.map((a) => a.id))
    } else {
      setSelectedIds([])
    }
  }

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedActuals,
    filteredActualsLength: filteredActuals.length,
    selectedIds,
    setSelectedIds,
    totalActual,
    allActuals,
    handleDelete,
    handleBulkDelete,
    handleSelectAll,
    ITEMS_PER_PAGE
  }
}
