'use client'

import React, { useState, useEffect } from 'react'
import type { Persona } from '@/lib/product-strategy/types'
import { createPersona, updatePersona } from '@/lib/product-strategy/actions'
import { X, Save, Check, Plus, Trash2, Loader2 } from 'lucide-react'

interface PersonaBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (persona: Persona) => void
  organizationId: string
  projectId?: string
  existingPersona?: Persona | null
}

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#64748b'  // Slate
]

export function PersonaBuilderModal({
  isOpen,
  onClose,
  onSaved,
  organizationId,
  projectId,
  existingPersona
}: PersonaBuilderModalProps) {
  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [avatarColor, setAvatarColor] = useState('#6366f1')
  const [demographics, setDemographics] = useState('')
  const [jtbdStatement, setJtbdStatement] = useState('')
  const [motivations, setMotivations] = useState('')
  const [painPoints, setPainPoints] = useState('')
  const [preferredTools, setPreferredTools] = useState('')
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({})
  const [newAttrKey, setNewAttrKey] = useState('')
  const [newAttrVal, setNewAttrVal] = useState('')
  const [isProjectScoped, setIsProjectScoped] = useState(!!projectId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingPersona) {
      setName(existingPersona.name || '')
      setRoleTitle(existingPersona.role_title || '')
      setAvatarColor(existingPersona.avatar_color || '#6366f1')
      setDemographics(existingPersona.demographics || '')
      setJtbdStatement(existingPersona.jtbd_statement || '')
      setMotivations(existingPersona.motivations || '')
      setPainPoints(existingPersona.pain_points || '')
      setPreferredTools(existingPersona.preferred_tools || '')
      setCustomAttributes(existingPersona.custom_attributes || {})
      setIsProjectScoped(!!existingPersona.project_id)
    } else {
      setName('')
      setRoleTitle('')
      setAvatarColor('#6366f1')
      setDemographics('')
      setJtbdStatement('')
      setMotivations('')
      setPainPoints('')
      setPreferredTools('')
      setCustomAttributes({})
      setIsProjectScoped(!!projectId)
    }
    setError(null)
  }, [existingPersona, isOpen, projectId])

  const handleAddAttribute = () => {
    if (!newAttrKey.trim() || !newAttrVal.trim()) return
    setCustomAttributes(prev => ({ ...prev, [newAttrKey.trim()]: newAttrVal.trim() }))
    setNewAttrKey('')
    setNewAttrVal('')
  }

  const handleRemoveAttribute = (keyToRemove: string) => {
    const updated = { ...customAttributes }
    delete updated[keyToRemove]
    setCustomAttributes(updated)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !roleTitle.trim()) {
      setError('Please provide a Name and Role Title.')
      return
    }

    setLoading(true)
    setError(null)

    const payload: Partial<Persona> = {
      organization_id: organizationId,
      project_id: isProjectScoped ? projectId || null : null,
      name: name.trim(),
      role_title: roleTitle.trim(),
      avatar_color: avatarColor,
      demographics: demographics.trim() || null,
      jtbd_statement: jtbdStatement.trim() || null,
      motivations: motivations.trim() || null,
      pain_points: painPoints.trim() || null,
      preferred_tools: preferredTools.trim() || null,
      custom_attributes: customAttributes
    }

    let res
    if (existingPersona?.id) {
      res = await updatePersona(existingPersona.id, payload)
    } else {
      res = await createPersona(payload)
    }

    setLoading(false)

    if (!res.ok) {
      setError(res.error || 'An error occurred while saving the persona.')
    } else if (res.data) {
      onSaved(res.data)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {existingPersona ? 'Edit Customer Persona' : 'Create Customer Persona'}
          </h2>
          <button
            onClick={onClose}
            style={{ cursor: 'pointer' }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Persona Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena the Enterprise Dev"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Role / Job Title *
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
              Avatar Accent Color
            </label>
            <div className="flex items-center space-x-2.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  style={{ backgroundColor: color, cursor: 'pointer' }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                    avatarColor === color ? 'ring-2 ring-offset-2 ring-slate-700 dark:ring-slate-200 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {avatarColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Demographics & Background
            </label>
            <input
              type="text"
              value={demographics}
              onChange={(e) => setDemographics(e.target.value)}
              placeholder="e.g. 5+ years tech experience, remote worker, early adopter"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-1.5">
              Jobs To Be Done (JTBD) Statement
            </label>
            <textarea
              rows={2}
              value={jtbdStatement}
              onChange={(e) => setJtbdStatement(e.target.value)}
              placeholder="When I am... I want to... So I can..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1.5">
                Key Motivations & Drivers
              </label>
              <textarea
                rows={3}
                value={motivations}
                onChange={(e) => setMotivations(e.target.value)}
                placeholder="What goals inspire this user? What leads to their success?"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase mb-1.5">
                Pain Points & Frustrations
              </label>
              <textarea
                rows={3}
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Where do they waste time? What tools or processes frustrate them?"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all resize-y"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              Preferred Tool Stack
            </label>
            <input
              type="text"
              value={preferredTools}
              onChange={(e) => setPreferredTools(e.target.value)}
              placeholder="e.g. GitHub, Slack, Linear, VS Code"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Dynamic Custom Attributes / Document Columns */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Dynamic Document Fields & Columns
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Add custom attributes (e.g. Willingness to Pay, Region)</span>
            </div>

            {Object.keys(customAttributes).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(customAttributes).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs group relative">
                    <strong className="text-indigo-600 dark:text-indigo-400">{key}:</strong> {val}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveAttribute(key)
                      }}
                      style={{ cursor: 'pointer' }}
                      className="text-slate-400 hover:text-red-500 ml-1 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Column Name (e.g. Buying Authority)"
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                placeholder="Value (e.g. High / Executive)"
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                style={{ cursor: 'pointer' }}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shrink-0 transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {projectId && (
            <div className="flex items-center pt-2 border-t border-slate-100 dark:border-slate-700">
              <input
                id="scopedCheckbox"
                type="checkbox"
                checked={isProjectScoped}
                onChange={(e) => setIsProjectScoped(e.target.checked)}
                className="w-4 h-4 text-indigo-500 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="scopedCheckbox" className="ml-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer" style={{ cursor: 'pointer' }}>
                Scope strictly to this project (Uncheck to share across all organization projects)
              </label>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Saving...' : existingPersona ? 'Save Changes' : 'Create Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
