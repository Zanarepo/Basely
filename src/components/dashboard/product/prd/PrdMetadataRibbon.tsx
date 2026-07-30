'use client'

import React, { useState, useEffect } from 'react'
import type { Persona, OkrObjective, ProductRequirementsDoc } from '@/lib/product-strategy/types'
import { getPersonas, getOkrObjectives } from '@/lib/product-strategy/actions'
import { getPrdMetadata, upsertPrdMetadata } from '@/lib/product-discovery/actions'
import { FileText, User, Target, Link2, Loader2, Check, Palette } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface PrdMetadataRibbonProps {
  projectId: string
  organizationId: string
}

export function PrdMetadataRibbon({ projectId, organizationId }: PrdMetadataRibbonProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [objectives, setObjectives] = useState<OkrObjective[]>([])
  const [prdMeta, setPrdMeta] = useState<ProductRequirementsDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [personaId, setPersonaId] = useState('')
  const [okrId, setOkrId] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [prdStatus, setPrdStatus] = useState<string>('draft')

  useEffect(() => {
    if (!organizationId) return
    setLoading(true)
    Promise.all([
      getPersonas(organizationId, projectId),
      getOkrObjectives(organizationId, projectId),
      getPrdMetadata(organizationId, projectId)
    ]).then(([p, o, m]) => {
      setPersonas(p)
      setObjectives(o)
      if (m.length > 0) {
        const meta = m[0]
        setPrdMeta(meta)
        setPersonaId(meta.target_persona_id || '')
        setOkrId(meta.primary_okr_id || '')
        setFigmaUrl(meta.figma_url || '')
        setPrdStatus(meta.prd_status || 'draft')
      }
      setLoading(false)
    })
  }, [organizationId, projectId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const payload: Partial<ProductRequirementsDoc> = {
      ...(prdMeta?.id ? { id: prdMeta.id } : {}),
      organization_id: organizationId,
      project_id: projectId,
      target_persona_id: personaId || null,
      primary_okr_id: okrId || null,
      figma_url: figmaUrl || null,
      prd_status: prdStatus as any
    }
    const result = await upsertPrdMetadata(payload)
    if (result.ok && result.data) {
      setPrdMeta(result.data)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-800/40 rounded-2xl p-4 border border-violet-200/60 dark:border-slate-700 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span className="text-xs font-semibold text-slate-500">Loading PRD metadata...</span>
      </div>
    )
  }

  const selectedPersona = personas.find(p => p.id === personaId)
  const selectedOkr = objectives.find(o => o.id === okrId)

  return (
    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-800/40 rounded-2xl p-4 lg:p-5 border border-violet-200/60 dark:border-slate-700">
      {/* Ribbon Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
          <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">PRD Studio — Strategic Metadata</span>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Target Persona */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            <User className="w-2.5 h-2.5" /> Target Persona
          </label>
          <EnterpriseSelect
            value={personaId}
            onChange={setPersonaId}
            placeholder="— Select Persona —"
            options={[
              { value: '', label: '— Select Persona —' },
              ...personas.map(p => ({ value: p.id, label: `${p.name} (${p.role_title})` }))
            ]}
          />
        </div>

        {/* Primary OKR */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            <Target className="w-2.5 h-2.5" /> Primary OKR
          </label>
          <EnterpriseSelect
            value={okrId}
            onChange={setOkrId}
            placeholder="— Select OKR Objective —"
            options={[
              { value: '', label: '— Select OKR Objective —' },
              ...objectives.map(o => ({ value: o.id, label: o.title }))
            ]}
          />
        </div>

        {/* Figma URL */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            <Link2 className="w-2.5 h-2.5" /> Figma URL
          </label>
          <input
            type="url"
            value={figmaUrl}
            onChange={e => setFigmaUrl(e.target.value)}
            placeholder="https://figma.com/file/..."
            className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Status + Save */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Status
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <EnterpriseSelect
                value={prdStatus}
                onChange={setPrdStatus}
                options={[
                  { value: 'draft', label: '📝 Draft' },
                  { value: 'in_review', label: '👀 In Review' },
                  { value: 'approved', label: '✅ Approved' },
                  { value: 'deprecated', label: '🛑 Deprecated' },
                ]}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ cursor: 'pointer' }}
              className="px-3 py-2 rounded-xl bg-[#6b4eff] hover:bg-[#5839ec] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5" />
              ) : null}
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Figma Preview (if URL exists) */}
      {figmaUrl && figmaUrl.includes('figma.com') && (
        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <Palette className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Figma Embed</span>
          </div>
          <iframe
            src={`https://www.figma.com/embed?embed_host=basely&url=${encodeURIComponent(figmaUrl)}`}
            className="w-full h-[400px] bg-white dark:bg-slate-800"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
