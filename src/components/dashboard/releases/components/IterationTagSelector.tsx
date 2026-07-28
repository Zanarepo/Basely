'use client'

import React, { useState, useEffect } from 'react'
import { Layers, Zap, Loader2, Check } from 'lucide-react'
import { useIterationTagging } from '../hooks/useIterationTagging'
import { getIterationLabel } from '@/lib/releases/types'

interface IterationTagSelectorProps {
  projectId: string
  entityType: 'wbs_element' | 'activity'
  entityId: string
  currentIterationId?: string | null
  methodology?: string | null
  disabled?: boolean
  onUpdated?: (newIterationId: string | null) => void
}

export function IterationTagSelector({
  projectId,
  entityType,
  entityId,
  currentIterationId,
  methodology = 'Agile',
  disabled = false,
  onUpdated,
}: IterationTagSelectorProps) {
  const { iterations, loading: hookLoading, tagWorkItem } = useIterationTagging(projectId)
  const [selectedId, setSelectedId] = useState<string>(currentIterationId || '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    setSelectedId(currentIterationId || '')
  }, [currentIterationId, entityId])

  const defaultLabel = getIterationLabel(methodology)
  const isSprint = defaultLabel === 'Sprint'

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value || null
    setSelectedId(val || '')
    setSaving(true)
    const res = await tagWorkItem(entityType, entityId, val)
    setSaving(false)
    if (res.ok) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
      if (onUpdated) onUpdated(val)
    }
  }

  if (iterations.length === 0 && !currentIterationId) {
    return null // Only render if iterations exist for this project
  }

  return (
    <div className="flex items-center gap-1.5 bg-app-surface/60 border border-app-border rounded-xl px-3 py-1.5 text-xs font-semibold text-app-fg shadow-xs">
      {isSprint ? (
        <Zap className="h-3.5 w-3.5 text-purple-500 shrink-0" />
      ) : (
        <Layers className="h-3.5 w-3.5 text-teal-500 shrink-0" />
      )}
      
      <span className="text-app-muted shrink-0">{defaultLabel}:</span>

      <select
        value={selectedId}
        onChange={handleChange}
        disabled={disabled || saving || hookLoading}
        className="bg-transparent text-xs font-bold text-app-fg focus:outline-none cursor-pointer border-none p-0 pr-1 truncate max-w-[150px]"
      >
        <option value="">-- Unmapped --</option>
        {iterations.map(i => {
          const lbl = getIterationLabel(methodology, i.labelOverride)
          return (
            <option key={i.id} value={i.id} className="bg-app-card text-app-fg">
              [{lbl}] {i.name}
            </option>
          )
        })}
      </select>

      {saving && <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin shrink-0 ml-1" />}
      {justSaved && !saving && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1 animate-in zoom-in-50" />}
    </div>
  )
}
