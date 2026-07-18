import { useState, useEffect } from 'react'
import { DEFAULT_WBS_STATUSES, WbsElement } from '@/lib/wbs/constants'

export type BoardColumnDef = {
  name: string
  color: string
}

// Generate deterministic colors for custom columns
function getColumnColor(name: string): string {
  const colors = ['#94a3b8', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function useWbsBoard(projectId: string, elements: WbsElement[]) {
  const [columns, setColumns] = useState<BoardColumnDef[]>([])
  const [taskOrders, setTaskOrders] = useState<Record<string, string[]>>({})

  // Load saved custom columns or initialize with defaults
  useEffect(() => {
    const savedCols = localStorage.getItem(`wbs_board_cols_${projectId}`)
    const savedOrders = localStorage.getItem(`wbs_board_orders_${projectId}`)

    let initialColumns: string[] = [...DEFAULT_WBS_STATUSES]
    if (savedCols) {
      try {
        const parsed = JSON.parse(savedCols)
        if (Array.isArray(parsed) && parsed.length > 0) initialColumns = parsed
      } catch (e) {
        console.error('Failed to parse saved columns', e)
      }
    }

    let initialOrders: Record<string, string[]> = {}
    if (savedOrders) {
      try {
        initialOrders = JSON.parse(savedOrders)
      } catch (e) {
        console.error('Failed to parse saved orders', e)
      }
    }

    // Ensure any status that currently exists in the data is also present in columns
    const statusesInData = new Set(elements.map(e => e.status))
    statusesInData.forEach(s => {
      if (!initialColumns.includes(s)) {
        initialColumns.push(s)
      }
    })

    const columnDefs = initialColumns.map(name => {
      if (name === 'Not Started') return { name, color: '#94a3b8' }
      if (name === 'In Progress') return { name, color: '#6366f1' }
      if (name === 'Complete') return { name, color: '#10b981' }
      if (name === 'On Hold') return { name, color: '#f59e0b' }
      return { name, color: getColumnColor(name) }
    })

    // Validate and fill task orders based on current elements
    const updatedOrders = { ...initialOrders }
    columnDefs.forEach(col => {
      if (!updatedOrders[col.name]) updatedOrders[col.name] = []
      
      const tasksForCol = elements.filter(e => e.status === col.name && e.isWorkPackage)
      const existingIds = updatedOrders[col.name]
      
      // Remove stale IDs
      const validIds = existingIds.filter(id => tasksForCol.some(t => t.id === id))
      
      // Add new IDs at the end
      tasksForCol.forEach(t => {
        if (!validIds.includes(t.id)) validIds.push(t.id)
      })
      
      updatedOrders[col.name] = validIds
    })

    setColumns(columnDefs)
    setTaskOrders(updatedOrders)
  }, [projectId, elements])

  const addColumn = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || columns.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return false

    const newColumnNames = [...columns.map(c => c.name), trimmed]
    localStorage.setItem(`wbs_board_cols_${projectId}`, JSON.stringify(newColumnNames))
    
    setColumns(prev => [...prev, { name: trimmed, color: getColumnColor(trimmed) }])
    return true
  }

  const deleteColumn = (name: string) => {
    const newColumnNames = columns.map(c => c.name).filter(c => c !== name)
    localStorage.setItem(`wbs_board_cols_${projectId}`, JSON.stringify(newColumnNames))
    setColumns(prev => prev.filter(c => c.name !== name))
  }

  const renameColumn = (oldName: string, newName: string): boolean => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return false
    if (columns.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName)) return false

    const newColumnNames = columns.map(c => c.name === oldName ? trimmed : c.name)
    localStorage.setItem(`wbs_board_cols_${projectId}`, JSON.stringify(newColumnNames))

    // Migrate task orders to the new column name
    setTaskOrders(prev => {
      const next = { ...prev }
      if (next[oldName]) {
        next[trimmed] = next[oldName]
        delete next[oldName]
        localStorage.setItem(`wbs_board_orders_${projectId}`, JSON.stringify(next))
      }
      return next
    })

    setColumns(prev => prev.map(c => c.name === oldName ? { ...c, name: trimmed } : c))
    return true
  }

  const moveTask = (taskId: string, sourceCol: string, targetCol: string, targetIndex: number) => {
    setTaskOrders(prev => {
      const next = { ...prev }
      if (!next[sourceCol]) next[sourceCol] = []
      if (!next[targetCol]) next[targetCol] = []

      // Remove from source
      const sourceList = [...next[sourceCol]]
      const taskIndex = sourceList.indexOf(taskId)
      if (taskIndex !== -1) sourceList.splice(taskIndex, 1)
      next[sourceCol] = sourceList

      // Add to target
      const targetList = sourceCol === targetCol ? sourceList : [...next[targetCol]]
      targetList.splice(targetIndex, 0, taskId)
      next[targetCol] = targetList

      localStorage.setItem(`wbs_board_orders_${projectId}`, JSON.stringify(next))
      return next
    })
  }

  const reorderColumn = (sourceIndex: number, targetIndex: number) => {
    setColumns(prev => {
      const newCols = [...prev]
      const [moved] = newCols.splice(sourceIndex, 1)
      newCols.splice(targetIndex, 0, moved)
      
      const newColumnNames = newCols.map(c => c.name)
      localStorage.setItem(`wbs_board_cols_${projectId}`, JSON.stringify(newColumnNames))
      return newCols
    })
  }

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  useEffect(() => {
    const savedHidden = localStorage.getItem(`wbs_board_hidden_${projectId}`)
    if (savedHidden) {
      try {
        setHiddenColumns(new Set(JSON.parse(savedHidden)))
      } catch (e) {
        console.error('Failed to parse hidden columns', e)
      }
    }
  }, [projectId])

  const toggleColumnVisibility = (name: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      localStorage.setItem(`wbs_board_hidden_${projectId}`, JSON.stringify(Array.from(next)))
      return next
    })
  }

  return {
    columns,
    taskOrders,
    addColumn,
    deleteColumn,
    renameColumn,
    moveTask,
    reorderColumn,
    hiddenColumns,
    toggleColumnVisibility
  }
}
