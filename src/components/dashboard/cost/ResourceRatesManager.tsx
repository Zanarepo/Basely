'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, Save, X, Percent, Search, Upload } from 'lucide-react'
import { ResourceRate, ResourceType, ResourceUnit } from '@/lib/cost/types'
import { createResourceRate, updateResourceRate, deleteResourceRate, updateGlobalOverhead, updateProjectContingency, bulkDeleteResourceRates } from '@/lib/cost/actions'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { ResourceRatesImportModal } from './ResourceRatesImportModal'

interface ResourceRatesManagerProps {
  projectId: string
  resourceRates: ResourceRate[]
  projectCurrency: string
  globalOverhead: number
  contingencyAmount: number
  contingencyType: 'flat' | 'percentage'
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function ResourceRatesManager({
  projectId,
  resourceRates,
  projectCurrency,
  globalOverhead,
  contingencyAmount,
  contingencyType,
  hasEditAccess,
  onDataChange
}: ResourceRatesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<ResourceType>('labor')
  const [rate, setRate] = useState<number>(0)
  const [unit, setUnit] = useState<ResourceUnit>('hr')

  // Overhead state
  const [isEditingOverhead, setIsEditingOverhead] = useState(false)
  const [overheadVal, setOverheadVal] = useState<string>(globalOverhead.toString())

  // Contingency state
  const [isEditingContingency, setIsEditingContingency] = useState(false)
  const [contingencyVal, setContingencyVal] = useState<string>(contingencyAmount?.toString() || '0')
  const [selectedContingencyType, setSelectedContingencyType] = useState<'flat' | 'percentage'>(contingencyType || 'flat')
  
  // Settings tab state
  const [activeSettingsTab, setActiveSettingsTab] = useState<'overhead' | 'contingency'>('overhead')

  const filteredRates = useMemo(() => {
    if (!searchTerm.trim()) return resourceRates;
    const lowerSearch = searchTerm.toLowerCase();
    return resourceRates.filter(r => 
      r.name.toLowerCase().includes(lowerSearch) || 
      r.type.toLowerCase().includes(lowerSearch)
    );
  }, [resourceRates, searchTerm]);

  const startCreate = () => {
    setName('')
    setType('labor')
    setRate(0)
    setUnit('hr')
    setIsCreating(true)
    setEditingId(null)
  }

  const startEdit = (r: ResourceRate) => {
    setName(r.name)
    setType(r.type)
    setRate(r.rate)
    setUnit(r.unit)
    setEditingId(r.id)
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      if (isCreating) {
        await createResourceRate(projectId, {
          name, type, rate, unit, currency: projectCurrency
        })
      } else if (editingId) {
        await updateResourceRate(editingId, {
          name, type, rate, unit, currency: projectCurrency
        })
      }
      onDataChange()
      cancelEdit()
    } catch (error) {
      console.error('Failed to save resource rate:', error)
      alert('Failed to save resource rate.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource? Any existing assignments will be removed or broken.')) return
    try {
      await deleteResourceRate(id)
      onDataChange()
      setSelectedIds(prev => prev.filter(s => s !== id))
    } catch (error) {
      console.error('Failed to delete resource rate:', error)
      alert('Failed to delete resource rate. It might be assigned to activities.')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} resources?`)) return
    
    try {
      await bulkDeleteResourceRates(selectedIds)
      setSelectedIds([])
      onDataChange()
    } catch (error) {
      console.error('Failed to bulk delete resource rates:', error)
      alert('Failed to delete resource rates.')
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRates.map(r => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSaveOverhead = async () => {
    try {
      const val = parseFloat(overheadVal)
      if (isNaN(val) || val < 0) return
      await updateGlobalOverhead(projectId, val)
      onDataChange()
      setIsEditingOverhead(false)
    } catch (error) {
      console.error('Failed to save overhead:', error)
      alert('Failed to save overhead')
    }
  }

  const handleSaveContingency = async () => {
    try {
      const val = parseFloat(contingencyVal)
      if (isNaN(val) || val < 0) return
      await updateProjectContingency(projectId, val, selectedContingencyType)
      onDataChange()
      setIsEditingContingency(false)
    } catch (error) {
      console.error('Failed to save contingency:', error)
      alert('Failed to save contingency')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center gap-6 border-b border-app-border px-6 pt-4 bg-app-bg/50">
          <button 
            onClick={() => setActiveSettingsTab('overhead')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeSettingsTab === 'overhead' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-app-muted hover:text-app-fg'}`}
          >
            Global Overhead
          </button>
          <button 
            onClick={() => setActiveSettingsTab('contingency')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeSettingsTab === 'contingency' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-app-muted hover:text-app-fg'}`}
          >
            Project Contingency
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeSettingsTab === 'overhead' && (
            <div className="flex items-center justify-between group">
              <div>
                <h3 className="text-lg font-semibold text-app-fg">Global Project Overhead</h3>
                <p className="text-sm text-app-muted">Applied on top of direct costs (labor + material) during roll-up.</p>
              </div>
              {hasEditAccess && (
                <div>
                  {isEditingOverhead ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={overheadVal}
                          onChange={e => setOverheadVal(e.target.value)}
                          className="w-24 px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"
                        />
                        <Percent className="w-3 h-3 text-app-muted absolute right-3 top-2.5" />
                      </div>
                      <button onClick={handleSaveOverhead} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setIsEditingOverhead(false); setOverheadVal(globalOverhead.toString()) }} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-app-fg">{globalOverhead}%</span>
                      <button onClick={() => setIsEditingOverhead(true)} className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-app-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSettingsTab === 'contingency' && (
            <div className="flex items-center justify-between group">
              <div>
                <h3 className="text-lg font-semibold text-app-fg">Project Contingency</h3>
                <p className="text-sm text-app-muted">A reserve pool added to the final project total for unforeseen risks.</p>
              </div>
              {hasEditAccess && (
                <div>
                  {isEditingContingency ? (
                    <div className="flex items-center gap-3">
                      <div className="flex bg-app-bg border border-app-border rounded-lg p-0.5">
                        <button
                          onClick={() => setSelectedContingencyType('flat')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${selectedContingencyType === 'flat' ? 'bg-app-surface shadow-sm text-app-fg' : 'text-app-muted hover:text-app-fg'}`}
                        >
                          Flat Amount
                        </button>
                        <button
                          onClick={() => setSelectedContingencyType('percentage')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${selectedContingencyType === 'percentage' ? 'bg-app-surface shadow-sm text-app-fg' : 'text-app-muted hover:text-app-fg'}`}
                        >
                          Percentage
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        {selectedContingencyType === 'flat' ? (
                          <span className="absolute left-3 text-app-muted font-medium">{projectCurrency === 'USD' ? '$' : projectCurrency === 'EUR' ? '€' : projectCurrency}</span>
                        ) : (
                          <Percent className="w-3 h-3 text-app-muted absolute right-3 top-2.5" />
                        )}
                        <input
                          type="number"
                          value={contingencyVal}
                          onChange={e => setContingencyVal(e.target.value)}
                          className={`w-32 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${selectedContingencyType === 'flat' ? 'pl-8 pr-3' : 'pl-3 pr-8'}`}
                        />
                      </div>
                      <button onClick={handleSaveContingency} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setIsEditingContingency(false); setContingencyVal(contingencyAmount?.toString() || '0'); setSelectedContingencyType(contingencyType || 'flat'); }} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-app-fg">
                        {contingencyType === 'percentage' 
                          ? `${contingencyAmount}%` 
                          : <CurrencyDisplay amount={contingencyAmount || 0} currency={projectCurrency} compactThreshold={1000} />}
                      </span>
                      <button onClick={() => setIsEditingContingency(true)} className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-app-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-app-bg/50">
          <h3 className="font-semibold text-app-fg">Resource Rates</h3>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-app-fg"
              />
            </div>
            {hasEditAccess && !isCreating && (
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={() => setIsImporting(true)}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-app-muted-surface hover:bg-app-hover border border-app-border text-app-fg rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </button>
                <button
                  onClick={startCreate}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-bg border-b border-app-border text-app-muted">
              <tr>
                <th className="px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredRates.length && filteredRates.length > 0}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {isCreating && (
                <tr className="bg-indigo-500/5">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="e.g. Senior Engineer"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as ResourceType)}
                      className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="labor">Labor</option>
                      <option value="material">Material</option>
                      <option value="fixed">Fixed Cost</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-app-muted">{projectCurrency}</span>
                      <input
                        type="number"
                        value={rate}
                        onChange={e => setRate(parseFloat(e.target.value))}
                        className="w-24 bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-app-muted">/</span>
                      <select
                        value={unit}
                        onChange={e => setUnit(e.target.value as ResourceUnit)}
                        className="bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="hr">hr</option>
                        <option value="day">day</option>
                        <option value="unit">unit</option>
                        <option value="flat">flat</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSave} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredRates.map(r => {
                const isEditing = editingId === r.id
                if (isEditing) {
                  return (
                    <tr key={r.id} className="bg-indigo-500/5">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={type}
                          onChange={e => setType(e.target.value as ResourceType)}
                          className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="labor">Labor</option>
                          <option value="material">Material</option>
                          <option value="fixed">Fixed Cost</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-app-muted">{projectCurrency}</span>
                          <input
                            type="number"
                            value={rate}
                            onChange={e => setRate(parseFloat(e.target.value))}
                            className="w-24 bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-app-muted">/</span>
                          <select
                            value={unit}
                            onChange={e => setUnit(e.target.value as ResourceUnit)}
                            className="bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="hr">hr</option>
                            <option value="day">day</option>
                            <option value="unit">unit</option>
                            <option value="flat">flat</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={handleSave} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={r.id} className={`hover:bg-app-hover transition-colors group ${selectedIds.includes(r.id) ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, r.id])
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== r.id))
                          }
                        }}
                        className={`w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer transition-opacity duration-200 ${selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-app-fg">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        r.type === 'labor' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        r.type === 'material' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-purple-500/10 text-purple-500 border-purple-500/20'
                      }`}>
                        {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-app-muted">
                      <CurrencyDisplay amount={r.rate} currency={projectCurrency} compactThreshold={1000} /> <span className="text-xs">/ {r.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasEditAccess && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)} className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-app-bg rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}

              {resourceRates.length === 0 && !isCreating && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-app-muted">
                    <p>No resource rates defined yet.</p>
                    {hasEditAccess && (
                      <button onClick={startCreate} className="mt-2 text-indigo-500 hover:text-indigo-400 font-medium text-sm">
                        Create your first resource
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isImporting && (
        <ResourceRatesImportModal
          projectId={projectId}
          projectCurrency={projectCurrency}
          onClose={() => setIsImporting(false)}
          onSuccess={() => {
            setIsImporting(false)
            onDataChange()
          }}
        />
      )}
    </div>
  )
}
