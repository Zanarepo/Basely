'use client'

import React, { useState } from 'react'
import type { OkrObjective, OkrKeyResult } from '@/lib/product-strategy/types'
import { deleteOkrObjective, updateOkrObjective } from '@/lib/product-strategy/actions'
import { KeyResultRow } from './KeyResultRow'
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Loader2, Target, User, Calendar, X } from 'lucide-react'

interface OkrObjectiveCardProps {
  objective: OkrObjective
  hasEditAccess: boolean
  onEditObjective: (obj: OkrObjective) => void
  onDeletedObjective: (id: string) => void
  onAddKeyResult: (objectiveId: string) => void
  onEditKeyResult: (kr: OkrKeyResult) => void
  onDeletedKeyResult: (krId: string, objId: string) => void
  onUpdatedKeyResult: (kr: OkrKeyResult) => void
  onUpdatedObjective: (obj: OkrObjective) => void
}

export function OkrObjectiveCard({
  objective,
  hasEditAccess,
  onEditObjective,
  onDeletedObjective,
  onAddKeyResult,
  onEditKeyResult,
  onDeletedKeyResult,
  onUpdatedKeyResult,
  onUpdatedObjective
}: OkrObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Custom attribute addition state
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')
  const [isAddingAttr, setIsAddingAttr] = useState(false)

  const statusColors = {
    on_track: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    at_risk: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    behind: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  }

  const handleDeleteObjective = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasEditAccess || isDeleting) return
    setIsDeleting(true)
    const { ok } = await deleteOkrObjective(objective.id)
    if (ok) {
      onDeletedObjective(objective.id)
    } else {
      setIsDeleting(false)
    }
  }

  const handleAddAttribute = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newAttrKey.trim() || !newAttrVal.trim()) return
    setIsAddingAttr(true)
    const updatedAttrs = { ...(objective.custom_attributes || {}), [newAttrKey.trim()]: newAttrVal.trim() }
    onUpdatedObjective({ ...objective, custom_attributes: updatedAttrs })
    setNewAttrKey('')
    setNewAttrVal('')
    await updateOkrObjective(objective.id, { custom_attributes: updatedAttrs })
    setIsAddingAttr(false)
  }

  const handleRemoveAttribute = async (key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updatedAttrs = { ...(objective.custom_attributes || {}) }
    delete updatedAttrs[key]
    onUpdatedObjective({ ...objective, custom_attributes: updatedAttrs })
    await updateOkrObjective(objective.id, { custom_attributes: updatedAttrs })
  }

  const krs = objective.key_results || []
  const computedProgress = krs.length > 0 
    ? Math.round(krs.reduce((s, k) => s + (k.progress || 0), 0) / krs.length) 
    : objective.progress || 0

  return (
    <div className="group/obj relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Objective Header Bar */}
      <div className="p-5 bg-slate-50/70 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setIsExpanded(!isExpanded)
              }}
              style={{ cursor: 'pointer' }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors shrink-0"
              title={isExpanded ? "Collapse Key Results" : "Expand Key Results"}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 uppercase tracking-wider shrink-0">
                  OBJECTIVE
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${statusColors[objective.status as keyof typeof statusColors] || 'bg-slate-200 text-slate-700'}`}>
                  {objective.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {objective.title}
              </h3>
            </div>
          </div>

          {/* Rollup Progress Badge */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">ROLLUP PROGRESS</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{computedProgress}%</span>
            </div>

            {/* Hover-only Edit & Delete buttons */}
            {hasEditAccess && (
              <div className="flex items-center gap-1 opacity-0 group-hover/obj:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onEditObjective(objective)
                  }}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Objective details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteObjective}
                  disabled={isDeleting}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  title="Delete Objective & Key Results"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Objective Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3 pl-9">
          {objective.owner && (
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              Owner: <strong>{objective.owner}</strong>
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Timeframe: <strong>{objective.timeframe}</strong>
          </span>
          {objective.description && (
            <span className="text-slate-600 dark:text-slate-400 italic truncate max-w-md">
              "{objective.description}"
            </span>
          )}
        </div>

        {/* Custom Attributes on Objective */}
        {objective.custom_attributes && Object.keys(objective.custom_attributes).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pl-9">
            {Object.entries(objective.custom_attributes).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 text-[11px] font-medium text-slate-700 dark:text-slate-300 group/chip relative">
                <strong className="text-indigo-500">{k}:</strong> {v}
                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveAttribute(k, e)}
                    style={{ cursor: 'pointer' }}
                    className="text-slate-400 hover:text-rose-500 ml-1 transition-opacity duration-200 opacity-0 group-hover/chip:opacity-100"
                    title="Remove custom column"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Key Results Roster */}
      {isExpanded && (
        <div className="p-5 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500" />
              Measurable Key Results ({krs.length})
            </span>

            {hasEditAccess && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onAddKeyResult(objective.id)
                }}
                style={{ cursor: 'pointer' }}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Key Result
              </button>
            )}
          </div>

          {krs.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
              No measurable Key Results added to this Objective yet. Click "+ Add Key Result" above to attach quantifiable outcomes and target baselines.
            </div>
          ) : (
            <div className="space-y-2.5">
              {krs.map((kr) => (
                <KeyResultRow
                  key={kr.id}
                  keyResult={kr}
                  hasEditAccess={hasEditAccess}
                  onDeleted={onDeletedKeyResult}
                  onUpdated={onUpdatedKeyResult}
                  onEdit={onEditKeyResult}
                />
              ))}
            </div>
          )}

          {/* Quick Add Custom Column Footer */}
          {hasEditAccess && (
            <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <input
                type="text"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Custom Objective Column (e.g. Squad / Dependency)..."
                className="w-1/3 px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Value (e.g. Core Checkout Team)..."
                className="w-1/3 px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                disabled={isAddingAttr || !newAttrKey.trim() || !newAttrVal.trim()}
                style={{ cursor: 'pointer' }}
                className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shrink-0 transition-colors disabled:opacity-40 inline-flex items-center gap-1"
              >
                {isAddingAttr ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add Metadata
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
