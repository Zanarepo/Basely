'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Edit3, Settings } from 'lucide-react'
import { CustomDocumentTemplate, getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '@/lib/documents/template-actions'
import TemplateBuilderForm from './TemplateBuilderForm'
import { DocumentSectionDef } from '@/lib/documents/actions'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

interface TemplatesWorkspaceProps {
  organizationId: string
}

export default function TemplatesWorkspace({ organizationId }: TemplatesWorkspaceProps) {
  const [templates, setTemplates] = useState<CustomDocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Partial<CustomDocumentTemplate> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const loadTemplates = async () => {
    setLoading(true)
    const data = await getCustomTemplates(organizationId)
    setTemplates(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTemplates()
  }, [organizationId])

  const handleCreateNew = () => {
    setEditingTemplate({
      organization_id: organizationId,
      document_type: 'status_report',
      name: 'New Custom Template',
      description: '',
      section_definitions: []
    })
  }

  const handleSave = async (sections: DocumentSectionDef[]) => {
    if (!editingTemplate) return
    setIsSaving(true)
    const result = await saveCustomTemplate({
      ...editingTemplate,
      section_definitions: sections
    })

    if (result.ok) {
      showToast('success', 'Template saved successfully')
      setEditingTemplate(null)
      loadTemplates()
    } else {
      showToast('error', result.error || 'Failed to save template')
    }
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? Any documents generated with it will still exist but will lose their layout reference.')) return
    
    const result = await deleteCustomTemplate(id)
    if (result.ok) {
      showToast('success', 'Template deleted')
      loadTemplates()
    } else {
      showToast('error', result.error || 'Failed to delete template')
    }
  }

  if (editingTemplate) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setEditingTemplate(null)}
            className="text-app-muted hover:text-app-fg transition-colors"
          >
            &larr; Back to Templates
          </button>
        </div>

        <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2 block">Template Name</label>
              <input
                type="text"
                value={editingTemplate.name || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-app-surface-alt border border-app-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-app-fg transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2 block">Document Type</label>
              <select
                value={editingTemplate.document_type || 'status_report'}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev!, document_type: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-app-surface-alt border border-app-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-app-fg transition-all"
              >
                <option value="status_report">Status Report</option>
                <option value="charter">Project Charter</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted mb-2 block">Description (Optional)</label>
              <input
                type="text"
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev!, description: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-app-surface-alt border border-app-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-app-fg transition-all"
                placeholder="Brief description of when to use this template..."
              />
            </div>
          </div>

          <TemplateBuilderForm 
            initialSections={editingTemplate.section_definitions || []}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-app-fg flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            Custom Document Templates
          </h2>
          <p className="text-sm text-app-muted mt-1">Define organization-wide structures for generating Charters and Status Reports.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-app-surface border border-dashed border-app-border rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-app-fg mb-2">No custom templates yet</h3>
          <p className="text-app-muted max-w-sm mb-6 text-sm">
            You're using the default system templates for all documents. Create a custom template to enforce your organization's specific reporting structure.
          </p>
          <button
            onClick={handleCreateNew}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
          >
            Create your first template <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingTemplate(template)}
                    className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                    title="Edit Template"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 text-app-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-app-fg text-lg mb-1">{template.name}</h3>
              <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-3">
                {template.document_type.replace('_', ' ')}
              </p>
              
              <p className="text-sm text-app-muted line-clamp-2 min-h-[2.5rem]">
                {template.description || "No description provided."}
              </p>
              
              <div className="mt-4 pt-4 border-t border-app-border flex items-center justify-between text-xs text-app-subtle">
                <span>{template.section_definitions?.length || 0} sections</span>
                <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
