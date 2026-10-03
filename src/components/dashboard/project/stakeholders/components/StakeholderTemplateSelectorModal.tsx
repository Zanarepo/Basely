'use client'

import React, { useState } from 'react'
import {
  X,
  Users,
  FileText,
  Check,
  Layers
} from 'lucide-react'
import { STAKEHOLDER_TEMPLATE_VARIANTS, StakeholderTemplateVariant } from '@/lib/documents/stakeholder-templates'

interface StakeholderTemplateSelectorModalProps {
  isOpen: boolean
  currentTemplateId?: string
  onClose: () => void
  onSelectTemplate: (variantId: string) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  FileText
}

export function StakeholderTemplateSelectorModal({
  isOpen,
  currentTemplateId,
  onClose,
  onSelectTemplate,
}: StakeholderTemplateSelectorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!isOpen) return null

  const variants = Object.values(STAKEHOLDER_TEMPLATE_VARIANTS)

  const filteredVariants = variants.filter((v) => {
    if (selectedCategory === 'all') return true
    return v.category === selectedCategory
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-app-surface border border-app-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-app-fg tracking-tight">Stakeholder Register Templates</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider">
                  {variants.length} Formats
                </span>
              </div>
              <p className="text-xs text-app-muted mt-0.5">
                Select a Stakeholder Register format tailored to your specific project needs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-app-bg hover:bg-app-hover border border-app-border text-app-muted hover:text-app-fg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-3 border-b border-app-border bg-app-bg/50 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Templates' },
            { id: 'standard', label: 'Standard Models' },
            { id: 'enterprise', label: 'Enterprise Models' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-app-surface text-app-muted border border-app-border hover:bg-app-hover hover:text-app-fg'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVariants.map((variant) => {
            const IconComp = ICON_MAP[variant.iconName] || Users
            const isSelected = currentTemplateId === variant.id

            return (
              <div
                key={variant.id}
                onClick={() => {
                  onSelectTemplate(variant.id)
                  onClose()
                }}
                className={`group relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                    : 'bg-app-surface border-app-border hover:border-indigo-500/50 hover:shadow-xl'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`p-3 rounded-2xl transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-app-fg group-hover:text-indigo-500 transition-colors">
                      {variant.name}
                    </h3>
                    <p className="text-xs text-app-muted leading-relaxed mt-1">{variant.subtitle}</p>
                  </div>

                  <div className="pt-2 border-t border-app-border/60 space-y-2">
                    <div className="text-[11px] font-extrabold text-app-subtle uppercase tracking-wider">
                      Included Sections ({variant.section_definitions.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {variant.section_definitions.slice(0, 4).map((sec) => (
                        <span
                          key={sec.key}
                          className="px-2 py-0.5 rounded-md bg-app-bg border border-app-border text-[10px] font-medium text-app-muted"
                        >
                          {sec.title}
                        </span>
                      ))}
                      {variant.section_definitions.length > 4 && (
                        <span className="px-2 py-0.5 rounded-md bg-app-bg border border-app-border text-[10px] font-bold text-indigo-500">
                          +{variant.section_definitions.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-app-border/60 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>{isSelected ? 'Currently Selected' : 'Apply This Template'}</span>
                  <span>→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
