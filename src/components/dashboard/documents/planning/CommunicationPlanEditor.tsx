'use client'

import React, { useState, useEffect } from 'react'
import { useCommunicationPlan } from './hooks/useCommunicationPlan'
import { Save, Plus, Trash2, Pencil, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface CommunicationPlanEditorProps {
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function CommunicationPlanEditor({
  projectId,
  hasEditAccess,
  onShowToast
}: CommunicationPlanEditorProps) {
  const { 
    entries, availableDocs, isLoading, isSaving, error, 
    saveEntry, deleteEntry, prepopulate 
  } = useCommunicationPlan(projectId)
  
  const [stakeholders, setStakeholders] = useState<{id: string, name: string}[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    stakeholder_id: '',
    document_type: '',
    cadence: 'Weekly',
    channel: 'Email'
  })

  // Fetch stakeholders for the dropdown
  useEffect(() => {
    const fetchStakeholders = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('stakeholders')
        .select('id, name')
        .eq('project_id', projectId)
        
      if (data) setStakeholders(data)
    }
    fetchStakeholders()
  }, [projectId])

  const handleOpenForm = (entry?: any) => {
    if (entry) {
      setEditingId(entry.id)
      setFormData({
        stakeholder_id: entry.stakeholder_id,
        document_type: entry.document_type,
        cadence: entry.cadence || '',
        channel: entry.channel || ''
      })
    } else {
      setEditingId(null)
      setFormData({ stakeholder_id: '', document_type: '', cadence: 'Weekly', channel: 'Email' })
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!formData.stakeholder_id || !formData.document_type) {
      onShowToast?.('error', 'Stakeholder and Document Type are required.')
      return
    }
    const success = await saveEntry({ id: editingId || undefined, ...formData })
    if (success) {
      onShowToast?.('success', 'Entry saved successfully.')
      handleCloseForm()
    } else {
      onShowToast?.('error', 'Failed to save entry.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this communication mapping?')) {
      const success = await deleteEntry(id)
      if (success) {
        onShowToast?.('success', 'Entry removed.')
      } else {
        onShowToast?.('error', 'Failed to remove entry.')
      }
    }
  }

  const handlePrepopulate = async () => {
    const success = await prepopulate()
    if (success) {
      onShowToast?.('success', 'Communication Plan pre-populated from Stakeholder Register.')
    } else {
      onShowToast?.('error', 'Failed to pre-populate.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-app-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading Communication Plan...
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-rose-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>Failed to load Communication Plan</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
      <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-bg shrink-0">
        <div>
          <h2 className="text-lg font-bold text-app-fg tracking-tight">Communication Plan</h2>
          <p className="text-sm text-app-muted">Map stakeholders to the documents they receive, cadence, and channels.</p>
        </div>
        
        {hasEditAccess && (
          <div className="flex gap-2">
            <button
              onClick={handlePrepopulate}
              disabled={isSaving}
              className="flex items-center gap-2 bg-app-surface border border-app-border hover:bg-app-hover text-app-fg px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title="Pre-populate from Stakeholder preferences"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Pre-populate</span>
            </button>
            <button
              onClick={() => handleOpenForm()}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Entry</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-0 overflow-y-auto no-scrollbar bg-app-bg/30 flex-1">
        {isFormOpen && (
          <div className="p-4 m-4 bg-app-surface border border-app-border rounded-xl shadow-md">
            <h3 className="font-bold text-app-fg mb-4">{editingId ? 'Edit Mapping' : 'New Mapping'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Stakeholder</label>
                <EnterpriseSelect
                  value={formData.stakeholder_id}
                  onChange={(val) => setFormData({...formData, stakeholder_id: val})}
                  placeholder="Select Stakeholder..."
                  options={[
                    { value: '', label: 'Select Stakeholder...' },
                    ...stakeholders.map(s => ({ value: s.id, label: s.name }))
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Document</label>
                <EnterpriseSelect
                  value={formData.document_type}
                  onChange={(val) => setFormData({...formData, document_type: val})}
                  placeholder="Select Document..."
                  options={[
                    { value: '', label: 'Select Document...' },
                    ...availableDocs.map(d => ({ value: d.id, label: d.name }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Cadence</label>
                <input
                  type="text"
                  value={formData.cadence}
                  onChange={(e) => setFormData({...formData, cadence: e.target.value})}
                  placeholder="e.g. Weekly, Monthly"
                  className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-sm text-app-fg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Channel</label>
                <input
                  type="text"
                  value={formData.channel}
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  placeholder="e.g. Email, Slack"
                  className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-sm text-app-fg outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-app-border">
              <button 
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-semibold text-app-muted hover:text-app-fg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-app-border bg-app-surface/50">
                <th className="px-6 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Stakeholder</th>
                <th className="px-6 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Document Type</th>
                <th className="px-6 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Cadence</th>
                <th className="px-6 py-3 text-xs font-bold text-app-muted uppercase tracking-wider whitespace-nowrap">Channel</th>
                <th className="px-6 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-app-muted">
                    No communication plan mappings yet. Click "Pre-populate" or "New Entry" to begin.
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-app-surface/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-app-fg text-sm">{entry.stakeholders?.name || 'Unknown'}</div>
                      <div className="text-xs text-app-muted">{entry.stakeholders?.role_title || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-app-fg">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 font-medium">
                        {availableDocs.find(d => d.id === entry.document_type)?.name || entry.document_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-app-fg">{entry.cadence || '—'}</td>
                    <td className="px-6 py-4 text-sm text-app-fg">{entry.channel || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {hasEditAccess && (
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenForm(entry)}
                            className="p-1.5 text-app-muted hover:text-indigo-500 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-app-muted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
