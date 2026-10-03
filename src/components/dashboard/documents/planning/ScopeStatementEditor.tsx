'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useScopeStatement } from './hooks/useScopeStatement'
import { getWbsElements } from '@/lib/wbs/core-actions'
import { WbsElement } from '@/lib/wbs/constants'
import { AlertCircle, Plus, Check, Loader2, Save, X, Lightbulb, Link, Wand2 } from 'lucide-react'
import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'

interface ScopeStatementEditorProps {
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ScopeStatementEditor({
  projectId,
  hasEditAccess,
  onShowToast
}: ScopeStatementEditorProps) {
  const { data, isLoading, isSaving, error, saveData } = useScopeStatement(projectId)
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(false)

  // Local state for the form
  const [formData, setFormData] = useState({
    in_scope_summary: '',
    out_of_scope: '',
    assumptions: '',
    constraints: '',
    anchored_wbs_element_ids: [] as string[]
  })

  // Sync loaded data to local state
  useEffect(() => {
    if (data) {
      setFormData({
        in_scope_summary: data.in_scope_summary || '',
        out_of_scope: data.out_of_scope || '',
        assumptions: data.assumptions || '',
        constraints: data.constraints || '',
        anchored_wbs_element_ids: data.anchored_wbs_element_ids || []
      })
    }
  }, [data])

  // Fetch WBS Elements for anchoring (Top Level Only)
  useEffect(() => {
    const fetchWbs = async () => {
      const res = await getWbsElements(projectId)
      if (res.ok && res.data) {
        // Filter top-level elements (parent_id is null)
        setWbsElements(res.data.filter((w: WbsElement) => w.parentId === null))
      }
    }
    fetchWbs()
  }, [projectId])

  // Auto-save with debounce (1 second delay)
  useEffect(() => {
    // Skip auto-save on initial load to prevent saving empty state
    if (!isMountedRef.current) {
      isMountedRef.current = true
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveData(formData)
        // Clear error on successful auto-save
        // Note: We can't directly clear hook's error state, but successful save will override it
      } catch (err) {
        // Error will be caught by saveData hook and set in error state
        console.error('Auto-save failed:', err)
      }
    }, 1000)

    // Cleanup timeout on unmount or before next effect run
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, projectId, saveData]) // Re-run when formData or projectId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      isMountedRef.current = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleWbsToggle = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.anchored_wbs_element_ids.includes(id)
      const nextIds = isSelected
        ? prev.anchored_wbs_element_ids.filter(x => x !== id)
        : [...prev.anchored_wbs_element_ids, id]
      return { ...prev, anchored_wbs_element_ids: nextIds }
    })
  }

  const handleSave = async () => {
    // Clear any pending auto-save to prevent race conditions
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const success = await saveData(formData)
    if (success) {
      onShowToast?.('success', 'Scope Statement saved successfully.')
    } else {
      onShowToast?.('error', 'Failed to save Scope Statement.')
    }
  }

  if (isLoading) {
    return <DocumentLoader message="Loading Scope Statement..." />
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-bg shrink-0">
        <div>
          <h2 className="text-lg font-bold text-app-fg tracking-tight">Scope Statement</h2>
          <p className="text-sm text-app-muted">Define the project boundaries, assumptions, and constraints.</p>
        </div>

        {hasEditAccess && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        )}

        {/* Auto-save indicator */}
        {!hasEditAccess && !isLoading && !isSaving && (
          <div className="text-xs text-app-muted text-right mt-2">
            Auto-save enabled
          </div>
        )}
      </div>

      {/* Save Error Display - Visible regardless of onShowToast prop */}
      {error && (
        <div className="p-4 mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700">
          <div className="flex items-start">
            <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-rose-800">Save Error</h3>
              <div className="mt-1 text-sm text-rose-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 overflow-y-auto space-y-8 no-scrollbar bg-app-bg/50 flex-1">

        <div className="space-y-4">
          <label className="block text-sm font-bold text-app-fg">In-Scope Summary</label>
          <textarea
            name="in_scope_summary"
            value={formData.in_scope_summary}
            onChange={handleChange}
            readOnly={!hasEditAccess}
            placeholder="Describe what is explicitly included in the project scope..."
            className="w-full bg-app-surface border border-app-border rounded-lg p-3 text-app-fg placeholder-app-muted text-sm min-h-[120px] focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all resize-y"
          />
        </div>

        {wbsElements.length > 0 && (
          <div className="space-y-4 p-5 bg-app-surface border border-app-border rounded-xl">
            <label className="block text-sm font-bold text-app-fg">Anchored WBS Elements</label>
            <p className="text-xs text-app-muted mb-2">Select top-level WBS elements that represent the in-scope deliverables.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wbsElements.map(wbs => (
                <label key={wbs.id} className="flex items-start gap-3 p-3 rounded-lg border border-app-border bg-app-bg hover:border-violet-500/30 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.anchored_wbs_element_ids.includes(wbs.id)}
                    onChange={() => handleWbsToggle(wbs.id)}
                    disabled={!hasEditAccess}
                    className="mt-1 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-app-fg group-hover:text-violet-500 transition-colors">{wbs.code} {wbs.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-bold text-app-fg">Out of Scope</label>
          <textarea
            name="out_of_scope"
            value={formData.out_of_scope}
            onChange={handleChange}
            readOnly={!hasEditAccess}
            placeholder="Describe what is explicitly excluded from the project..."
            className="w-full bg-app-surface border border-app-border rounded-lg p-3 text-app-fg placeholder-app-muted text-sm min-h-[120px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-app-fg">Assumptions</label>
            <textarea
              name="assumptions"
              value={formData.assumptions}
              onChange={handleChange}
              readOnly={!hasEditAccess}
              placeholder="List project assumptions (e.g., resource availability, external dependencies)..."
              className="w-full bg-app-surface border border-app-border rounded-lg p-3 text-app-fg placeholder-app-muted text-sm min-h-[120px] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-y"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-app-fg">Constraints</label>
            <textarea
              name="constraints"
              value={formData.constraints}
              onChange={handleChange}
              readOnly={!hasEditAccess}
              placeholder="List project constraints (e.g., budget limits, hard deadlines)..."
              className="w-full bg-app-surface border border-app-border rounded-lg p-3 text-app-fg placeholder-app-muted text-sm min-h-[120px] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-y"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
