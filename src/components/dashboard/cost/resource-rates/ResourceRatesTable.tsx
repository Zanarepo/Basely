import { Search, Trash2, Upload, Plus, Save, X, Edit2 } from 'lucide-react'
import { ResourceRate, ResourceType, ResourceUnit } from '@/lib/cost/types'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

interface ResourceRatesTableProps {
  hasEditAccess: boolean
  projectCurrency: string
  resourceRatesLength: number
  filteredRates: ResourceRate[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedIds: string[]
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBulkDelete: () => void
  setIsImporting: (val: boolean) => void
  isCreating: boolean
  startCreate: () => void
  editingId: string | null
  name: string
  setName: (val: string) => void
  type: ResourceType
  setType: (val: ResourceType) => void
  rate: number
  setRate: (val: number) => void
  unit: ResourceUnit
  setUnit: (val: ResourceUnit) => void
  handleSave: () => void
  cancelEdit: () => void
  startEdit: (r: ResourceRate) => void
  handleDelete: (id: string) => void
}

export function ResourceRatesTable({
  hasEditAccess,
  projectCurrency,
  resourceRatesLength,
  filteredRates,
  searchTerm,
  setSearchTerm,
  selectedIds,
  setSelectedIds,
  handleSelectAll,
  handleBulkDelete,
  setIsImporting,
  isCreating,
  startCreate,
  editingId,
  name,
  setName,
  type,
  setType,
  rate,
  setRate,
  unit,
  setUnit,
  handleSave,
  cancelEdit,
  startEdit,
  handleDelete
}: ResourceRatesTableProps) {
  return (
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
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ResourceType)}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
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
                      className="w-24 bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
                    />
                    <span className="text-app-muted">/</span>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value as ResourceUnit)}
                      className="bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
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
                        className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={type}
                        onChange={e => setType(e.target.value as ResourceType)}
                        className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
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
                          className="w-24 bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
                        />
                        <span className="text-app-muted">/</span>
                        <select
                          value={unit}
                          onChange={e => setUnit(e.target.value as ResourceUnit)}
                          className="bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-app-fg"
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

            {resourceRatesLength === 0 && !isCreating && (
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
  )
}
