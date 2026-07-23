'use client'

import { useState } from 'react'
import { DocumentSectionDef } from '@/lib/documents/actions'
import { useTemplateBuilder } from './hooks/useTemplateBuilder'
import { Trash2, GripVertical, Plus, Save, ChevronUp, ChevronDown } from 'lucide-react'

interface TemplateBuilderFormProps {
  initialSections?: DocumentSectionDef[]
  onSave: (sections: DocumentSectionDef[]) => void
  isSaving: boolean
}

export default function TemplateBuilderForm({ initialSections = [], onSave, isSaving }: TemplateBuilderFormProps) {
  const { sections, addSection, updateSection, removeSection, moveSection } = useTemplateBuilder(initialSections)
  const [newSectionKey, setNewSectionKey] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionType, setNewSectionType] = useState<'free_text' | 'data_bound'>('free_text')
  const [newSectionSource, setNewSectionSource] = useState<string>('status.schedule')

  const DATA_SOURCES = [
    { value: 'wbs.dictionary', label: 'WBS Dictionary' },
    { value: 'wbs.prototype', label: 'WBS Prototype' },
    { value: 'raci.matrix', label: 'RACI Matrix' },
    { value: 'status.schedule', label: 'Schedule Status (Gantt)' },
    { value: 'status.cost', label: 'Budget/Cost Status (EVM)' },
    { value: 'status.risks', label: 'Top Risks (Risk Register)' },
    { value: 'project.name', label: 'Project Name' },
    { value: 'project.client_name', label: 'Client Name' },
    { value: 'project.start_date', label: 'Project Start Date' },
    { value: 'project.end_date', label: 'Project End Date' },
    { value: 'project.methodology', label: 'Project Methodology' },
  ]

  const handleAdd = () => {
    if (!newSectionKey.trim() || !newSectionTitle.trim()) return
    addSection({
      key: newSectionKey.trim().toLowerCase().replace(/\s+/g, '_'),
      title: newSectionTitle.trim(),
      type: newSectionType,
      source: newSectionType === 'data_bound' ? newSectionSource : undefined
    })
    setNewSectionKey('')
    setNewSectionTitle('')
    setNewSectionType('free_text')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-surface-alt/30">
          <h3 className="font-semibold text-app-fg text-sm md:text-base">Document Sections</h3>
          <p className="text-xs md:text-sm text-app-muted mt-1">Define the structural blocks for this template. Order matters.</p>
        </div>
        
        <div className="divide-y divide-app-border">
          {sections.length === 0 ? (
            <div className="p-8 text-center text-app-muted text-sm">
              No sections defined yet. Add one below.
            </div>
          ) : (
            sections.map((section, index) => (
              <div key={index} className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                <div className="hidden sm:flex flex-col gap-1 text-app-muted shrink-0">
                  <button 
                    onClick={() => index > 0 && moveSection(index, index - 1)}
                    disabled={index === 0}
                    className="hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-app-muted transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => index < sections.length - 1 && moveSection(index, index + 1)}
                    disabled={index === sections.length - 1}
                    className="hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-app-muted transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 min-w-0 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Title (Visible)</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(index, { title: e.target.value })}
                      className="w-full text-sm px-3 py-1.5 border border-app-border rounded-lg bg-app-surface text-app-fg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Internal Key</label>
                    <input
                      type="text"
                      value={section.key}
                      onChange={(e) => updateSection(index, { key: e.target.value })}
                      className="w-full text-sm px-3 py-1.5 border border-app-border rounded-lg bg-gray-50 dark:bg-app-surface-alt text-app-muted focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                  </div>
                  
                  <div className={section.type === 'data_bound' ? "md:col-span-1" : "md:col-span-2"}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Field Type</label>
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(index, { type: e.target.value as 'free_text' | 'data_bound' })}
                      className="w-full text-sm px-3 py-1.5 border border-app-border rounded-lg bg-app-surface text-app-fg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="free_text">Free Text Input</option>
                      <option value="data_bound">Data Bound (AI Generated)</option>
                    </select>
                  </div>
                  
                  {section.type === 'data_bound' && (
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Data Source</label>
                      <select
                        value={section.source || 'status.schedule'}
                        onChange={(e) => updateSection(index, { source: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border border-app-border rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 focus:ring-1 focus:ring-indigo-500"
                      >
                        {DATA_SOURCES.map(ds => (
                          <option key={ds.value} value={ds.value}>{ds.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex w-full sm:w-auto justify-between sm:justify-end items-center mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-app-border shrink-0">
                  <div className="flex sm:hidden gap-1 text-app-muted">
                    <button 
                      onClick={() => index > 0 && moveSection(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-app-muted transition-colors rounded bg-gray-100 dark:bg-gray-800"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => index < sections.length - 1 && moveSection(index, index + 1)}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:text-indigo-500 disabled:opacity-30 disabled:hover:text-app-muted transition-colors rounded bg-gray-100 dark:bg-gray-800"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeSection(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Section Form */}
        <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-app-surface-alt/30 border-t border-app-border">
          <h4 className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3">Add New Section</h4>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className={newSectionType === 'data_bound' ? "md:col-span-4" : "md:col-span-5"}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Title</label>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => {
                  setNewSectionTitle(e.target.value)
                  // Auto-generate key if empty or matching
                  if (newSectionKey === '' || newSectionKey === newSectionTitle.toLowerCase().replace(/\s+/g, '_').slice(0, -1)) {
                    setNewSectionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                  }
                }}
                placeholder="e.g. Executive Summary"
                className="w-full text-sm px-3 py-2 border border-app-border rounded-lg bg-white dark:bg-app-surface text-app-fg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className={newSectionType === 'data_bound' ? "md:col-span-2" : "md:col-span-3"}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Key</label>
              <input
                type="text"
                value={newSectionKey}
                onChange={(e) => setNewSectionKey(e.target.value)}
                placeholder="executive_summary"
                className="w-full text-sm px-3 py-2 border border-app-border rounded-lg bg-white dark:bg-app-surface text-app-fg focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div className={newSectionType === 'data_bound' ? "md:col-span-2" : "md:col-span-3"}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Type</label>
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value as 'free_text' | 'data_bound')}
                className="w-full text-sm px-3 py-2 border border-app-border rounded-lg bg-white dark:bg-app-surface text-app-fg focus:ring-1 focus:ring-indigo-500"
              >
                <option value="free_text">Free Text</option>
                <option value="data_bound">Data Bound</option>
              </select>
            </div>
            
            {newSectionType === 'data_bound' && (
              <div className="md:col-span-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1 block">Data Source</label>
                <select
                  value={newSectionSource}
                  onChange={(e) => setNewSectionSource(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-indigo-500/30 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 focus:ring-1 focus:ring-indigo-500"
                >
                  {DATA_SOURCES.map(ds => (
                    <option key={ds.value} value={ds.value}>{ds.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="md:col-span-1 flex justify-end md:justify-start">
              <button
                onClick={handleAdd}
                disabled={!newSectionKey || !newSectionTitle}
                className="w-full md:w-auto p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-app-border">
        <button
          onClick={() => onSave(sections)}
          disabled={isSaving || sections.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-indigo-500/20 hover:shadow-md disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Template Definition
        </button>
      </div>
    </div>
  )
}
